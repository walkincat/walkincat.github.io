// Crops the cat head (ears to chin, with the sunglasses and the white sticker outline) out of
// public/ip-skate-cat.webp and writes the site icons:
//   public/favicon.ico          16, 32 and 48 px (PNG-encoded entries), transparent background
//   public/icon-192.png         transparent background
//   public/icon-512.png         transparent background
//   public/apple-touch-icon.png 180x180, opaque, filled with --wc-paper (#f8f8f8)
// Dependencies: playwright (devDependency) with Chromium (`bunx playwright install chromium`),
// used only to decode the WebP and resample on a canvas. PNG and ICO are encoded here with node:zlib.
// Usage: bun scripts/make-favicon.ts
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { chromium } from "playwright";

const ROOT = join(import.meta.dir, "..");
const SRC = join(ROOT, "public", "ip-skate-cat.webp");

// Crop box in source pixels (the WebP is 560x791): ears to chin, plus room for the closing band below.
const CROP = { x: 26, y: 0, width: 524, height: 446 };
// In the artwork the chin line is the top edge of the collar. It follows y = cy - k * (x - cx)^2
// (source pixels, fitted to the bottom of that dark line). Everything below it is removed, and a white
// sticker band with a dark outer line is drawn under it, so the head is closed like the rest of the sticker.
const CHIN = { cx: 296, cy: 423.5, k: 0.001 };
const BAND = { white: 15, outline: 4, color: [58, 58, 58] };
// Share of the square icon taken by the longer side of the crop.
const FILL = { transparent: 1, apple: 0.84 };
const APPLE_BG = "#f8f8f8";

type Job = { name: string; size: number; fill: number; background: string | null };
const JOBS: Job[] = [
  { name: "ico-16", size: 16, fill: FILL.transparent, background: null },
  { name: "ico-32", size: 32, fill: FILL.transparent, background: null },
  { name: "ico-48", size: 48, fill: FILL.transparent, background: null },
  { name: "icon-192", size: 192, fill: FILL.transparent, background: null },
  { name: "icon-512", size: 512, fill: FILL.transparent, background: null },
  { name: "apple-touch-icon", size: 180, fill: FILL.apple, background: APPLE_BG },
];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

