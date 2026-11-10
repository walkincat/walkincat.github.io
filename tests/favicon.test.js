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

/** Number of pixels with alpha < 255 in an 8-bit RGBA or RGB PNG. */
function transparentPixels(buf) {
  const chunks = pngChunks(buf);
  const ihdr = chunks.find((c) => c.type === "IHDR").data;
  const [w, h, depth, color] = [ihdr.readUInt32BE(0), ihdr.readUInt32BE(4), ihdr[8], ihdr[9]];
  if (chunks.some((c) => c.type === "tRNS")) return Infinity;
  if (depth !== 8) throw new Error(`unsupported bit depth ${depth}`);
  if (color === 2) return 0;
  if (color !== 6) throw new Error(`unsupported color type ${color}`);
  const raw = inflateSync(Buffer.concat(chunks.filter((c) => c.type === "IDAT").map((c) => c.data)));
  const bpp = 4;
  const stride = w * bpp;
  const prev = new Uint8Array(stride);
  const row = new Uint8Array(stride);
  let count = 0;
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
    for (let x = 3; x < stride; x += 4) if (row[x] < 255) count++;
    prev.set(row);
  }
  return count;
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
