import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { OUT, canonicalsOf, isNoindex, readOut } from "./helpers.js";

const IP_SRC = "/ip-skate-cat.webp";
const ipImgs = (html) => [...html.matchAll(/<img [^>]*class="wc-ip[ "][^>]*>/g)].map((m) => m[0]);

describe("404 page", () => {
  const html = readOut("404.html");

  test("is written to the root of out/ so GitHub Pages serves it with status 404", () => {
    expect(existsSync(join(OUT, "404.html"))).toBe(true);
  });

  test("has noindex and no canonical", () => {
    expect(isNoindex(html)).toBe(true);
    expect(canonicalsOf(html)).toEqual([]);
  });

  test("is not in the sitemap", () => {
    expect(readOut("sitemap.xml")).not.toMatch(/404|not-found/);
  });

  test("uses the final copy, including the <br>", () => {
    expect(html).toMatch(/<h1[^>]*>這一頁走丟了<\/h1>/);
    expect(html).toContain("貓循著腳印也沒找到，先回首頁，<br/>或從新手教學重新出發。");
  });

  test("links 回首頁 to / and 看教學 to the tutorials page", () => {
    expect(html).toMatch(/<a class="wc-btn wc-btn--primary" href="\/">回首頁/);
    expect(html).toMatch(/<a class="wc-btn wc-btn--secondary" href="\/posts\/">看教學<\/a>/);
  });
});

describe("skate cat image", () => {
  test("webp file is in out/", () => expect(existsSync(join(OUT, IP_SRC))).toBe(true));

  test.each(["404.html", "index.html"])("%s has one decorative cat", (rel) => {
    const imgs = ipImgs(readOut(rel));
    expect(imgs.length).toBe(1);
    expect(imgs[0]).toContain(`src="${IP_SRC}"`);
    expect(imgs[0]).toContain('alt=""');
    expect(imgs[0]).toContain('aria-hidden="true"');
  });
});
