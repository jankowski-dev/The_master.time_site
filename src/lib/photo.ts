import { CLIENT_PHOTO_LIMITS, validatePhotoFiles } from '@/lib/photo-limits';

const MAX_DIMENSION = 1600;
const MAX_JPEG_BYTES = 2 * 1024 * 1024; // 2 МБ
const JPEG_QUALITY = 0.82;

/**
 * Converts an image file to a reasonably sized JPEG (~1600 px, ~2 МБ) so lead
 * emails stay small. Already-small JPEGs pass through unchanged. HEIC/HEIF is
 * attempted via the browser decoder and falls back to the Instagram/Viber error
 * when the browser cannot decode it.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/jpeg' && file.size <= MAX_JPEG_BYTES) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, MAX_DIMENSION / longest);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas context unavailable');

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('encode failed'))),
        'image/jpeg',
        JPEG_QUALITY
      );
    });

    const name = file.name.replace(/\.\w+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    throw new Error('Не удалось обработать фото. Отправьте его в Instagram или Viber.');
  }
}

/**
 * Validates files against the client limits, compresses them, then re-checks
 * the total size. Throws a user-readable `Error` on any limit violation.
 */
export async function preparePhotos(
  files: File[],
  compress: (file: File) => Promise<File> = compressImage
): Promise<File[]> {
  const precheck = validatePhotoFiles(
    files.map((file) => ({ type: file.type, size: file.size, name: file.name })),
    CLIENT_PHOTO_LIMITS
  );
  if (precheck) throw new Error(precheck);

  const prepared = await Promise.all(files.map(compress));

  const postcheck = validatePhotoFiles(
    prepared.map((file) => ({ type: file.type, size: file.size, name: file.name })),
    CLIENT_PHOTO_LIMITS
  );
  if (postcheck) throw new Error(postcheck);

  return prepared;
}
