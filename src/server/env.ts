import path from 'node:path';

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET is missing or too short (minimum 16 chars).');
  }
  return new TextEncoder().encode(secret);
}

export function getMediaUploadDir(): string {
  const dir = process.env.MEDIA_UPLOAD_DIR || './uploads';
  return path.resolve(process.cwd(), dir);
}

export function getPublicMediaBaseUrl(): string {
  const base = process.env.PUBLIC_MEDIA_BASE_URL || '/media';
  return base.replace(/\/+$/, '');
}

export function getVenueTimezone(): string {
  return process.env.VENUE_TIMEZONE || 'Asia/Jakarta';
}
