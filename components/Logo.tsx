import Link from "next/link";

export function Logo() {
  return (
    <Link className="wc-logo" href="/" aria-label="WalkinCat 走路貓 首頁">
      <span className="wc-logo__mark">
        <img src="/avatar.jpg" alt="" width={400} height={400} />
      </span>
      <span className="wc-logo__word" aria-hidden="true">
        Walkin<span>Cat</span>
      </span>
    </Link>
  );
}
