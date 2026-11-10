// Post-build step: subset the self-hosted fonts to the characters that appear
// in the exported HTML, and write them to out/fonts/ (paths match app/globals.css
// and the preload links in app/layout.tsx).
//
// Post bodies (.wc-prose) are split off: characters that appear only in post bodies go to a second
// file, noto-sans-tc-prose.woff2 ("Noto Sans TC Prose", after "Noto Sans TC" in --wc-font-prose), which
// the browser fetches only on pages that need one of them. With 46 migrated posts the body text in a
// single file pushed it past 500 KiB and mobile Lighthouse performance below 90 on every page.
// <script> contents (the RSC payload repeats the post bodies) are left out.
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import subsetFont from "subset-font";
import { SOURCE_FONTS, loadSourceFont } from "./fonts";

const OUT = join(import.meta.dir, "..", "out");

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith(".html") ? [full] : [];
  });
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, n) => ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " })[n as string]!);
}

/** Remove every <div class="wc-prose">…</div> (with nested divs) from the HTML. */
export function stripProse(html: string): string {
  let out = "";
  let i = 0;
  for (;;) {
    const start = html.indexOf('<div class="wc-prose"', i);
    if (start < 0) return out + html.slice(i);
    out += html.slice(i, start);
    const tags = /<div\b|<\/div>/g;
    tags.lastIndex = start;
    let depth = 0;
    let end = html.length;
    for (let m = tags.exec(html); m; m = tags.exec(html)) {
      depth += m[0] === "</div>" ? -1 : 1;
      if (depth === 0) {
        end = tags.lastIndex;
        break;
      }
    }
    i = end;
  }
}

const files = htmlFiles(OUT);
if (files.length === 0) throw new Error("no HTML in out/ — run next build first");

// Every printable ASCII character is always kept so English text and digits never fall back.
const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join("");
const used = new Set<string>(ascii);
const proseOnly = new Set<string>();
for (const file of files) {
  const html = readFileSync(file, "utf8").replace(/<script\b[\s\S]*?<\/script>/g, "");
  for (const ch of decodeEntities(stripProse(html))) {
    if (ch.codePointAt(0)! > 0x7f) used.add(ch);
  }
  for (const ch of decodeEntities(html)) {
    if (ch.codePointAt(0)! > 0x7f) proseOnly.add(ch);
  }
}
for (const ch of used) proseOnly.delete(ch);
const text = [...used].join("");

const jobs = [
  {
    out: "noto-sans-tc.woff2",
    font: SOURCE_FONTS.notoSansTC,
    text,
    axes: { wght: { min: 400, max: 700 } },
  },
  {
    out: "noto-sans-tc-prose.woff2",
    font: SOURCE_FONTS.notoSansTC,
    text: [...proseOnly].join("") || " ",
    axes: { wght: { min: 400, max: 700 } },
  },
  { out: "nunito-800.woff2", font: SOURCE_FONTS.nunito, text: ascii, axes: { wght: 800 } },
  { out: "ibm-plex-mono-400.woff2", font: SOURCE_FONTS.plexMono, text: ascii, axes: undefined },
];

mkdirSync(join(OUT, "fonts"), { recursive: true });
for (const job of jobs) {
  const { data } = await loadSourceFont(job.font);
  const subset = await subsetFont(data, job.text, {
    targetFormat: "woff2",
    ...(job.axes ? { variationAxes: job.axes } : {}),
  });
  const target = join(OUT, "fonts", job.out);
  writeFileSync(target, subset);
  console.log(`[fonts] ${relative(OUT, target)} ${(subset.length / 1024).toFixed(1)} KiB`);
}
console.log(`[fonts] ${used.size} unique characters outside post bodies, ${proseOnly.size} more only in post bodies, from ${files.length} HTML files`);
