import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { OUT, SITE, canonicalsOf, isNoindex, metaProperty, pngSize, readOut } from "./helpers.js";

const locs = [...readOut("sitemap.xml").matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
const pageFor = (loc) => join(decodeURI(loc.slice(SITE.length)), "index.html");

describe("sitemap <loc> equals the page canonical", () => {
  test("sitemap lists the home page, the list page and every post", () => {
    expect(locs).toContain(`${SITE}/`);
    expect(locs).toContain(`${SITE}/posts/`);
    expect(locs.length).toBeGreaterThanOrEqual(3);
  });

  test.each(locs)("%s", (loc) => {
    expect(loc).toMatch(/^https:\/\/walkincat\.org\/(.*\/)?$/);
    const html = readOut(pageFor(loc));
    expect(canonicalsOf(html)).toEqual([loc]);
    expect(isNoindex(html)).toBe(false);
  });
});

describe("404 is noindex and has no canonical", () => {
  test.each(["404.html", "404/index.html", "_not-found/index.html"])("%s", (rel) => {
    const html = readOut(rel);
    expect(html).not.toContain('rel="canonical"');
    expect(isNoindex(html)).toBe(true);
  });
});

describe("/news placeholder", () => {
  const html = readOut("news/index.html");
  test("is noindex", () => expect(isNoindex(html)).toBe(true));
  test("is not in the sitemap", () => expect(locs.some((l) => l.includes("/news"))).toBe(false));
  test("is not linked from any public page", () => {
    for (const loc of locs) expect(readOut(pageFor(loc))).not.toMatch(/href="\/news\/?"/);
  });
});

describe("robots.txt", () => {
  const robots = readOut("robots.txt");
  test("allows crawling", () => {
    expect(robots).toMatch(/User-Agent: \*/i);
    expect(robots).toMatch(/Allow: \//);
    expect(robots).not.toMatch(/Disallow: \/\s*$/m);
  });
  test("points to the sitemap", () => expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`));
});

describe("per-page title, description, OG and Twitter card", () => {
  test.each(locs)("%s", (loc) => {
    const html = readOut(pageFor(loc));
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(metaProperty(html, "description")[0]?.length).toBeGreaterThan(0);
    for (const prop of ["og:title", "og:description", "og:url", "og:image", "twitter:card", "twitter:image"]) {
      expect(metaProperty(html, prop).length).toBe(1);
    }
    expect(metaProperty(html, "og:url")[0]).toBe(loc);
    expect(metaProperty(html, "og:image")[0]).toMatch(/^https:\/\/walkincat\.org\//);
    expect(metaProperty(html, "twitter:image")[0]).toMatch(/^https:\/\/walkincat\.org\//);
    expect(metaProperty(html, "twitter:card")[0]).toBe("summary_large_image");
  });
});

describe("home OG image", () => {
  const html = readOut("index.html");
  const image = metaProperty(html, "og:image")[0];
  test("og:title uses the home headline", () => expect(metaProperty(html, "og:title")[0]).toContain("跟著走路貓，慢慢走進加密世界"));
  test("image file is a 1200x630 PNG", () => {
    const file = join(OUT, new URL(image).pathname);
    expect(pngSize(readFileSync(file))).toEqual({ width: 1200, height: 630 });
  });
});
