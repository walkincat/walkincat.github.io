import { SOCIAL_LINKS } from "@/lib/site";
import { SocialIcon } from "./icons";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="wc-footer">
      <div className="wc-container">
        <div className="wc-footer__top">
          <div className="wc-footer__brand">
            <Logo />
            <p>白話加密新手教學，一步一步、先解釋名詞、每篇都寫風險。本站內容為教學，非投資建議。</p>
          </div>
          <nav aria-label="社群連結">
            <ul className="wc-social">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.name}>
                  <a href={link.href} rel="me noopener">
                    <SocialIcon name={link.name} />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="wc-footer__bottom">
          <span>© WalkinCat 走路貓</span>
          <span>非投資建議・任何投資都可能損失本金</span>
        </div>
      </div>
    </footer>
  );
}
