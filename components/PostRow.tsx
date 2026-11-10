import Link from "next/link";
import { formatDate, type Post } from "@/lib/posts";

export function PostRow({ post }: { post: Post }) {
  const date = formatDate(post.date);
  return (
    <li className="wc-row">
      {date ? (
        <time className="wc-row__date" dateTime={date}>
          {date}
        </time>
      ) : (
        <span className="wc-row__date" aria-hidden="true" />
      )}
      <div className="wc-row__main">
        <h3 className="wc-row__title">
          <Link href={post.permalink}>{post.title}</Link>
        </h3>
        {post.summary ? <p className="wc-row__summary">{post.summary}</p> : null}
        <div className="wc-row__line">
          {post.sample ? <span className="wc-sample">範例</span> : null}
        </div>
      </div>
    </li>
  );
}
