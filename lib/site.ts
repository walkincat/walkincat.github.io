export const SITE_URL = "https://walkincat.org";
export const SITE_NAME = "WalkinCat 走路貓";
export const SITE_TAGLINE = "白話加密新手教學、每篇講風險、非投資建議";
export const HOME_TITLE = "跟著走路貓，慢慢走進加密世界";
export const DEFAULT_OG_IMAGE = "/og/home.png";

/** Canonical form: https + apex + trailing slash. `path` must start with "/". */
export function canonicalUrl(path: string): string {
  if (!path.startsWith("/")) throw new Error(`path must start with "/": ${path}`);
  const withSlash = path.endsWith("/") ? path : `${path}/`;
  return `${SITE_URL}${withSlash}`;
}

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export type SocialLink = { name: string; href: string };

// Official WalkinCat accounts. Telegram URLs come from the previous README of this repository.
export const SOCIAL_LINKS: SocialLink[] = [
  { name: "Telegram 社群", href: "https://t.me/walkincat" },
  { name: "Telegram 頻道", href: "https://t.me/walkincat2020" },
  { name: "Instagram", href: "https://www.instagram.com/walkincat2020/" },
  { name: "Threads", href: "https://www.threads.net/@walkincat2020" },
  { name: "YouTube", href: "https://www.youtube.com/@walkincat2020" },
  { name: "X", href: "https://x.com/WalkinCatorg" },
];
