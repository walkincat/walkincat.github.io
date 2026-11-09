import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { EmptyState } from "@/components/EmptyState";
import { PostCard } from "@/components/PostCard";
import { PostRow } from "@/components/PostRow";
import { posts } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { HOME_TITLE, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata = pageMetadata({
  title: `${SITE_NAME}｜${HOME_TITLE}`,
  absoluteTitle: true,
  description: SITE_TAGLINE,
  path: "/",
});

export default function HomePage() {
  const cards = posts.slice(0, 3);
  const latest = posts.slice(0, 5);
  return (
    <>
      <div className="wc12-home">
        <section className="wc-hero" aria-labelledby="hero-line">
          <div className="wc-hero__inner">
            <img
              className="wc-hero__logo"
              src="/avatar.jpg"
              width={400}
              height={400}
              alt="WalkinCat 走路貓 logo：戴淡紫色眼罩的貓頭"
              fetchPriority="high"
            />
            <h1 className="wc-hero__line" id="hero-line">
              跟著<em>走路貓</em>，<br className="wc-br-m" />
              慢慢走進<em>加密</em>世界
            </h1>
            <p className="wc-hero__sub">
              <span>白話新手教學・</span>
              <span>每篇都講風險・</span>
              <span>非投資建議</span>
            </p>
            <Link className="wc-btn wc-btn--primary" href="/posts/">
              看新手教學
              <ArrowIcon />
            </Link>
          </div>
        </section>
      </div>

      <main id="main">
        <section className="wc-section" aria-labelledby="tut-title">
          <div className="wc-container">
            <div className="wc-section__head">
              <h2 className="wc-section__title" id="tut-title">
                新手教學
              </h2>
              <Link href="/posts/">看全部教學</Link>
            </div>
            {cards.length > 0 ? (
              <div className="wc-cards">
                {cards.map((post, i) => (
                  <PostCard key={post.slug} post={post} index={i} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </section>

        {latest.length > 0 ? (
          <section className="wc-section" aria-labelledby="latest-title">
            <div className="wc-container">
              <div className="wc-section__head">
                <h2 className="wc-section__title" id="latest-title">
                  最新文章
                </h2>
                <Link href="/posts/#articles">看全部文章</Link>
              </div>
              <ol className="wc-rows">
                {latest.map((post) => (
                  <PostRow key={post.slug} post={post} />
                ))}
              </ol>
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
