const MB = 1024 * 1024;

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
