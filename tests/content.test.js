import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { readOut } from "./helpers.js";

const CONTENT = join(import.meta.dir, "..", "content");

describe("content/", () => {
  const files = readdirSync(CONTENT).filter((f) => f.endsWith(".md"));
  test("PR1 ships exactly one fixture post, marked as sample", async () => {
    expect(files).toEqual(["sample-stablecoin-basics.md"]);
    const text = await Bun.file(join(CONTENT, files[0])).text();
    expect(text).toMatch(/^sample: true$/m);
    expect(text).toMatch(/^title: 範例｜/m);
  });
});

describe("home page design requirements", () => {
  const html = readOut("index.html");
  test("headline has the mobile line break", () => {
    expect(html).toContain('跟著<em>走路貓</em>，<br class="wc-br-m"/>');
  });
  test("header logo is visible (no visibility:hidden on the home logo)", () => {
    expect(html).toContain('class="wc-logo"');
    const css = readOut(html.match(/href="(\/_next\/static\/[^"]+\.css)"/)[1].slice(1));
    expect(css).not.toMatch(/\.wc-logo\{[^}]*visibility:\s*hidden/);
    expect(css).toMatch(/\.wc12-home \.wc-hero\{min-height:calc\(100svh - 65px\)\}/);
  });
  test("navigation has only 教學 and 文章", () => {
    const nav = html.match(/<nav class="wc-nav"[^>]*>([\s\S]*?)<\/nav>/)[1];
    expect([...nav.matchAll(/>([^<]+)<\/a>/g)].map((m) => m[1])).toEqual(["教學", "文章"]);
  });
  test("latest articles use .wc-row__line and .wc-sample", () => {
    expect(html).toContain('class="wc-row__line"');
    expect(html).toContain('class="wc-sample"');
  });
});

describe("post page", () => {
  const html = readOut("posts/sample-stablecoin-basics/index.html");
  test("filled risk_note renders the normal risk block with the frontmatter text", () => {
    expect(html).toContain('data-risk="filled"');
    expect(html).toContain("穩定幣的錨定不是保證");
    expect(html).not.toContain("此篇風險說明待補");
  });
});
