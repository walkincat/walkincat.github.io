import { defineCollection, defineConfig, s } from "velite";

// WC_CONTENT_DIR lets tests and screenshot runs build against tests/fixtures/content.
const root = process.env.WC_CONTENT_DIR ?? "content";

const riskNote = s
  .union([s.string(), s.array(s.string())])
  .optional()
  .transform((value) => {
    const items = Array.isArray(value) ? value : value ? [value] : [];
    return items.map((item) => item.trim()).filter((item) => item.length > 0);
  });

const posts = defineCollection({
  name: "Post",
  pattern: "*.md",
  schema: s
    .object({
      title: s.string().min(1),
      date: s.isodate().optional(),
      summary: s.string().optional(),
      risk_note: riskNote,
      cover: s.image().optional(),
      cover_alt: s.string().optional(),
      sample: s.boolean().default(false),
      slug: s.path(),
      content: s.markdown(),
      body: s.raw(),
    })
    .transform((data) => ({ ...data, permalink: `/posts/${data.slug}/` })),
});

export default defineConfig({
  root,
  strict: true,
  collections: { posts },
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    clean: true,
  },
});
