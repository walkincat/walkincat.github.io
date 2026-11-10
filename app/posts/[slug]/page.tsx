import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover } from "@/components/Cover";
import { RiskNote } from "@/components/RiskNote";
import { formatDate, getPost, posts } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { SITE_TAGLINE } from "@/lib/site";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return pageMetadata({
    title: post.title,
    description: post.summary ?? SITE_TAGLINE,
    path: post.permalink,
    type: "article",
    image: post.cover,
  });
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const date = formatDate(post.date);
  const index = posts.indexOf(post);
  const newer = index > 0 ? posts[index - 1] : undefined;
  const older = index < posts.length - 1 ? posts[index + 1] : undefined;

  return (
    <main id="main">
      <article className="wc-post">
        <nav className="wc-crumbs" aria-label="麵包屑">
          <Link href="/posts/">教學</Link>
        </nav>
        <h1 className="wc-post__title">{post.title}</h1>
        {date || post.sample ? (
          <div className="wc-post__meta">
            {date ? (
              <time className="wc-post__date" dateTime={date}>
                {date}
              </time>
            ) : null}
            {post.sample ? <span className="wc-badge wc-badge--sample">範例內容</span> : null}
          </div>
        ) : null}
        {post.summary ? <p className="wc-post__summary">{post.summary}</p> : null}
        {post.cover ? (
          <Cover cover={post.cover} alt={post.cover_alt ?? `${post.title} 的封面`} className="wc-cover wc-post__cover" eager />
        ) : null}

        <div className="wc-prose" dangerouslySetInnerHTML={{ __html: post.content }} />

        <RiskNote items={post.risk_note} />

        <p className="wc-disclaimer">
          <strong>非投資建議。</strong>
          本站內容為加密貨幣入門教學，非投資建議。任何投資都可能損失本金，請自行判斷並承擔風險。
        </p>

        <nav className="wc-postnav" aria-label="文章導覽">
          <Link className="wc-btn wc-btn--secondary" href="/posts/">
            回到教學列表
          </Link>
          {older ? (
            <Link className="wc-btn wc-btn--primary" href={older.permalink}>
              上一篇
            </Link>
          ) : null}
          {newer ? (
            <Link className="wc-btn wc-btn--primary" href={newer.permalink}>
              下一篇
            </Link>
          ) : null}
        </nav>
      </article>
    </main>
  );
}
