import Link from "next/link";
import { formatDate, isRiskPending, readingMinutes, type Post } from "@/lib/posts";
import { Cover } from "./Cover";
import { PendingBadge } from "./RiskNote";

export function PostCard({ post, index, eager = false }: { post: Post; index: number; eager?: boolean }) {
  const pending = isRiskPending(post);
  const date = formatDate(post.date);
  return (
    <article className="wc-card">
      {post.sample ? <span className="wc-badge wc-badge--sample wc-card__sample">範例</span> : null}
      <Cover cover={post.cover} alt={post.cover_alt ?? `${post.title} 的封面`} variant={index} eager={eager} />
      <div className="wc-card__body">
        {pending ? (
          <div className="wc-badges">
            <PendingBadge />
          </div>
        ) : null}
        <h3 className="wc-card__title" title={post.title}>
          <Link href={post.permalink}>{post.title}</Link>
        </h3>
        {post.summary ? <p className="wc-card__summary">{post.summary}</p> : null}
        <div className="wc-card__meta">
          <span>
            {date ? <time dateTime={date}>{date}</time> : null}
            {date ? "・" : null}
            {readingMinutes(post.body)} 分鐘
          </span>
          <span className="wc-nia">非投資建議</span>
        </div>
      </div>
    </article>
  );
}