/** RGBA pixels -> PNG. Opaque images are written as RGB (color type 2), so they carry no alpha at all. */
function encodePng(size: number, rgba: Uint8Array, opaque: boolean) {
  const bpp = opaque ? 3 : 4;
  const raw = Buffer.alloc(size * (size * bpp + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * bpp + 1);
    for (let x = 0; x < size; x++) {
      const s = (y * size + x) * 4;
      const d = row + 1 + x * bpp;
      raw[d] = rgba[s];
      raw[d + 1] = rgba[s + 1];
      raw[d + 2] = rgba[s + 2];
      if (!opaque) raw[d + 3] = rgba[s + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = opaque ? 2 : 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function encodeIco(images: { size: number; png: Buffer }[]) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const e = 6 + i * 16;
    header[e] = size >= 256 ? 0 : size;
    header[e + 1] = size >= 256 ? 0 : size;
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(png.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.png)]);
}

const browser = await chromium.launch();
let pixels: Record<string, number[]>;
try {
  const page = await browser.newPage();
  const src = `data:image/webp;base64,${readFileSync(SRC).toString("base64")}`;
  pixels = await page.evaluate(
    async ({ src, crop, chin, band, jobs }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const head = document.createElement("canvas");
      head.width = crop.width;
      head.height = crop.height;
      const hctx = head.getContext("2d")!;
      hctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

      const data = hctx.getImageData(0, 0, crop.width, crop.height);
      const px = data.data;
      const topOf = (x: number) => Math.round(chin.cy - chin.k * (x + crop.x + 0.5 - chin.cx) ** 2 - crop.y);
      // The band spans the columns where the sticker reaches the chin curve, with a dark cap at each end.
      const covered = Array.from({ length: crop.width }, (_, x) => px[((topOf(x) - 2) * crop.width + x) * 4 + 3] > 200);
      const first = covered.indexOf(true);
      const last = covered.lastIndexOf(true);
      // Just above the band at both sides, the sticker has a notch under the whisker bump.
      // Where a transparent pixel sits within NOTCH rows above the band, those rows become sticker white.
      // The notch's own outline is cleared too, by widening the notch by NOTCH_PAD columns.
      const NOTCH = 14;
      const NOTCH_PAD = 6;
      const light = (i: number) => px[i + 3] > 200 && px[i] + px[i + 1] + px[i + 2] > 3 * 245;
      const above = (x: number) => {
        const top = topOf(x);
        let hole = false;
        let y = top - 1;
        for (; y >= top - NOTCH; y--) {
          const i = (y * crop.width + x) * 4;
          if (light(i)) break;
          if (px[i + 3] <= 200) hole = true;
        }
        return { hole, from: y + 1, top };
      };
      const holes = Array.from({ length: crop.width }, (_, x) => x >= first && x <= last && above(x).hole);
      for (let x = first; x <= last; x++) {
        if (!holes.slice(Math.max(0, x - NOTCH_PAD), x + NOTCH_PAD + 1).includes(true)) continue;
        const { from, top } = above(x);
        for (let r = from; r < top; r++) px.set([255, 255, 255, 255], (r * crop.width + x) * 4);
      }
      for (let x = 0; x < crop.width; x++) {
        const top = topOf(x);
        const inBand = x >= first && x <= last;
        const cap = x - first < band.outline || last - x < band.outline;
        for (let y = top; y < crop.height; y++) {
          const i = (y * crop.width + x) * 4;
          const d = y - top;
          if (inBand && d < band.white + band.outline) {
            px.set(cap || d >= band.white ? [...band.color, 255] : [255, 255, 255, 255], i);
          } else px.set([0, 0, 0, 0], i);
        }
      }
      hctx.putImageData(data, 0, 0);

      // Halve until close to the target so small sizes are averaged over many source pixels.
      const scaled = (w: number, h: number) => {
        let cur: HTMLCanvasElement = head;
        while (cur.width / 2 >= w) {
          const next = document.createElement("canvas");
          next.width = Math.round(cur.width / 2);
          next.height = Math.round(cur.height / 2);
          const ctx = next.getContext("2d")!;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(cur, 0, 0, next.width, next.height);
          cur = next;
        }
        return cur;
      };

      const out: Record<string, number[]> = {};
      for (const job of jobs) {
        const k = (job.size * job.fill) / Math.max(crop.width, crop.height);
        const w = crop.width * k;
        const h = crop.height * k;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = job.size;
        const ctx = canvas.getContext("2d")!;
        if (job.background) {
          ctx.fillStyle = job.background;
          ctx.fillRect(0, 0, job.size, job.size);
        }
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(scaled(w, h), (job.size - w) / 2, (job.size - h) / 2, w, h);
        out[job.name] = Array.from(ctx.getImageData(0, 0, job.size, job.size).data);
      }
      return out;
    },
    { src, crop: CROP, chin: CHIN, band: BAND, jobs: JOBS },
  );
} finally {
  await browser.close();
}

const png = (job: Job) => encodePng(job.size, Uint8Array.from(pixels[job.name]), job.background !== null);
const byName = Object.fromEntries(JOBS.map((j) => [j.name, j]));

const write = (file: string, buf: Buffer) => {
  writeFileSync(join(ROOT, "public", file), buf);
  console.log(`[favicon] wrote public/${file} (${buf.length} bytes)`);
};
write("favicon.ico", encodeIco([16, 32, 48].map((size) => ({ size, png: png(byName[`ico-${size}`]) }))));
write("icon-192.png", png(byName["icon-192"]));
write("icon-512.png", png(byName["icon-512"]));
write("apple-touch-icon.png", png(byName["apple-touch-icon"]));
