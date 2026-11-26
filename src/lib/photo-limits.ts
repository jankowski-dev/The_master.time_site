const MB = 1024 * 1024;

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP = [0x57, 0x45, 0x42, 0x50];

export type ImageType = 'image/jpeg' | 'image/png' | 'image/webp';

function startsWith(buffer: Uint8Array, magic: readonly number[], offset = 0): boolean {
  if (buffer.length < offset + magic.length) return false;
  return magic.every((byte, i) => buffer[offset + i] === byte);
}

/**
 * Detects an image content type from the file's magic bytes, or `null` when the
 * buffer is too short or does not match a known signature. Never trusts a
 * client-declared MIME type.
 */
export function detectImageType(buffer: Uint8Array): ImageType | null {
  if (startsWith(buffer, JPEG_MAGIC)) return 'image/jpeg';
  if (startsWith(buffer, PNG_MAGIC)) return 'image/png';
  if (startsWith(buffer, RIFF) && startsWith(buffer, WEBP, 8)) return 'image/webp';
  return null;
}

/**
 * Verifies that a buffer's magic bytes match its declared content type. Used
 * server-side so a file cannot be smuggled past the MIME check by lying about
 * its `Content-Type`.
 */
export function verifyImageSignature(buffer: Uint8Array, contentType: string): boolean {
  return detectImageType(buffer) === contentType;
}

export interface PhotoLimits {
  maxFiles: number;
  maxFileSize: number;
  maxTotalSize: number;
  allowedTypes: readonly string[];
}

/** Client-side limits (before compression): generous so users can attach phone photos. */
export const CLIENT_PHOTO_LIMITS: PhotoLimits = {
  maxFiles: 3,
  maxFileSize: 12 * MB,
  maxTotalSize: 30 * MB,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
};

/** Server-side limits (after compression): strict so email attachments stay small. */
export const SERVER_PHOTO_LIMITS: PhotoLimits = {
  maxFiles: 3,
  maxFileSize: 4 * MB,
  maxTotalSize: 10 * MB,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
};

/**
 * Validates a set of file-like objects against the given limits and returns a
 * user-readable error message, or `null` when everything passes.
 */
export function validatePhotoFiles(
  files: Array<{ type: string; size: number; name: string }>,
  limits: PhotoLimits
): string | null {
  if (files.length > limits.maxFiles) {
    return `Не более ${limits.maxFiles} фото`;
  }

  for (const file of files) {
    if (!limits.allowedTypes.includes(file.type)) {
      return 'Только фото';
    }
    if (file.size > limits.maxFileSize) {
      return `Файл больше ${limits.maxFileSize / MB} МБ`;
    }
  }

  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > limits.maxTotalSize) {
    return `Общий размер больше ${limits.maxTotalSize / MB} МБ`;
  }

  return null;
}
