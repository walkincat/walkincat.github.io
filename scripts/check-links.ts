// Link check for the static export in out/.
// - Internal links (root-relative, relative, and https://walkincat.org/...) must
//   resolve to a file in out/, and #fragments must match an id on the target page.
// - With --external, every external http(s) link is fetched and must return < 400.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const OUT = join(import.meta.dir, "..", "out");
const SITE = "https://walkincat.org";
const checkExternal = process.argv.includes("--external");

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
    if (status === 0 || status >= 400) errors.push(`external ${href} -> ${status || "network error"} (from ${pages[0]})`);
  }
}

console.log(`[links] ${internalCount} internal references checked, ${external.size} external URLs${checkExternal ? " checked" : " skipped (use --external)"}`);
if (errors.length) {
  for (const e of errors) console.error(`[links] ${e}`);
  process.exit(1);
}
console.log("[links] OK");
