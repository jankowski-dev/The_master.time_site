// One-off generator for the lead-form E2E photo fixture.
//
// Produces a real, decodable RGB PNG that is BOTH larger than the 2 MB client
// compression trigger and wider than the 1600 px resize bound. Content is a
// smooth gradient plus low-amplitude per-pixel noise: the noise makes the
// lossless PNG large (noise is incompressible), while the JPEG encoder discards
// the low-amplitude noise so the compressed result stays well under 2 MB.
// This lets the E2E assert a real size reduction through `compressImage`.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const width = 2000;
const height = 1200;

// Deterministic LCG so the fixture is reproducible.
let state = 0x12345678;
function rand() {
  state = (state * 1664525 + 1013904223) >>> 0;
  return state / 0xffffffff;
}

const NOISE_AMPLITUDE = 40;

const raw = Buffer.alloc(height * (1 + width * 3));
let offset = 0;
for (let y = 0; y < height; y++) {
  raw[offset++] = 0; // filter type 0 (None)
  for (let x = 0; x < width; x++) {
    const r = (x / width) * 255 + (rand() - 0.5) * 2 * NOISE_AMPLITUDE;
    const g = (y / height) * 255 + (rand() - 0.5) * 2 * NOISE_AMPLITUDE;
    const b =
      (Math.sin((x + y) / 50) * 0.5 + 0.5) * 255 + (rand() - 0.5) * 2 * NOISE_AMPLITUDE;
    raw[offset++] = Math.max(0, Math.min(255, Math.round(r)));
    raw[offset++] = Math.max(0, Math.min(255, Math.round(g)));
    raw[offset++] = Math.max(0, Math.min(255, Math.round(b)));
  }
}

// CRC32 over chunk type + data.
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // color type: truecolor RGB
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const png = Buffer.concat([
  signature,
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
]);

const outDir = join(__dirname, '..', 'tests', 'e2e', 'fixtures');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'photo.png');
writeFileSync(outPath, png);
console.log(
  `Wrote ${outPath} (${png.length} bytes, ${width}x${height}) — source ${(png.length / (1024 * 1024)).toFixed(1)} MB`
);
