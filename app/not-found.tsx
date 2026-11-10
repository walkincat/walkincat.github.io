import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

// No canonical on the 404 page; Next.js also emits <meta name="robots" content="noindex">.
export const metadata: Metadata = {
  title: { absolute: `找不到這一頁｜${SITE_NAME}` },
  description: "找不到這一頁。",
  alternates: { canonical: null },
};

export default function NotFound() {
  return (
    <main id="main">
      <div className="wc-container wc-placeholder">
        <h1 className="wc-section__title">找不到這一頁</h1>
        <p>網址可能打錯了，或這篇文章已經搬家。</p>
        <Link className="wc-btn wc-btn--secondary" href="/">
          回首頁
        </Link>
      </div>
    </main>
  );
}
