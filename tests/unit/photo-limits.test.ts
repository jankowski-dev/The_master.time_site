import { describe, it, expect } from 'vitest';
import {
  CLIENT_PHOTO_LIMITS,
  SERVER_PHOTO_LIMITS,
  detectImageType,
  validatePhotoFiles,
  verifyImageSignature
} from '@/lib/photo-limits';

const MB = 1024 * 1024;

function file(type: string, size: number, name = 'a.jpg') {
  return { type, size, name };
}

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const WEBP = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50
]);

describe('detectImageType', () => {
  it('detects JPEG', () => {
    expect(detectImageType(JPEG)).toBe('image/jpeg');
  });

  it('detects PNG', () => {
    expect(detectImageType(PNG)).toBe('image/png');
  });

  it('detects WebP', () => {
    expect(detectImageType(WEBP)).toBe('image/webp');
  });

  it('returns null for an empty buffer', () => {
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });

  it('returns null for truncated/unknown bytes', () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8]))).toBeNull();
    expect(detectImageType(Buffer.from('hello world'))).toBeNull();
  });
});

describe('verifyImageSignature', () => {
  it('accepts a buffer matching its declared type', () => {
    expect(verifyImageSignature(JPEG, 'image/jpeg')).toBe(true);
    expect(verifyImageSignature(PNG, 'image/png')).toBe(true);
    expect(verifyImageSignature(WEBP, 'image/webp')).toBe(true);
  });

  it('rejects a PNG buffer declared as image/jpeg', () => {
    expect(verifyImageSignature(PNG, 'image/jpeg')).toBe(false);
  });

  it('rejects an empty/truncated buffer', () => {
    expect(verifyImageSignature(Buffer.alloc(0), 'image/jpeg')).toBe(false);
    expect(verifyImageSignature(Buffer.from([0xff, 0xd8]), 'image/jpeg')).toBe(false);
  });
});

describe('SERVER_PHOTO_LIMITS', () => {
  it('rejects HEIC', () => {
    expect(validatePhotoFiles([file('image/heic', 1000)], SERVER_PHOTO_LIMITS)).toBe(
      'Только фото'
    );
  });

  it('rejects a 5MB file', () => {
    expect(validatePhotoFiles([file('image/jpeg', 5 * MB)], SERVER_PHOTO_LIMITS)).toBe(
      'Файл больше 4 МБ'
    );
  });

  it('rejects four files', () => {
    const files = [1, 2, 3, 4].map((i) => file('image/jpeg', 1000, `p${i}.jpg`));
    expect(validatePhotoFiles(files, SERVER_PHOTO_LIMITS)).toBe('Не более 3 фото');
  });

  it('rejects a total over 10MB', () => {
    const files = [1, 2, 3].map((i) => file('image/jpeg', 3.5 * MB, `p${i}.jpg`));
    expect(validatePhotoFiles(files, SERVER_PHOTO_LIMITS)).toBe('Общий размер больше 10 МБ');
  });

  it('accepts three 3MB JPEGs', () => {
    const files = [1, 2, 3].map((i) => file('image/jpeg', 3 * MB, `p${i}.jpg`));
    expect(validatePhotoFiles(files, SERVER_PHOTO_LIMITS)).toBeNull();
  });
});

describe('CLIENT_PHOTO_LIMITS', () => {
  it('accepts HEIC', () => {
    expect(validatePhotoFiles([file('image/heic', 1000)], CLIENT_PHOTO_LIMITS)).toBeNull();
  });

  it('accepts a 5MB file (to be compressed)', () => {
    expect(validatePhotoFiles([file('image/jpeg', 5 * MB)], CLIENT_PHOTO_LIMITS)).toBeNull();
  });

  it('rejects a 13MB file', () => {
    expect(validatePhotoFiles([file('image/jpeg', 13 * MB)], CLIENT_PHOTO_LIMITS)).toBe(
      'Файл больше 12 МБ'
    );
  });

  it('rejects four files', () => {
    const files = [1, 2, 3, 4].map((i) => file('image/jpeg', 1000, `p${i}.jpg`));
    expect(validatePhotoFiles(files, CLIENT_PHOTO_LIMITS)).toBe('Не более 3 фото');
  });
});
