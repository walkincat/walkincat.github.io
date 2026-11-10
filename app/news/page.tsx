import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

// Reserved route: noindex, no canonical, not in the sitemap, not linked from the navigation.
export const metadata: Metadata = {
  title: { absolute: `新聞（準備中）｜${SITE_NAME}` },
  description: "新聞頁準備中。",
  robots: { index: false, follow: true },
};

export default function NewsPage() {
  return (
    <main id="main">
      <div className="wc-container wc-placeholder">
        <h1 className="wc-section__title">新聞頁準備中</h1>
        <p>這一頁之後會整理每日加密與 AI 的第一手消息，目前還沒有內容。</p>
        <Link className="wc-btn wc-btn--secondary" href="/">
          回首頁
        </Link>
      </div>
    </main>
  );
}
