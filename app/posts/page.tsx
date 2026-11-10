import { EmptyState } from "@/components/EmptyState";
import { PostCard } from "@/components/PostCard";
import { PostRow } from "@/components/PostRow";
import { posts } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "新手教學與文章",
  description: "白話加密新手教學與文章列表：每篇先解釋名詞、寫出風險，非投資建議。",
  path: "/posts/",
});

// With 46 posts, the card grid shows only the newest few; 全部文章 below lists every post.
const CARD_COUNT = 6;

export default function PostsPage() {
  const cards = posts.slice(0, CARD_COUNT);
  return (
    <main id="main">
      <div className="wc-container wc-pagehead">
        <h1>新手教學與文章</h1>
        <p>每篇都先解釋名詞、寫出風險。本站內容為教學，非投資建議。</p>
      </div>

      <section className="wc-section wc-section--flush" aria-labelledby="tut-title">
        <div className="wc-container">
          <div className="wc-section__head">
            <h2 className="wc-section__title" id="tut-title">
              新手教學
            </h2>
            <p className="wc-section__desc">一步一步看</p>
          </div>
          {posts.length > 0 ? (
            <div className="wc-cards">
              {cards.map((post, i) => (
                <PostCard key={post.slug} post={post} index={i} eager={i === 0} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>

      <section className="wc-section" id="articles" aria-labelledby="articles-title">
        <div className="wc-container">
          <div className="wc-section__head">
            <h2 className="wc-section__title" id="articles-title">
              全部文章
            </h2>
          </div>
          {posts.length > 0 ? (
            <ol className="wc-rows">
              {posts.map((post) => (
                <PostRow key={post.slug} post={post} />
              ))}
            </ol>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>
    </main>
  );
}
