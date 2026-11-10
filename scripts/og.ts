// Renders og/og-template.html with Playwright (Chromium) into public/og/home.png (1200x630).
// Fonts are the same pinned source fonts used for the site (scripts/fonts.ts).
// Usage: bun scripts/og.ts [--out path] [--title text]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { chromium } from "playwright";
import { HOME_TITLE } from "../lib/site";
import { SOURCE_FONTS, loadSourceFont } from "./fonts";

const ROOT = join(import.meta.dir, "..");
const { values } = parseArgs({
  options: {
    out: { type: "string", default: join(ROOT, "public", "og", "home.png") },
    title: { type: "string", default: HOME_TITLE },
  },
});

const noto = await loadSourceFont(SOURCE_FONTS.notoSansTC);
const nunito = await loadSourceFont(SOURCE_FONTS.nunito);
const fontCss = `
@font-face { font-family: "Noto Sans TC"; src: url("${pathToFileURL(noto.path)}"); font-weight: 100 900; }
@font-face { font-family: "Nunito"; src: url("${pathToFileURL(nunito.path)}"); font-weight: 200 1000; }
`;
const template = readFileSync(join(ROOT, "og", "og-template.html"), "utf8").replace(
  '<style id="og-fonts"></style>',
  `<style id="og-fonts">${fontCss}</style>`,
);
// Write next to the template so the relative avatar path still resolves.
const page = join(ROOT, "og", ".og-render.html");
writeFileSync(page, template);

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const tab = await context.newPage();
  await tab.goto(`${pathToFileURL(page)}?title=${encodeURIComponent(values.title!)}`);
  await tab.evaluate(() => document.fonts.ready);
  const loaded = await tab.evaluate(() => [document.fonts.check('700 56px "Noto Sans TC"'), document.fonts.check('800 40px "Nunito"')]);
  if (!loaded.every(Boolean)) throw new Error(`OG fonts not loaded: ${JSON.stringify(loaded)}`);
  mkdirSync(dirname(values.out!), { recursive: true });
  await tab.screenshot({ path: values.out!, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log(`[og] wrote ${values.out}`);
} finally {
  await browser.close();
}
