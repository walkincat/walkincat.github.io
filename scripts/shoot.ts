// Layout check + screenshots with Playwright.
// For each page and viewport: full-page screenshot, document.documentElement.scrollWidth vs innerWidth
// (and innerWidth vs the configured viewport width),
// and on the home page the headline line count (two lines on phones, one from 1024px; at 768px it may wrap after the comma)
// and that no subtitle phrase wraps.
// On pages with the skate cat (home, 404): the cat is visible and its box does not overlap any h1 or .wc-btn,
// and when the cat image fails to load it is removed from the page.
// On post pages (QA item in brackets):
// - [L1] at 390, the post body is drawn with Noto Sans TC
// - [L2] h1 / h2 / h3 line heights 1.35 / 1.4 / 1.45
// - [L3] the summary is the small size, below the body size
// - [L4] post navigation buttons: one full-width column on phones, one row from 768px
// - [L5] the post cover box is 16:9 and the cover image is not cropped
// - [P2] code blocks have one background; the code inside has none
// Usage: bun scripts/shoot.ts --base http://localhost:4173 --dir shots [--page name=/path/ ...]
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { type BrowserContext, type Page, chromium } from "playwright";

const { values } = parseArgs({
  options: {
    base: { type: "string", default: "http://localhost:4173" },
    dir: { type: "string", default: "shots" },
    page: { type: "string", multiple: true },
    channel: { type: "string" },
  },
});

// brc20 has a long <pre> line; it guards against code blocks widening the page on phones.
// april-w3 has h2, h3 and both 上一篇 and 下一篇; june-w3 has a weekly cover card with a credit line at the bottom.
// "404" is any missing path; the static server answers it with out/404.html and status 404.
const pages = (
  values.page?.length
    ? values.page
    : [
        "index=/",
        "404=/no-such-page/",
        "list=/posts/",
        "post=/posts/2023-June-W2/",
        "brc20=/posts/brc20-ordinals/",
        "april-w3=/posts/2023-April-W3/",
        "june-w3=/posts/2023-June-W3/",
      ]
).map((p) => {
  const [name, path] = p.split("=");
  return { name, path, status: name === "404" ? 404 : 200, cat: name === "index" || name === "404" };
});
const viewports = [
  { name: "320x568", width: 320, height: 568, dpr: 2, mobile: true },
  { name: "390x844", width: 390, height: 844, dpr: 2, mobile: true },
  { name: "360x800", width: 360, height: 800, dpr: 2, mobile: true },
  { name: "768x1024", width: 768, height: 1024, dpr: 2, mobile: false },
  { name: "1024x768", width: 1024, height: 768, dpr: 1, mobile: false },
  { name: "1440x900", width: 1440, height: 900, dpr: 1, mobile: false },
];

