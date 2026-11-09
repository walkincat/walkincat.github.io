import { posts as allPosts } from "#content";

export type Post = (typeof allPosts)[number];

/** Posts with a date come first (newest first); undated posts sort last, by title. */
export function sortPosts<T extends { date?: string; title: string }>(list: readonly T[]): T[] {
  return [...list].sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.title.localeCompare(b.title);
  });
}

export const posts: Post[] = sortPosts(allPosts);

export function getPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

export function formatDate(iso: string | undefined): string | undefined {
  return iso ? iso.slice(0, 10) : undefined;
}

export function isRiskPending(post: { risk_note: string[] }): boolean {
  return post.risk_note.length === 0;
}

/** Rough reading time for Traditional Chinese text (~400 characters per minute). */
export function readingMinutes(raw: string): number {
  const chars = raw.replace(/\s+/g, "").length;
  return Math.max(1, Math.round(chars / 400));
}
