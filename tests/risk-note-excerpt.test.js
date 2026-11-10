import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// risk_note must be quoted from the post body: each item, normalized, is a substring of the normalized body.
//
// Normalization (applied to both the body and each item):
//   1. HTML tags are removed (<img ...>, <br> and the like).
//   2. Markdown images ![alt](url) are removed; links [text](url) keep only text.
//   3. Line-start markup is removed: headings (#), blockquotes (>), list markers (-, *, +, "1."), ::: fences.
//   4. Inline emphasis and code marks are removed: **, __, *, `.
//   5. Every run of whitespace (spaces, tabs, newlines, full-width spaces) becomes one space; the result is trimmed.
// Punctuation, full-width characters and wording are left as they are, so any rewritten or added word fails.

const CONTENT = join(import.meta.dir, "..", "content");

function normalize(text) {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[ \t]*(?:#{1,6}[ \t]+|>[ \t]?|[-*+][ \t]+|\d+\.[ \t]+|:::\S*)/gm, "")
    .replace(/\*\*|__|[*`]/g, "")
    .replace(/[\s　]+/g, " ")
    .trim();
}

function splitPost(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error("no frontmatter");
  const fm = Bun.YAML.parse(m[1]);
  const raw = fm.risk_note;
  const items = (Array.isArray(raw) ? raw : raw ? [raw] : []).map((s) => s.trim()).filter(Boolean);
  return { items, body: m[2] };
}

const quotedFromBody = (item, body) => normalize(body).includes(normalize(item));

// The 9 posts that already had a risk_note before this change. They are not edited here;
// the ones whose items are not verbatim quotes are pinned below so the list stays visible.
const LEGACY = [
  "bitgin",
  "bitgin-move-brick-1",
  "bitgin-move-brick-2",
  "bitgin-move-brick-3",
  "defichaindtoken",
  "footprint",
  "icovsnft",
  "whalefin-2",
  "woonetwork-campaign",
];

// Every legacy note is a paraphrase (e.g. woonetwork-campaign drops 「您」, defichaindtoken merges two sentences).
// They are listed, not rewritten; editing a legacy note changes this list on purpose.
const LEGACY_PARAPHRASED = [...LEGACY].sort();

const posts = readdirSync(CONTENT)
  .filter((f) => f.endsWith(".md"))
  .map((f) => ({ slug: f.replace(/\.md$/, ""), ...splitPost(readFileSync(join(CONTENT, f), "utf8")) }))
  .filter((p) => p.items.length > 0);

describe("risk_note quote check (fixtures)", () => {
  const body = "## 風險\n\n- 詐騙與**資金盤**層出不窮\n\n> 本文僅供參考，\n> 不構成[投資建議](https://example.com)。\n";
  test("a verbatim item across markdown marks and line breaks passes", () => {
    expect(quotedFromBody("詐騙與資金盤層出不窮", body)).toBe(true);
    expect(quotedFromBody("本文僅供參考， 不構成投資建議。", body)).toBe(true);
  });
  test("a rewritten item fails", () => {
    expect(quotedFromBody("詐騙與資金盤很多", body)).toBe(false);
    expect(quotedFromBody("本文僅供參考，不構成任何投資建議。", body)).toBe(false);
    expect(quotedFromBody("詐騙與資金盤層出不窮；請小心", body)).toBe(false);
  });
});

describe("risk_note items are quoted from the post body", () => {
  const fresh = posts.filter((p) => !LEGACY.includes(p.slug));
  test("the extracted posts are the expected 4", () => {
    expect(fresh.map((p) => p.slug).sort()).toEqual(["brc20-ordinals", "celo", "footprintNFT", "mp-dual"]);
  });
  test.each(fresh.flatMap((p) => p.items.map((item) => [p.slug, item, p.body])))("%s: %s", (_slug, item, body) => {
    expect(quotedFromBody(item, body)).toBe(true);
  });
});

describe("legacy risk_note (9 posts, not edited)", () => {
  const legacy = posts.filter((p) => LEGACY.includes(p.slug));
  test("all 9 legacy posts still have a risk_note", () => {
    expect(legacy.map((p) => p.slug).sort()).toEqual([...LEGACY].sort());
  });
  test("legacy posts with paraphrased (non-verbatim) items are the known list", () => {
    const paraphrased = legacy.filter((p) => p.items.some((i) => !quotedFromBody(i, p.body))).map((p) => p.slug).sort();
    expect(paraphrased).toEqual(LEGACY_PARAPHRASED);
  });
});
