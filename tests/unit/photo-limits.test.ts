import { describe, it, expect } from 'vitest';
import {
  CLIENT_PHOTO_LIMITS,
  SERVER_PHOTO_LIMITS,
  validatePhotoFiles
} from '@/lib/photo-limits';

const MB = 1024 * 1024;

function file(type: string, size: number, name = 'a.jpg') {
  return { type, size, name };
}

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
