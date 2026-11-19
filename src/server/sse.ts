import type { KioskSSEEvent } from '@/types/contracts';

type SSEClient = {
  send: (event: KioskSSEEvent) => void;
  close: () => void;
};

type SSEHub = Map<string, Set<SSEClient>>;

const globalForSSE = globalThis as unknown as {
  __signaflowSseHub?: SSEHub;
};

const hub: SSEHub = globalForSSE.__signaflowSseHub ?? new Map();
if (!globalForSSE.__signaflowSseHub) {
  globalForSSE.__signaflowSseHub = hub;
}

const encoder = new TextEncoder();
const PING_INTERVAL_MS = 25_000;

function formatSSEMessage(event: KioskSSEEvent): Uint8Array {
  return encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

export function createKioskSSEStream(
  deviceId: string,
  signal?: AbortSignal,
): ReadableStream<Uint8Array> {
  let cleanup = () => {};

  return new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const send = (event: KioskSSEEvent) => {
        if (closed) return;
        try {
          controller.enqueue(formatSSEMessage(event));
        } catch {
          cleanup();
        }
      };

      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // Stream already closed
        }
      };

      const client: SSEClient = { send, close };

      let clients = hub.get(deviceId);
      if (!clients) {
        clients = new Set();
        hub.set(deviceId, clients);
      }
      clients.add(client);

      const pingTimer = setInterval(() => {
        send({ type: 'PING', serverTimestampMs: Date.now() });
      }, PING_INTERVAL_MS);

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(pingTimer);
        const set = hub.get(deviceId);
        if (set) {
          set.delete(client);
          if (set.size === 0) {
            hub.delete(deviceId);
          }
        }
      };

      if (signal) {
        if (signal.aborted) {
          cleanup();
          close();
          return;
        }
        signal.addEventListener('abort', () => {
          cleanup();
          close();
        });
      }

      send({
        type: 'CONNECTED',
        deviceId,
        serverTimestampMs: Date.now(),
      });
    },
    cancel() {
      cleanup();
    },
  });
}

export function sendKioskEvent(deviceId: string, event: KioskSSEEvent): number {
  const clients = hub.get(deviceId);
  if (!clients || clients.size === 0) return 0;

  let delivered = 0;
  for (const client of clients) {
    client.send(event);
    delivered++;
  }
  return delivered;
}

export function broadcastKioskEvent(event: KioskSSEEvent): number {
  let delivered = 0;
  for (const clients of hub.values()) {
    for (const client of clients) {
      client.send(event);
      delivered++;
    }
  }
  return delivered;
}

export function getConnectedDeviceIds(): string[] {
  return Array.from(hub.keys());
}

export const SSE_RESPONSE_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
} as const;
