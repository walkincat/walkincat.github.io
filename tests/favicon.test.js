import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { inflateSync } from "node:zlib";
import { OUT, pngSize, readOut } from "./helpers.js";

const linksOf = (html) => [...html.matchAll(/<link [^>]*>/g)].map((m) => m[0]);
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
const iconLinks = (html) => linksOf(html).filter((l) => /\brel="(icon|shortcut icon|apple-touch-icon)"/.test(l));

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return htmlFiles(p);
    return e.name.endsWith(".html") ? [p] : [];
  });
}

function pngChunks(buf) {
  const chunks = [];
  for (let at = 8; at < buf.length; ) {
    const len = buf.readUInt32BE(at);
    chunks.push({ type: buf.toString("ascii", at + 4, at + 8), data: buf.subarray(at + 8, at + 8 + len) });
    at += 12 + len;
  }
  return chunks;
}

/** Decodes an 8-bit RGB or RGBA PNG to { width, height, rgba }. RGB pixels get alpha 255. */
function decodePng(buf) {
  const chunks = pngChunks(buf);
  const ihdr = chunks.find((c) => c.type === "IHDR").data;
  const [w, h, depth, color] = [ihdr.readUInt32BE(0), ihdr.readUInt32BE(4), ihdr[8], ihdr[9]];
  if (chunks.some((c) => c.type === "tRNS")) throw new Error("tRNS chunk is not supported");
  if (depth !== 8) throw new Error(`unsupported bit depth ${depth}`);
  if (color !== 2 && color !== 6) throw new Error(`unsupported color type ${color}`);
  const raw = inflateSync(Buffer.concat(chunks.filter((c) => c.type === "IDAT").map((c) => c.data)));
  const bpp = color === 6 ? 4 : 3;
  const stride = w * bpp;
  const prev = new Uint8Array(stride);
  const row = new Uint8Array(stride);
  const rgba = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const base = y * (stride + 1);
    const filter = raw[base];
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? row[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      const v = raw[base + 1 + x];
      let p;
      if (filter === 0) p = v;
      else if (filter === 1) p = v + a;
      else if (filter === 2) p = v + b;
      else if (filter === 3) p = v + ((a + b) >> 1);
      else {
        const e = a + b - c;
        const pa = Math.abs(e - a), pb = Math.abs(e - b), pc = Math.abs(e - c);
        p = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      row[x] = p & 255;
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      rgba.set([row[x * bpp], row[x * bpp + 1], row[x * bpp + 2], bpp === 4 ? row[x * bpp + 3] : 255], o);
    }
    prev.set(row);
  }
  return { width: w, height: h, rgba };
}

/** Number of pixels with alpha < 255. */
function transparentPixels(buf) {
  const { rgba } = decodePng(buf);
  let count = 0;
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i] < 255) count++;
  return count;
}

function icoImages(buf) {
  return Array.from({ length: buf.readUInt16LE(4) }, (_, i) => {
    const e = 6 + i * 16;
    const off = buf.readUInt32LE(e + 12);
    return { size: buf[e] || 256, png: buf.subarray(off, off + buf.readUInt32LE(e + 8)) };
  });
}

/**
 * Bounding box of the cat, as the free columns/rows between it and each edge. A pixel is cat when it is not
 * background: any alpha above 0 on the transparent icons, any colour other than `background` on opaque ones.
 */
function catMargins(buf, background) {
  const { width: w, height: h, rgba } = decodePng(buf);
  const isCat = (i) =>
    background ? rgba[i] !== background[0] || rgba[i + 1] !== background[1] || rgba[i + 2] !== background[2] : rgba[i + 3] > 0;
  let x0 = w, x1 = -1, y0 = h, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!isCat((y * w + x) * 4)) continue;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  }
  return { left: x0, right: w - 1 - x1, top: y0, bottom: h - 1 - y1 };
}

