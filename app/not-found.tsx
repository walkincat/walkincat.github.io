import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { IpCat } from "@/components/IpCat";
import { SITE_NAME } from "@/lib/site";

// No canonical on the 404 page; Next.js also emits <meta name="robots" content="noindex">.
export const metadata: Metadata = {
  title: { absolute: `找不到這一頁｜${SITE_NAME}` },
  description: "找不到這一頁。",
  alternates: { canonical: null },
};

export default function NotFound() {
  return (
    <main id="main" className="wc-404">
      <div className="wc-404__inner">
        <IpCat className="wc-404__cat" />
        <h1 className="wc-404__title">這一頁走丟了</h1>
        <p className="wc-404__lead">
          貓循著腳印也沒找到，先回首頁，<br />或從新手教學重新出發。
        </p>
        <div className="wc-404__actions">
          <Link className="wc-btn wc-btn--primary" href="/">
            回首頁
            <ArrowIcon />
          </Link>
          <Link className="wc-btn wc-btn--secondary" href="/posts/">
            看教學
          </Link>
        </div>
      </div>
    </main>
  );
}
