import { describe, it, expect } from 'vitest';
import { preparePhotos } from '@/lib/photo';

const MB = 1024 * 1024;

function makeFile(name: string, type: string, size: number): File {
  const bytes = new Uint8Array(Math.min(size, 1024 * 1024));
  return new File([bytes], name, { type });
}

// A compressor that returns a fixed-size JPEG regardless of input.
function fakeCompress(size: number) {
  return async (file: File): Promise<File> => {
    const bytes = new Uint8Array(size);
    return new File([bytes], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
  };
}

describe('preparePhotos', () => {
  it('returns an empty array for no files', async () => {
    await expect(preparePhotos([], fakeCompress(1))).resolves.toEqual([]);
  });

  it('rejects more than three files', async () => {
    const files = [1, 2, 3, 4].map((i) => makeFile(`p${i}.jpg`, 'image/jpeg', MB));
    await expect(preparePhotos(files, fakeCompress(1))).rejects.toThrow('Не более 3 фото');
  });

  it('returns the compressed files', async () => {
    const files = [1, 2, 3].map((i) => makeFile(`p${i}.jpg`, 'image/jpeg', MB));
    const result = await preparePhotos(files, fakeCompress(MB));
    expect(result).toHaveLength(3);
  });

  it('uses the compressor output', async () => {
    const files = [makeFile('big.jpg', 'image/jpeg', 5 * MB)];
    const result = await preparePhotos(files, fakeCompress(Math.round(1.5 * MB)));
    expect(result).toHaveLength(1);
    expect(result[0].size).toBe(Math.round(1.5 * MB));
    expect(result[0].type).toBe('image/jpeg');
  });

  it('propagates a compressor error', async () => {
    const files = [makeFile('p.jpg', 'image/jpeg', MB)];
    const failing = async (): Promise<File> => {
      throw new Error('Не удалось обработать фото. Отправьте его в Instagram или Viber.');
    };
    await expect(preparePhotos(files, failing)).rejects.toThrow(
      'Не удалось обработать фото. Отправьте его в Instagram или Viber.'
    );
  });
});
