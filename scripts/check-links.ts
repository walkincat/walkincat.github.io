// Link check for the static export in out/.
// - Internal links (root-relative, relative, and https://walkincat.org/...) must
//   resolve to a file in out/, and #fragments must match an id on the target page.
// - With --external, every external http(s) link is fetched and must return < 400.
//   Exception: links that only appear on post pages (/posts/<slug>/) come from the migrated archive
//   (2021-2023) and some of those sites are gone. They are printed as warnings, not failures.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const OUT = join(import.meta.dir, "..", "out");
const SITE = "https://walkincat.org";
const checkExternal = process.argv.includes("--external");
// Hosts that answer automated requests from CI IP ranges with 403 even when the page exists.
// For these, 403 is reported as a warning instead of a failure; other errors still fail.
const BOT_BLOCKING_HOSTS = new Set([
  "x.com",
  "instagram.com",
  "www.instagram.com",
  "threads.net",
  "www.threads.net",
  "youtube.com",
  "www.youtube.com",
]);

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith(".html") ? [full] : [];
  });
}

function resolveFile(pathname: string): string | null {
  const base = join(OUT, decodeURIComponent(pathname));
  const candidates = pathname.endsWith("/") ? [join(base, "index.html")] : [base, join(base, "index.html"), `${base}.html`];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

const ids = new Map<string, Set<string>>();
function idsOf(file: string): Set<string> {
  if (!ids.has(file)) ids.set(file, new Set([...readFileSync(file, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return ids.get(file)!;
}

const errors: string[] = [];
const warnings: string[] = [];
const isPostPage = (rel: string) => /^posts\/[^/]+\/index\.html$/.test(rel);
const external = new Map<string, string[]>();
let internalCount = 0;

for (const file of htmlFiles(OUT)) {
  const html = readFileSync(file, "utf8");
  const pagePath = "/" + relative(OUT, dirname(file)).split("\\").join("/") + "/";
  const refs = [
    ...[...html.matchAll(/<(?:a|link|img|script|source)\b[^>]*?\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/<meta (?:property|name)="(?:og:image|og:url|twitter:image)" content="([^"]+)"/g)].map((m) => m[1]),
  ];
  for (const raw of refs) {
    const ref = raw.replace(/&amp;/g, "&");
    if (/^(mailto:|tel:|data:|javascript:)/.test(ref)) continue;
    const url = new URL(ref, SITE + pagePath);
    if (url.origin !== SITE) {
      if (url.protocol === "http:" || url.protocol === "https:") {
        external.set(url.href, [...(external.get(url.href) ?? []), relative(OUT, file)]);
      }
      continue;
    }
    internalCount++;
    if (ref === "#") {
      errors.push(`${relative(OUT, file)}: empty "#" link`);
      continue;
    }
    const target = resolveFile(url.pathname);
    if (!target) {
      errors.push(`${relative(OUT, file)}: broken link ${ref}`);
      continue;
    }
    if (url.hash && !idsOf(target).has(decodeURIComponent(url.hash.slice(1)))) {
      errors.push(`${relative(OUT, file)}: missing anchor ${ref}`);
    }
  }
}

if (checkExternal) {
  for (const [href, pages] of external) {
    let status = 0;
    for (let attempt = 0; attempt < 3 && (status === 0 || status >= 500); attempt++) {
      try {
        const res = await fetch(href, { redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "user-agent": "walkincat-linkcheck" } });
        status = res.status;
      } catch {
        status = 0;
      }
    }
    console.log(`[links] external ${status} ${href}`);
    if (status === 403 && BOT_BLOCKING_HOSTS.has(new URL(href).hostname)) {
      console.warn(`[links] warning: ${href} -> 403 (host blocks automated requests; not treated as broken)`);
      continue;
    }
    if (status === 0 || status >= 400) {
      const msg = `external ${href} -> ${status || "network error"} (from ${pages[0]})`;
      (pages.every(isPostPage) ? warnings : errors).push(msg);
    }
  }
}

console.log(`[links] ${internalCount} internal references checked, ${external.size} external URLs${checkExternal ? " checked" : " skipped (use --external)"}`);
if (warnings.length) {
  console.log(`[links] ${warnings.length} external links in post bodies did not resolve (warning only):`);
  for (const w of warnings) console.log(`[links] warning ${w}`);
}
if (errors.length) {
  for (const e of errors) console.error(`[links] ${e}`);
  process.exit(1);
}
console.log("[links] OK");