/** Post page checks. Each returns a list of failure messages (empty when the page passes). */
async function postChecks(tab: Page): Promise<string[]> {
  return tab.evaluate(() => {
    const fails: string[] = [];
    if (!document.querySelector(".wc-post")) return fails;
    const cs = (el: Element) => getComputedStyle(el);
    const ratio = (el: Element) => parseFloat(cs(el).lineHeight) / parseFloat(cs(el).fontSize);
    const near = (a: number, b: number) => Math.abs(a - b) < 0.01;
    const first = (sel: string) => document.querySelector(sel);

    // L2: h1 1.35, h2 1.4, h3 1.45 (DESIGN §4 字級).
    for (const [sel, want] of [[".wc-post__title", 1.35], [".wc-prose h2", 1.4], [".wc-prose h3", 1.45]] as const) {
      const el = first(sel);
      if (el && !near(ratio(el), want)) fails.push(`L2 ${sel} line-height ${ratio(el).toFixed(3)} != ${want}`);
    }

    // L3: summary is the small size (15px phone, 16px desktop), line-height 1.65, never larger than the body.
    const summary = first(".wc-post__summary");
    const body = first(".wc-prose p");
    if (summary && body) {
      const s = parseFloat(cs(summary).fontSize);
      const b = parseFloat(cs(body).fontSize);
      if (!(s < b)) fails.push(`L3 summary ${s}px is not smaller than body ${b}px`);
      if (s < 15 || s > 16) fails.push(`L3 summary ${s}px outside 15-16px`);
      if (!near(ratio(summary), 1.65)) fails.push(`L3 summary line-height ${ratio(summary).toFixed(3)} != 1.65`);
    }

    // L4: below 768px the post navigation buttons are one full-width column; from 768px they share one row.
    const nav = first(".wc-postnav");
    const btns = nav ? [...nav.querySelectorAll(".wc-btn")].map((b) => b.getBoundingClientRect()) : [];
    if (nav && btns.length > 1) {
      const navW = nav.getBoundingClientRect().width;
      const rows = new Set(btns.map((b) => Math.round(b.top))).size;
      if (window.innerWidth < 768) {
        if (rows !== btns.length || btns.some((b) => Math.abs(b.width - navW) > 1))
          fails.push(`L4 ${btns.length} nav buttons in ${rows} rows, widths ${btns.map((b) => Math.round(b.width)).join("/")} of ${Math.round(navW)}`);
      } else if (rows !== 1) fails.push(`L4 ${btns.length} nav buttons in ${rows} rows`);
    }

    // L5: the cover box stays 16:9 (DESIGN §5.5) and the whole image is drawn inside it, nothing cropped.
    const coverBox = first(".wc-post__cover");
    const coverImg = first(".wc-post__cover img") as HTMLImageElement | null;
    if (coverBox && coverImg && coverImg.naturalWidth > 0) {
      const box = coverBox.getBoundingClientRect();
      if (Math.abs(box.width / box.height - 16 / 9) > 0.02) fails.push(`L5 cover box ${box.width}x${box.height} is not 16:9`);
      const img = coverImg.getBoundingClientRect();
      const fit = cs(coverImg).objectFit;
      const sx = img.width / coverImg.naturalWidth;
      const sy = img.height / coverImg.naturalHeight;
      const scale = fit === "contain" || fit === "scale-down" ? Math.min(sx, sy) : fit === "cover" ? Math.max(sx, sy) : fit === "none" ? 1 : NaN;
      const drawnW = fit === "fill" ? img.width : coverImg.naturalWidth * scale;
      const drawnH = fit === "fill" ? img.height : coverImg.naturalHeight * scale;
      const distorted = fit === "fill" && Math.abs(sx - sy) > 0.01;
      if (drawnW > img.width + 0.5 || drawnH > img.height + 0.5 || distorted || img.width > box.width + 0.5 || img.height > box.height + 0.5)
        fails.push(`L5 cover image drawn ${drawnW.toFixed(0)}x${drawnH.toFixed(0)} (object-fit ${fit}) in ${img.width.toFixed(0)}x${img.height.toFixed(0)}: cropped or distorted`);
    }

    // P2: a code block is one tinted block; the code inside it has no inline-code background or padding.
    for (const code of document.querySelectorAll(".wc-prose pre code")) {
      const pre = code.parentElement!;
      const transparent = (c: string) => c === "rgba(0, 0, 0, 0)" || c === "transparent";
      if (!transparent(cs(code).backgroundColor) || cs(code).paddingLeft !== "0px")
        fails.push(`P2 pre code background ${cs(code).backgroundColor}, padding-left ${cs(code).paddingLeft}`);
      if (transparent(cs(pre).backgroundColor)) fails.push("P2 pre has no background of its own");
    }
    return fails;
  });
}

/** L1: the post body is drawn with Noto Sans TC (code may use the mono font; emoji may use an emoji font). */
async function proseFontCheck(context: BrowserContext, tab: Page): Promise<string[]> {
  const cdp = await context.newCDPSession(tab);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
    nodeId: root.nodeId,
    selector: ".wc-prose :is(p, li, h2, h3, blockquote, dt, dd, figcaption)",
  });
  const glyphs = new Map<string, number>();
  for (const nodeId of nodeIds) {
    const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
    for (const f of fonts) glyphs.set(f.familyName, (glyphs.get(f.familyName) ?? 0) + f.glyphCount);
  }
  await cdp.detach();
  // Noto Sans TC itself has no glyph for a few simplified or variant characters used in the posts (稳 爲 热 赛),
  // so those fall back to a system font. Before the fix every body glyph was a system font.
  const other = [...glyphs].filter(([family]) => !/^Noto Sans TC|IBM Plex Mono|Emoji/.test(family));
  const total = [...glyphs.values()].reduce((a, b) => a + b, 0);
  const fallback = other.reduce((sum, [, n]) => sum + n, 0);
  return fallback > total * 0.005
    ? [`L1 ${fallback} of ${total} post body glyphs not in Noto Sans TC: ${other.map(([f, n]) => `${f}=${n}`).join(", ")}`]
    : [];
}

