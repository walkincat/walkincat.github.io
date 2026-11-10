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
bun run favicon      # regenerate favicon.ico, icon-192/512.png, apple-touch-icon.png (same Chromium)
bun run preview      # wrangler pages dev out (local only, no login needed)
```

With `--external`, a 403 from x.com, Instagram, Threads or YouTube and a 429 from Instagram are warnings, not broken links (these hosts block or rate-limit automated requests). A 429 from any other host still fails. The rules are in `scripts/link-rules.ts`.

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

If `risk_note` is missing or empty, the post page shows the shared plain-language "非投資建議" block (`components/NotAdviceNote.tsx`, one fixed sentence for every such post) Post lists show no risk badge. Article-specific risk text is never generated.

`content/` holds the 46 posts migrated from the old Hexo blog (2021–2023), with their original dates. Old URLs were `/post/<slug>.html`; the slug is unchanged, so `/post/foo.html` is now `/posts/foo/`.

It also holds 11 posts from the WalkinCat Substack (walkincat.substack.com, 2023), with their original dates (Taiwan time). The Substack weeklies from 2023-03-04 to 2023-06-17 are the same posts as the old-blog weeklies, so they were not added twice. The 2023 weeklies after that are `2023-June-W4` and `2023-July-W1`…`W5`. Images were downloaded into `content/img/` like the others; the canonical URL of each post is its page on this site.

Images live next to the posts in `content/img/<folder>/` (WebP, at most 1200 px wide) and are referenced with relative paths. velite copies them to `/static/` at build time, so every image is served from this site. Do not link images from other sites.

`tests/fixtures/content/` holds sample posts for tests and screenshots only (`WC_CONTENT_DIR=tests/fixtures/content bun run build`); they are not part of the site.

## Skate cat (墨鏡直排輪貓)

`public/ip-skate-cat.webp` (560×791, from the 785×1108 PNG of the 2023 brand CI) is decoration on the home hero (bottom-right corner on desktop, peeking in from the right edge below 1200 px) and on the 404 page. It is rendered by `components/IpCat.tsx` with `alt=""` and `aria-hidden="true"`; if the image fails to load, the component removes it. If the cat is made larger or moved, re-run `scripts/shoot.ts`: it fails when the cat overlaps the headline or a button.

## Sharing links

Links shared on social media use UTM parameters: see [docs/utm.md](docs/utm.md).

## SEO rules

- Canonical form: `https://walkincat.org/path/` (https, apex domain, trailing slash). The home page is `https://walkincat.org/`.
- The sitemap `<loc>` values are exactly the canonical strings. `tests/seo.test.js` checks every one.
- The 404 page has `noindex` and no canonical, and is not in the sitemap (`tests/ip.test.js`).
- `/news/` is a reserved placeholder: `noindex`, left out of the sitemap and the navigation.
- No-slash URLs get a 308 to the slash form. This is Cloudflare Pages' default behaviour, so no `_redirects` file is needed.
- http to https and www to apex redirects are zone settings in Cloudflare, not part of this repository.

## OG image

`public/og/home.png` (1200×630) is rendered from `og/og-template.html` by `scripts/og.ts` with Playwright. The PNG is committed so the Cloudflare Pages build does not need a browser. CI regenerates it to check that it still renders at 1200×630.

## Favicon

`public/favicon.ico` (16, 32, 48 px), `public/icon-192.png`, `public/icon-512.png` and `public/apple-touch-icon.png` (180×180, opaque, `--wc-paper` #f8f8f8 background) are the cat head cut from `public/ip-skate-cat.webp` by `scripts/make-favicon.ts`: ears to chin with the sunglasses and the white sticker outline, no body. The crop box and the chin curve are constants at the top of the script. Below the chin the script draws a white band with a dark outer line, so the head is closed like the rest of the sticker. Chromium (through Playwright) only decodes the WebP and resamples; PNG and ICO are encoded in the script. The files are committed, so the build does not run it. `app/layout.tsx` points `icons` at these files; `public/avatar.jpg` is still the logo image in the header, the home hero and the empty state. `tests/favicon.test.js` checks the links and the files.

## CI

`.github/workflows/ci.yml` runs on every pull request to `main` or to a `jq/**` branch:

- build, typecheck and tests
- link check (external links that only appear in migrated post bodies are reported as warnings: some 2021–2023 sources are gone)
- OG regeneration (size check via `scripts/png-size.ts`)
- Playwright layout check (`scripts/shoot.ts`): no horizontal scroll at 320, 360, 390, 768, 1024 and 1440 px widths on the home page, the 404 page, the list and the post pages; on the home and 404 pages the skate cat is visible, does not overlap the `h1` or any button, and is removed when its image fails to load
- Lighthouse mobile: performance and SEO must both be ≥ 0.9
