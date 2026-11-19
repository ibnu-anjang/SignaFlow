import { apiOk } from '@/server/http';

export const dynamic = 'force-dynamic';

export function GET() {
  return apiOk({
    status: 'ok',
    service: 'signaflow',
    uptimeSeconds: Math.floor(process.uptime()),
  });
}
