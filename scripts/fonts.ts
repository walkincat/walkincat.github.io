// Source fonts (SIL OFL) pinned to a google/fonts commit and verified by sha256.
// They are downloaded once into .cache/fonts and never committed.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const GOOGLE_FONTS_COMMIT = "5bb28733cec313b63fbd415b574b5ae35c8aa8b8";
export const CACHE_DIR = join(import.meta.dir, "..", ".cache", "fonts");

export type SourceFont = { file: string; path: string; sha256: string };

export const SOURCE_FONTS = {
  notoSansTC: {
    file: "NotoSansTC-wght.ttf",
    path: "ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf",
    sha256: "864727d210d54f2537bbe23b3a839436c3992af72de9322af5270897246bd44f",
  },
  nunito: {
    file: "Nunito-wght.ttf",
    path: "ofl/nunito/Nunito%5Bwght%5D.ttf",
    sha256: "bb55a5ca5c2042335b3991af27c4d0705d0ef41cac6164ac737fd8f2a1e85207",
  },
  plexMono: {
    file: "IBMPlexMono-Regular.ttf",
    path: "ofl/ibmplexmono/IBMPlexMono-Regular.ttf",
    sha256: "6a3412f058c7d8dfd9170c41e85ade48e5156ecb89356110ca57a0a27734af46",
  },
} satisfies Record<string, SourceFont>;

const sha256 = (buf: Buffer) => createHash("sha256").update(buf).digest("hex");

export async function loadSourceFont(font: SourceFont): Promise<{ path: string; data: Buffer }> {
  mkdirSync(CACHE_DIR, { recursive: true });
  const target = join(CACHE_DIR, font.file);
  if (existsSync(target)) {
    const data = readFileSync(target);
    if (sha256(data) === font.sha256) return { path: target, data };
  }
  const url = `https://raw.githubusercontent.com/google/fonts/${GOOGLE_FONTS_COMMIT}/${font.path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font download failed: ${res.status} ${url}`);
  const data = Buffer.from(await res.arrayBuffer());
  const actual = sha256(data);
  if (actual !== font.sha256) throw new Error(`font checksum mismatch for ${font.file}: ${actual}`);
  writeFileSync(target, data);
  return { path: target, data };
}
