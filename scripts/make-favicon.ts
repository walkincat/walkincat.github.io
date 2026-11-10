// Cuts the cat head (ears to chin, with the sunglasses, whiskers and the white sticker outline) out of
// public/ip-skate-cat.webp, measures its bounding box and centres that box in each icon with equal margins.
// It writes the site icons:
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

// Source rows holding the head (the WebP is 560x791): ears to chin, plus room for the closing band below.
// All 560 columns are kept, because the whiskers and the sticker outline reach x = 558. The icons are fitted to
// the bounding box of the pixels left after the chin cut, not to this region.
const CROP = { x: 0, y: 0, width: 560, height: 446 };
// In the artwork the chin line is the top edge of the collar. It follows y = cy - k * (x - cx)^2
// (source pixels, fitted to the bottom of that dark line). Everything below it is removed, and a white
// sticker band with a dark outer line is drawn under it, so the head is closed like the rest of the sticker.
const CHIN = { cx: 296, cy: 423.5, k: 0.001 };
const BAND = { white: 15, outline: 4, color: [58, 58, 58] };
// Margin between the head's bounding box and each edge of the icon, as a share of the icon size.
// The box is centred, so the left and right margins are equal (and top and bottom), up to sub-pixel rounding.
// The head is wider than tall, so the width sets the scale: head width = size * (1 - 2 * margin).
//   16 px:  1/16 = 1 px, the least that still keeps every edge pixel clear
//   32 px:  1/32 = 1 px
//   48 px:  2/48 = 2 px
//   192 px, 512 px: 0.05 (9.6 px, 25.6 px)
//   apple-touch-icon 180 px: 0.08 (14.4 px), leaves the head clear of the iOS rounded corners
const MARGIN = { ico16: 1 / 16, ico32: 1 / 32, ico48: 2 / 48, large: 0.05, apple: 0.08 };
const APPLE_BG = "#f8f8f8";

type Job = { name: string; size: number; margin: number; background: string | null };
const JOBS: Job[] = [
  { name: "ico-16", size: 16, margin: MARGIN.ico16, background: null },
  { name: "ico-32", size: 32, margin: MARGIN.ico32, background: null },
  { name: "ico-48", size: 48, margin: MARGIN.ico48, background: null },
  { name: "icon-192", size: 192, margin: MARGIN.large, background: null },
  { name: "icon-512", size: 512, margin: MARGIN.large, background: null },
  { name: "apple-touch-icon", size: 180, margin: MARGIN.apple, background: APPLE_BG },
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
      // The WebP has faint specks scattered over its transparent background (the ones at x = 2-4 would widen the box
      // by 32 px). Only the largest 8-connected group of pixels with any opacity, the head sticker, is kept.
      const label = new Int32Array(crop.width * crop.height).fill(-1);
      let keep = -1;
      let keepSize = 0;
      for (let start = 0, id = 0; start < label.length; start++) {
        if (label[start] !== -1 || px[start * 4 + 3] === 0) continue;
        const stack = [start];
        label[start] = id;
        let n = 0;
        while (stack.length) {
          const i = stack.pop()!;
          n++;
          const x = i % crop.width;
          const y = (i - x) / crop.width;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= crop.width || ny >= crop.height) continue;
              const j = ny * crop.width + nx;
              if (label[j] !== -1 || px[j * 4 + 3] === 0) continue;
              label[j] = id;
              stack.push(j);
            }
          }
        }
        if (n > keepSize) [keep, keepSize] = [id, n];
        id++;
      }
      for (let i = 0; i < label.length; i++) if (label[i] !== keep) px.set([0, 0, 0, 0], i * 4);
      hctx.putImageData(data, 0, 0);

      // Bounding box of every pixel with any opacity, so whisker tips and the outline's soft edge are inside it.
      let x0 = crop.width, x1 = -1, y0 = crop.height, y1 = -1;
      for (let y = 0; y < crop.height; y++) {
        for (let x = 0; x < crop.width; x++) {
          if (px[(y * crop.width + x) * 4 + 3] === 0) continue;
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
      }
      const box = document.createElement("canvas");
      box.width = x1 - x0 + 1;
      box.height = y1 - y0 + 1;
      box.getContext("2d")!.drawImage(head, x0, y0, box.width, box.height, 0, 0, box.width, box.height);

      // Halve until close to the target so small sizes are averaged over many source pixels.
      const scaled = (w: number, h: number) => {
        let cur: HTMLCanvasElement = box;
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
        const k = (job.size * (1 - 2 * job.margin)) / Math.max(box.width, box.height);
        const w = box.width * k;
        const h = box.height * k;
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
      out.box = [x0 + crop.x, y0 + crop.y, box.width, box.height];
      return out;
    },
    { src, crop: CROP, chin: CHIN, band: BAND, jobs: JOBS },
  );
} finally {
  await browser.close();
}

const [bx, by, bw, bh] = pixels.box;
console.log(`[favicon] head bounding box in the source: x ${bx}-${bx + bw - 1}, y ${by}-${by + bh - 1} (${bw}x${bh})`);
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
