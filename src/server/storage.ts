import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { MediaType } from '@/types/contracts';
import { getMediaUploadDir, getPublicMediaBaseUrl } from '@/server/env';

const ALLOWED_MIME_TO_EXT: Record<string, { ext: string; type: MediaType }> = {
  'image/jpeg': { ext: '.jpg', type: 'IMAGE' },
  'image/png': { ext: '.png', type: 'IMAGE' },
  'image/webp': { ext: '.webp', type: 'IMAGE' },
  'video/mp4': { ext: '.mp4', type: 'VIDEO' },
  'video/webm': { ext: '.webm', type: 'VIDEO' },
};

export const MAX_MEDIA_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

export interface StoredMediaResult {
  fileName: string;
  publicUrl: string;
  mimeType: string;
  type: MediaType;
  sizeBytes: number;
  checksumSha256: string;
}

export function detectMediaType(mimeType: string): MediaType | null {
  return ALLOWED_MIME_TO_EXT[mimeType]?.type ?? null;
}

export async function saveUploadedMedia(file: File): Promise<StoredMediaResult> {
  const mimeInfo = ALLOWED_MIME_TO_EXT[file.type];
  if (!mimeInfo) {
    throw new Error(
      `Unsupported media MIME type: ${file.type || 'unknown'}. Allowed: ${Object.keys(ALLOWED_MIME_TO_EXT).join(', ')}`,
    );
  }

  if (file.size <= 0 || file.size > MAX_MEDIA_SIZE_BYTES) {
    throw new Error(
      `Invalid file size (${file.size} bytes). Max allowed: ${MAX_MEDIA_SIZE_BYTES} bytes.`,
    );
  }

  const uploadDir = getMediaUploadDir();
  await fs.mkdir(uploadDir, { recursive: true });

  const fileName = `${crypto.randomUUID()}${mimeInfo.ext}`;
  const targetPath = path.join(uploadDir, fileName);

  const hash = crypto.createHash('sha256');
  const fileHandle = await fs.open(targetPath, 'w');
  let sizeBytes = 0;

  try {
    const reader = file.stream().getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value && value.byteLength > 0) {
        hash.update(value);
        await fileHandle.write(value);
        sizeBytes += value.byteLength;
      }
    }
  } catch (err) {
    await fileHandle.close();
    await fs.unlink(targetPath).catch(() => {});
    throw err;
  }

  await fileHandle.close();

  return {
    fileName,
    publicUrl: `${getPublicMediaBaseUrl()}/${fileName}`,
    mimeType: file.type,
    type: mimeInfo.type,
    sizeBytes,
    checksumSha256: hash.digest('hex'),
  };
}

export async function deleteStoredMedia(fileName: string): Promise<void> {
  const safeName = path.basename(fileName);
  if (!safeName || safeName !== fileName) {
    throw new Error('Invalid file name.');
  }

  const targetPath = path.join(getMediaUploadDir(), safeName);
  try {
    await fs.unlink(targetPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  }
}
