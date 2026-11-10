import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { OUT, readOut } from "./helpers.js";

const CONTENT = join(import.meta.dir, "..", "content");

describe("content/", () => {
  const files = readdirSync(CONTENT).filter((f) => f.endsWith(".md"));
  test("ships the 46 migrated posts and no sample posts", async () => {
    expect(files.length).toBe(46);
    for (const f of files) {
      const text = await Bun.file(join(CONTENT, f)).text();
      expect(text).not.toMatch(/^sample: true$/m);
      expect(text).toMatch(/^date: \d{4}-\d{2}-\d{2}$/m);
    }
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
  test("latest articles use .wc-row__line and show no sample badge", () => {
    expect(html).toContain('class="wc-row__line"');
    expect(html).not.toContain('class="wc-sample"');
  });
});

describe("post page", () => {
  test("filled risk_note renders the normal risk block with the frontmatter text", () => {
    const html = readOut("posts/bitgin/index.html");
    expect(html).toContain('data-risk="filled"');
    expect(html).toContain("OTC 或 C2C 買幣");
    expect(html).not.toContain("此篇風險說明待補");
  });
  test("missing risk_note renders the pending block", () => {
    const html = readOut("posts/2023-June-W2/index.html");
    expect(html).toContain("此篇風險說明待補");
  });
  test("keeps the original date", () => {
    expect(readOut("posts/2023-June-W2/index.html")).toMatch(/<time[^>]*datetime="2023-06-10"/i);
  });
});

describe("migrated images", () => {
  const pages = readdirSync(join(OUT, "posts"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => `posts/${d.name}/index.html`);
  test("every post page exists", () => expect(pages.length).toBe(46));
  test.each(pages)("%s: every <img> is served from this site", (rel) => {
    const srcs = [...readOut(rel).matchAll(/<img\b[^>]*?\ssrc="([^"]*)"/g)].map((m) => m[1]);
    for (const src of srcs) expect(src).toMatch(/^\/(?!\/)/);
  });
});

describe("GitHub Pages artifact", () => {
  test("out/ and public/ contain no CNAME file", async () => {
    const { readdirSync } = await import("node:fs");
    const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [e.name]));
    for (const dir of ["out", "public"]) {
      expect(walk(join(import.meta.dir, "..", dir)).filter((n) => n.toLowerCase() === "cname")).toEqual([]);
    }
  });
});

describe("footer social links", () => {
  const html = readOut("index.html");
  test("X links to the official account", () => expect(html).toContain('href="https://x.com/WalkinCatorg"'));
  test("Instagram and Threads stay as 連結待補 until confirmed", () => {
    expect(html).toMatch(/Instagram(<!-- -->)? <small>連結待補<\/small>/);
    expect(html).toMatch(/Threads(<!-- -->)? <small>連結待補<\/small>/);
  });
});
