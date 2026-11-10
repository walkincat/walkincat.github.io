import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { OUT, SITE, canonicalsOf, readOut } from "./helpers.js";

const CONTENT = join(import.meta.dir, "..", "content");

describe("content/", () => {
  const files = readdirSync(CONTENT).filter((f) => f.endsWith(".md"));
  test("ships the 46 old-blog posts plus 11 Substack posts and no sample posts", async () => {
    expect(files.length).toBe(57);
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
    expect(html).not.toContain('data-risk="not-advice"');
  });
  test("empty risk_note renders the shared not-advice block", () => {
    const html = readOut("posts/2023-June-W2/index.html");
    expect(html).toContain('data-risk="not-advice"');
    expect(html).not.toContain("此篇風險說明待補");
  });
  test("keeps the original date", () => {
    expect(readOut("posts/2023-June-W2/index.html")).toMatch(/<time[^>]*datetime="2023-06-10"/i);
  });
});

const emptyRisk = (text) => /^risk_note: \[\]$/m.test(text) || !/^risk_note:/m.test(text);
const postFiles = readdirSync(CONTENT).filter((f) => f.endsWith(".md"));

describe("not-advice block shows exactly when risk_note is empty", () => {
  const rows = postFiles.map((f) => {
    const slug = f.replace(/\.md$/, "");
    return { slug, empty: emptyRisk(readFileSync(join(CONTENT, f), "utf8")), html: readOut(`posts/${slug}/index.html`) };
  });
  test("48 posts have an empty risk_note (37 old-blog + 11 Substack), 9 keep their own", () => {
    expect(rows.filter((r) => r.empty).length).toBe(48);
    expect(rows.filter((r) => !r.empty).length).toBe(9);
  });
  test.each(rows.map((r) => [r.slug, r]))("%s", (_slug, r) => {
    expect(r.html.includes('data-risk="not-advice"')).toBe(r.empty);
    expect(r.html.includes('data-risk="filled"')).toBe(!r.empty);
  });
});

// Substack posts migrated in PR2b (the other 15 Substack posts are the same weeklies as existing pages).
const SUBSTACK = {
  "2023-June-W4": "2023-06-24",
  "2023-July-W1": "2023-07-01",
  "2023-July-W2": "2023-07-08",
  "2023-July-W3": "2023-07-15",
  "2023-July-W4": "2023-07-22",
  "2023-July-W5": "2023-07-29",
  "lsdfi-lsd": "2023-06-20",
  "trading-tools": "2023-06-02",
  "ton-summer-lottery": "2023-06-02",
  "brc20-ordinals": "2023-05-16",
  "brc-ltc-20": "2023-05-11",
};

describe("Substack posts", () => {
  const locs = [...readOut("sitemap.xml").matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  test.each(Object.entries(SUBSTACK))("%s: canonical equals sitemap loc, original date, no Substack images", (slug, date) => {
    const loc = `${SITE}/posts/${slug}/`;
    const html = readOut(`posts/${slug}/index.html`);
    expect(locs).toContain(loc);
    expect(canonicalsOf(html)).toEqual([loc]);
    expect(html).toMatch(new RegExp(`<time[^>]*datetime="${date}"`, "i"));
    expect(html).not.toMatch(/substackcdn\.com|substack-post-media/);
  });
});

describe("migrated images", () => {
  const pages = readdirSync(join(OUT, "posts"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => `posts/${d.name}/index.html`);
  test("every post page exists", () => expect(pages.length).toBe(57));
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
  const SOCIAL_HREFS = [
    "https://t.me/walkincat",
    "https://t.me/walkincat2020",
    "https://www.instagram.com/walkincat2020/",
    "https://www.threads.net/@walkincat2020",
    "https://www.youtube.com/@walkincat2020",
    "https://x.com/WalkinCatorg",
  ];
  test("Instagram, Threads and YouTube link to the official accounts", () => {
    expect(html).toContain('href="https://www.instagram.com/walkincat2020/"');
    expect(html).toContain('href="https://www.threads.net/@walkincat2020"');
    expect(html).toContain('href="https://www.youtube.com/@walkincat2020"');
  });
  test('every social link has rel="me noopener"', () => {
    for (const href of SOCIAL_HREFS) expect(html).toContain(`<a href="${href}" rel="me noopener">`);
  });
  test("no page shows 連結待補", () => {
    const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
    const pages = walk(OUT).filter((f) => f.endsWith(".html"));
    expect(pages.length).toBeGreaterThan(0);
    for (const f of pages) expect(readFileSync(f, "utf8")).not.toContain("連結待補");
  });
});
