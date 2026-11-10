import type { MetadataRoute } from "next";
import { posts } from "@/lib/posts";
import { canonicalUrl } from "@/lib/site";

export const dynamic = "force-static";

// Only indexable pages. /news and the 404 page are intentionally excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: canonicalUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: canonicalUrl("/posts/"), changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((post) => ({
      url: canonicalUrl(post.permalink),
      lastModified: post.date,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
