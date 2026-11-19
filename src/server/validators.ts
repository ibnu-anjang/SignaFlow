import { z } from 'zod';
import { apiError } from '@/server/http';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const END_TIME_REGEX = /^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/;

export const loginSchema = z.object({
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const upsertPlaylistSchema = z.object({
  name: z.string().trim().min(1, 'Nama playlist wajib diisi').max(120),
  description: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().optional().default(true),
  items: z.array(
    z.object({
      mediaAssetId: z.string().uuid('mediaAssetId harus berupa UUID'),
      sortOrder: z.number().int().min(0),
      durationSeconds: z.number().int().min(1).max(86_400),
      transition: z.enum(['CUT', 'CROSSFADE']).default('CROSSFADE'),
    }),
  ),
});

export const upsertScheduleSchema = z
  .object({
    name: z.string().trim().min(1, 'Nama jadwal wajib diisi').max(120),
    playlistId: z.string().uuid('playlistId harus berupa UUID'),
    deviceId: z.string().uuid('deviceId harus berupa UUID').nullable(),
    startDate: z.string().regex(DATE_REGEX, 'Format tanggal mulai harus YYYY-MM-DD'),
    endDate: z
      .string()
      .regex(DATE_REGEX, 'Format tanggal selesai harus YYYY-MM-DD')
      .nullable(),
    daysOfWeek: z
      .array(z.number().int().min(0).max(6))
      .min(1, 'Minimal pilih 1 hari'),
    startTime: z.string().regex(TIME_REGEX, 'Format jam mulai harus HH:mm'),
    endTime: z.string().regex(END_TIME_REGEX, 'Format jam selesai harus HH:mm atau 24:00'),
    priority: z.number().int().min(1).max(100).default(50),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'Jam selesai harus lebih besar dari jam mulai',
    path: ['endTime'],
  });

export const pairingRequestSchema = z.object({
  deviceKey: z.string().trim().min(8).max(128),
});

export const claimPairingCodeSchema = z.object({
  pairingCode: z.string().trim().regex(/^\d{6}$/, 'Kode pairing harus 6 digit angka'),
  name: z.string().trim().min(1, 'Nama TV wajib diisi').max(120),
  location: z.string().trim().max(200).optional(),
  fallbackPlaylistId: z.string().uuid().nullable().optional(),
});

export const dispatchCommandSchema = z.object({
  command: z.enum([
    'SYNC_MANIFEST',
    'RELOAD_PLAYER',
    'CLEAR_CACHE',
    'UNPAIR_DEVICE',
  ]),
});

export const heartbeatSchema = z.object({
  currentManifestHash: z.string().nullable(),
  currentPlaylistId: z.string().uuid().nullable(),
  currentMediaId: z.string().uuid().nullable(),
  syncProgress: z.number().int().min(0).max(100),
  freeStorageMb: z.number().min(0).nullable(),
  uptimeSeconds: z.number().int().min(0),
});

export const deviceLogItemSchema = z.object({
  level: z.enum(['INFO', 'WARN', 'ERROR']),
  eventType: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(1000),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const deviceLogsBatchSchema = z.object({
  logs: z.array(deviceLogItemSchema).min(1).max(100),
});

export async function parseJsonBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<
  | { ok: true; data: z.infer<T> }
  | { ok: false; response: ReturnType<typeof apiError> }
> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: apiError('INVALID_JSON', 'Body request bukan JSON yang valid.', 400),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: apiError(
        'VALIDATION_ERROR',
        'Data request tidak valid.',
        400,
        parsed.error.flatten().fieldErrors,
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
