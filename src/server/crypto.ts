import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function sha256Hex(input: string | Buffer | Uint8Array): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function generatePairingCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function generateDeviceToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = sha256Hex(rawToken);
  return { rawToken, tokenHash };
}

export function computeManifestHash(payload: unknown): string {
  return sha256Hex(JSON.stringify(payload));
}