describe("icon links in the built HTML", () => {
  const html = readOut("index.html");
  const links = iconLinks(html);

  test('has rel="icon" and rel="apple-touch-icon"', () => {
    expect(links.some((l) => /\brel="icon"/.test(l))).toBe(true);
    expect(links.some((l) => /\brel="apple-touch-icon"/.test(l))).toBe(true);
  });

  test("every icon href exists in out/", () => {
    for (const l of links) {
      const href = attr(l, "href").split("?")[0];
      expect(existsSync(join(OUT, href))).toBe(true);
    }
  });

  test("icons point to favicon.ico, icon-192/512 and apple-touch-icon, not avatar.jpg", () => {
    const hrefs = links.map((l) => attr(l, "href").split("?")[0]);
    expect(hrefs).not.toContain("/avatar.jpg");
    expect(hrefs).toEqual(expect.arrayContaining(["/favicon.ico", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"]));
    const apple = links.find((l) => /\brel="apple-touch-icon"/.test(l));
    expect(attr(apple, "href").split("?")[0]).toBe("/apple-touch-icon.png");
  });
});

describe("avatar.jpg stays only in the existing <img> tags", () => {
  const files = htmlFiles(OUT);

  // React 19 server rendering adds <link rel="preload" as="image"> for the <img> tags it renders
  // (Logo, EmptyState, home hero). That preload belongs to those images, so it is the one allowed <link>.
  const isImagePreload = (l) => attr(l, "rel") === "preload" && attr(l, "as") === "image";

  test("no <link> other than React's image preload points to avatar.jpg", () => {
    const bad = files.filter((f) =>
      linksOf(readFileSync(f, "utf8")).some((l) => l.includes("avatar.jpg") && !isImagePreload(l)),
    );
    expect(bad.map((f) => relative(OUT, f))).toEqual([]);
  });

  test("every other avatar.jpg reference is an <img>", () => {
    for (const f of files) {
      const html = readFileSync(f, "utf8");
      const refs = [...html.matchAll(/<[^>]*avatar\.jpg[^>]*>/g)].map((m) => m[0]);
      for (const r of refs.filter((r) => !(r.startsWith("<link ") && isImagePreload(r)))) {
        expect(r.startsWith("<img ")).toBe(true);
      }
    }
  });
});

describe("icon files", () => {
  test("favicon.ico holds 16, 32 and 48 px images", () => {
    const ico = readFileSync(join(OUT, "favicon.ico"));
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    const count = ico.readUInt16LE(4);
    const sizes = [];
    for (let i = 0; i < count; i++) {
      const e = 6 + i * 16;
      const w = ico[e] || 256;
      const h = ico[e + 1] || 256;
      const len = ico.readUInt32LE(e + 8);
      const off = ico.readUInt32LE(e + 12);
      const img = ico.subarray(off, off + len);
      expect(pngSize(img)).toEqual({ width: w, height: h });
      sizes.push(w);
    }
    expect(sizes.sort((a, b) => a - b)).toEqual([16, 32, 48]);
  });

  test.each([
    ["icon-192.png", 192],
    ["icon-512.png", 512],
    ["apple-touch-icon.png", 180],
  ])("%s is %ipx square", (file, size) => {
    expect(pngSize(readFileSync(join(OUT, file)))).toEqual({ width: size, height: size });
  });

  test("apple-touch-icon.png has no transparent pixels", () => {
    expect(transparentPixels(readFileSync(join(OUT, "apple-touch-icon.png")))).toBe(0);
  });
});

describe("cat placement in every icon", () => {
  const ico = icoImages(readFileSync(join(OUT, "favicon.ico")));
  const icons = [
    ...ico.map(({ size, png }) => [`favicon.ico ${size}px`, png, null]),
    ["icon-192.png", readFileSync(join(OUT, "icon-192.png")), null],
    ["icon-512.png", readFileSync(join(OUT, "icon-512.png")), null],
    ["apple-touch-icon.png", readFileSync(join(OUT, "apple-touch-icon.png")), [0xf8, 0xf8, 0xf8]],
  ];

  test.each(icons)("%s: the cat clears all four edges by at least 1px", (_, png, background) => {
    const m = catMargins(png, background);
    expect(Math.min(m.left, m.right, m.top, m.bottom)).toBeGreaterThanOrEqual(1);
  });

  // A head cut off at one side (the right whiskers, before) leaves a wider margin on the other side.
  test.each(icons)("%s: left and right margins differ by at most 1px", (_, png, background) => {
    const m = catMargins(png, background);
    expect(Math.abs(m.left - m.right)).toBeLessThanOrEqual(1);
  });

  test("favicon.ico 16px: the cat spans the full width inside a 1px margin", () => {
    const m = catMargins(ico.find((i) => i.size === 16).png, null);
    expect([m.left, m.right]).toEqual([1, 1]);
  });
});
