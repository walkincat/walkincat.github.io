# walkincat.org

Static site for WalkinCat 走路貓: plain-language crypto tutorials for beginners. Every post covers the risks. Nothing here is investment advice.

Built with [Bun](https://bun.sh), Next.js (`output: "export"`, `trailingSlash: true`) and [velite](https://velite.js.org). The output is plain static files in `out/`.

## Deployment: GitHub Pages (current)

`.github/workflows/deploy-pages.yml` deploys on every push to `main`. It can also be started by hand (`workflow_dispatch`). The workflow:

1. Installs the pinned Bun version.
2. Runs `bun install --frozen-lockfile && bun run build && bun test`, the same as CI.
3. Uploads `out/` with `actions/upload-pages-artifact`.
4. Publishes it with `actions/deploy-pages`.

The site is a user/org site (`walkincat.github.io`), so it is served from `/` with no `basePath`. Canonical URLs stay `https://walkincat.org/...`.

- **Pages source**: Settings → Pages → Source must be **GitHub Actions**, not the legacy `gh-pages` branch.
- **Custom domain**: set `walkincat.org` in Settings → Pages. The repository has **no `CNAME` file**, and the workflow fails if `out/` contains one.
- **Jekyll**: with Actions deployments the artifact is served as-is, without Jekyll processing, so `_next/` works.
- **Trailing slash**: GitHub Pages answers a directory URL without a trailing slash with a **301** to the slash form. Measured on this repository's Pages site: `/archives` → `301 https://walkincat.org/archives/`.
- **404**: `out/404.html` at the artifact root is served as the 404 page for any missing path, with HTTP status 404. It has `noindex` and no canonical.
- **HTTPS**: http → https is handled by "Enforce HTTPS" in the Pages settings.
- **www**: www → apex is handled by GitHub Pages when both DNS records point to it.

## Cloudflare Pages settings (later)

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `bun install --frozen-lockfile && bun run build` |
| Build output directory | `out` |
| Root directory | `/` (repository root) |
| Environment variable | `BUN_VERSION` = `1.3.14` |

Bun is pinned to **1.3.14** (`packageManager` in `package.json`; CI reads the same field). Keep `BUN_VERSION` in Cloudflare Pages in sync when it changes.

The build downloads three OFL source fonts from a pinned `google/fonts` commit (sha256-verified, see `scripts/fonts.ts`), so the build machine needs outbound HTTPS to `raw.githubusercontent.com`.

## Commands

```sh
bun install
bun run dev          # local dev server
bun run build        # velite -> next build -> font subsetting (writes out/)
bun run typecheck
bun test             # needs a build first; checks out/
bun run linkcheck    # internal links and anchors; add `-- --external` to fetch external links
bun run og           # regenerate public/og/home.png (needs `bunx playwright install chromium`)
bun run preview      # wrangler pages dev out (local only, no login needed)
```

## Content

Posts are Markdown files in `content/*.md`. The file name is the URL slug: `content/foo.md` becomes `/posts/foo/`.

```yaml
---
title: 必填。缺少的話 build 會失敗
date: 2026-11-09           # optional, YYYY-MM-DD
summary: 一句摘要           # optional; also used for the meta description
risk_note:                 # optional; a string or a list of strings
  - 風險一
cover: ./images/foo.jpg    # optional, relative to the Markdown file
cover_alt: 封面描述         # optional
sample: true               # optional; marks the post as 範例 (sample)
---
```

If `risk_note` is missing or empty, the post shows the 待補 (pending) risk block: a dashed box plus a 待補 badge. Risk text is never generated.

PR1 ships one sample post only (`content/sample-stablecoin-basics.md`). `tests/fixtures/content/` adds a pending-risk post for tests and screenshots (`WC_CONTENT_DIR=tests/fixtures/content bun run build`).

## SEO rules

- Canonical form: `https://walkincat.org/path/` (https, apex domain, trailing slash). The home page is `https://walkincat.org/`.
- The sitemap `<loc>` values are exactly the canonical strings. `tests/seo.test.js` checks every one.
- The 404 page has `noindex` and no canonical.
- `/news/` is a reserved placeholder: `noindex`, left out of the sitemap and the navigation.
- No-slash URLs get a 308 to the slash form. This is Cloudflare Pages' default behaviour, so no `_redirects` file is needed.
- http to https and www to apex redirects are zone settings in Cloudflare, not part of this repository.

## OG image

`public/og/home.png` (1200×630) is rendered from `og/og-template.html` by `scripts/og.ts` with Playwright. The PNG is committed so the Cloudflare Pages build does not need a browser. CI regenerates it to check that it still renders at 1200×630.

## CI

`.github/workflows/ci.yml` runs on every pull request to `main`:

- build, typecheck and tests
- link check
- OG regeneration (size check via `scripts/png-size.ts`)
- Playwright layout check: no horizontal scroll at 390, 360 and 1440 px widths
- Lighthouse mobile: performance and SEO must both be ≥ 0.9
