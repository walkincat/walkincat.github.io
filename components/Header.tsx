import Link from "next/link";
import { Logo } from "./Logo";

// /news is intentionally not linked from the navigation.
export function Header() {
  return (
    <header className="wc-header">
      <div className="wc-container wc-header__inner">
        <Logo />
        <nav className="wc-nav" aria-label="主要導覽">
          <Link href="/posts/">教學</Link>
          <Link href="/posts/#articles">文章</Link>
        </nav>
      </div>
    </header>
  );
}
