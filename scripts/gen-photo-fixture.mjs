// One-off generator for the lead-form E2E photo fixture.
// Produces a real, decodable RGB PNG (gradient + variation) so the browser can
// decode it via createImageBitmap and the client compression path converts it
// to JPEG. Kept small (~tens of KB) on purpose: the E2E proves conversion to
// JPEG and a submitted size <= 2MB, not a specific source byte count.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const width = 640;
const height = 480;

// Build raw scanlines: RGB, filter byte 0 per row, with a gradient + bands so
// it is clearly a non-trivial image.
const raw = Buffer.alloc(height * (1 + width * 3));
let offset = 0;
for (let y = 0; y < height; y++) {
  raw[offset++] = 0; // filter type 0 (None)
  for (let x = 0; x < width; x++) {
    const r = Math.round((x / width) * 255);
    const g = Math.round((y / height) * 255);
    const b = Math.round((Math.sin((x + y) / 40) * 0.5 + 0.5) * 255);
    raw[offset++] = r;
    raw[offset++] = g;
    raw[offset++] = b;
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
console.log(`Wrote ${outPath} (${png.length} bytes)`);
