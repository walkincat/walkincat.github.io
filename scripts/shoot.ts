// Layout check + screenshots with Playwright.
// For each page and viewport: full-page screenshot, document.documentElement.scrollWidth vs innerWidth,
// and on the home page the headline line count and that no subtitle phrase wraps.
// Usage: bun scripts/shoot.ts --base http://localhost:4173 --dir shots [--page name=/path/ ...]
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

const { values } = parseArgs({
  options: {
    base: { type: "string", default: "http://localhost:4173" },
    dir: { type: "string", default: "shots" },
    page: { type: "string", multiple: true },
    channel: { type: "string" },
  },
});

const pages = (values.page?.length ? values.page : ["index=/", "list=/posts/", "post=/posts/2023-June-W2/"]).map((p) => {
  const [name, path] = p.split("=");
  return { name, path };
});
const viewports = [
  { name: "390x844", width: 390, height: 844, dpr: 2, mobile: true },
  { name: "360x800", width: 360, height: 800, dpr: 2, mobile: true },
  { name: "1440x900", width: 1440, height: 900, dpr: 1, mobile: false },
];

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
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          headlineLines: h1 ? Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight)) : null,
          subtitlePhrasesOnOneLine: sub.length ? sub.every((s) => s.getClientRects().length === 1) : null,
          fontsOk,
        };
      });
      const ok = res?.status() === 200 && m.scrollWidth <= m.innerWidth && (m.subtitlePhrasesOnOneLine ?? true) &&
        (m.headlineLines === null || m.headlineLines === (vp.mobile ? 2 : 1));
      if (!ok) failed = true;
      console.log(
        `[shoot] ${ok ? "ok  " : "FAIL"} ${page.name.padEnd(13)} ${vp.name.padEnd(9)} status=${res?.status()} scrollWidth=${m.scrollWidth} innerWidth=${m.innerWidth}` +
          (m.headlineLines !== null ? ` headlineLines=${m.headlineLines} subtitlePhrasesOnOneLine=${m.subtitlePhrasesOnOneLine}` : "") +
          ` fonts=${m.fontsOk.join("/")}`,
      );
      await tab.screenshot({ path: join(values.dir!, `${page.name}-${vp.name}.png`), fullPage: true });
      if (page.path === "/") await tab.screenshot({ path: join(values.dir!, `${page.name}-${vp.name}-fold.png`) });
    }
    await context.close();
  }
} finally {
  await browser.close();
}
if (failed) process.exit(1);
