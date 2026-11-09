# walkincat.org

Static site for WalkinCat 走路貓: plain-language crypto tutorials for beginners. Every post covers the risks. Nothing here is investment advice.

Built with [Bun](https://bun.sh), Next.js (`output: "export"`, `trailingSlash: true`) and [velite](https://velite.js.org). The output is plain static files in `out/`.

## Cloudflare Pages settings

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

`content/` holds the 46 posts migrated from the old Hexo blog (2021–2023), with their original dates. Old URLs were `/post/<slug>.html`; the slug is unchanged, so `/post/foo.html` is now `/posts/foo/`.

Images live next to the posts in `content/img/<folder>/` (WebP, at most 1200 px wide) and are referenced with relative paths. velite copies them to `/static/` at build time, so every image is served from this site. Do not link images from other sites.

`tests/fixtures/content/` holds sample posts for tests and screenshots only (`WC_CONTENT_DIR=tests/fixtures/content bun run build`); they are not part of the site.

## Sharing links

Links shared on social media use UTM parameters: see [docs/utm.md](docs/utm.md).

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

`.github/workflows/ci.yml` runs on every pull request to `main` or to a `jq/**` branch:

- build, typecheck and tests
- link check (external links that only appear in migrated post bodies are reported as warnings: some 2021–2023 sources are gone)
- OG regeneration
- Playwright layout check: no horizontal scroll at 390, 360 and 1440 px widths
- Lighthouse mobile: performance and SEO must both be ≥ 0.9
