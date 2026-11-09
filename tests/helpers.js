import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const OUT = join(import.meta.dir, "..", "out");
export const SITE = "https://walkincat.org";

export function readOut(rel) {
  const file = join(OUT, rel);
  if (!existsSync(file)) throw new Error(`${file} is missing — run \`bun run build\` before \`bun test\`.`);
  return readFileSync(file, "utf8");
}

export const canonicalsOf = (html) => [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => m[1]);
export const robotsOf = (html) => [...html.matchAll(/<meta name="robots" content="([^"]*)"/g)].map((m) => m[1]);
export const metaProperty = (html, prop) =>
  [...html.matchAll(new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`, "g"))].map((m) => m[1]);
export const isNoindex = (html) => robotsOf(html).some((c) => c.split(",").map((s) => s.trim()).includes("noindex"));

/** PNG width/height from the IHDR chunk. */
export function pngSize(buf) {
  if (buf.toString("ascii", 1, 4) !== "PNG") throw new Error("not a PNG");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
