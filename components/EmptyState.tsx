import Link from "next/link";

export function EmptyState() {
  return (
    <div className="wc-empty">
      <img src="/avatar.jpg" alt="" width={400} height={400} />
      <h2>還沒有文章，貓還在路上</h2>
      <p>第一篇教學整理好就會出現在這裡。</p>
      <Link className="wc-btn wc-btn--secondary" href="/">
        回首頁
      </Link>
    </div>
  );
}