mkdirSync(values.dir!, { recursive: true });
const browser = await chromium.launch(values.channel ? { channel: values.channel } : {});
let failed = false;
try {
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
    });
    const tab = await context.newPage();
    for (const page of pages) {
      const res = await tab.goto(values.base + page.path, { waitUntil: "networkidle" });
      await tab.evaluate(() => document.fonts.ready);
      const m = await tab.evaluate(() => {
        const h1 = document.querySelector<HTMLElement>(".wc-hero__line");
        const sub = [...document.querySelectorAll<HTMLElement>(".wc-hero__sub > span")];
        const fontsOk = ['700 16px "Noto Sans TC"', '800 16px "Nunito"'].map((f) => document.fonts.check(f));
        const box = (el: Element) => el.getBoundingClientRect();
        const cat = document.querySelector(".wc-ip");
        const catBox = cat ? box(cat) : null;
        const blockers = [...document.querySelectorAll("h1, .wc-btn")].map(box).filter((b) => b.width > 0 && b.height > 0);
        const overlaps = catBox
          ? blockers.filter((b) => catBox.left < b.right && b.left < catBox.right && catBox.top < b.bottom && b.top < catBox.bottom).length
          : null;
        return {
          catVisible: !!catBox && catBox.width > 0 && catBox.height > 0 && (cat as HTMLImageElement).naturalWidth > 0,
          overlaps,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          headlineLines: h1 ? Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight)) : null,
          subtitlePhrasesOnOneLine: sub.length ? sub.every((s) => s.getClientRects().length === 1) : null,
          fontsOk,
        };
      });
      const postFails = [...(await postChecks(tab)), ...(vp.width === 390 ? await proseFontCheck(context, tab) : [])];
      // With isMobile, content wider than the viewport also widens the layout viewport, so innerWidth grows
      // with it (390 -> 638). Compare against the configured viewport width too, not only innerWidth.
      const catOk = !page.cat || (m.catVisible && m.overlaps === 0);
      const ok = res?.status() === page.status && catOk && m.scrollWidth <= m.innerWidth && m.innerWidth === vp.width && (m.subtitlePhrasesOnOneLine ?? true) &&
        (m.headlineLines === null || (vp.width < 768 ? m.headlineLines === 2 : vp.width < 1024 ? m.headlineLines <= 2 : m.headlineLines === 1)) && postFails.length === 0;
      if (!ok) failed = true;
      console.log(
        `[shoot] ${ok ? "ok  " : "FAIL"} ${page.name.padEnd(13)} ${vp.name.padEnd(9)} status=${res?.status()} scrollWidth=${m.scrollWidth} innerWidth=${m.innerWidth}` +
          (page.cat ? ` catVisible=${m.catVisible} catOverlaps=${m.overlaps}` : "") +
          (m.headlineLines !== null ? ` headlineLines=${m.headlineLines} subtitlePhrasesOnOneLine=${m.subtitlePhrasesOnOneLine}` : "") +
          ` fonts=${m.fontsOk.join("/")}` +
          postFails.map((f) => `\n[shoot]      ${f}`).join(""),
      );
      await tab.screenshot({ path: join(values.dir!, `${page.name}-${vp.name}.png`), fullPage: true });
      if (page.path === "/") await tab.screenshot({ path: join(values.dir!, `${page.name}-${vp.name}-fold.png`) });
    }
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.route("**/ip-skate-cat.webp", (route) => route.abort());
  const tab = await context.newPage();
  for (const page of pages.filter((p) => p.cat)) {
    await tab.goto(values.base + page.path, { waitUntil: "networkidle" });
    const m = await tab.evaluate(() => ({
      catLeft: document.querySelectorAll(".wc-ip").length,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    const ok = m.catLeft === 0 && m.scrollWidth <= m.innerWidth;
    if (!ok) failed = true;
    console.log(`[shoot] ${ok ? "ok  " : "FAIL"} ${page.name.padEnd(13)} cat image blocked: cat elements left=${m.catLeft} scrollWidth=${m.scrollWidth}`);
  }
  await context.close();
} finally {
  await browser.close();
}
if (failed) process.exit(1);
