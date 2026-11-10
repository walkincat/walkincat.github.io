import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_TAGLINE,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  verification: { google: "g21_amVh1pZkMW_AlQEm8KzOn-uufPSggpf3V6hu9CQ" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f8f8",
};

// Noto Sans TC is not preloaded: it is applied after the load event (see FONT_SCRIPT).
const FONT_FILES = ["/fonts/nunito-800.woff2", "/fonts/ibm-plex-mono-400.woff2"];

// Adds html.wc-fonts (which switches CJK text to Noto Sans TC) after the first page load.
// Later pages in the same session get it right away, since the font is already in the cache.
const FONT_SCRIPT = `(function(){var d=document.documentElement,k="wc-fonts";try{if(sessionStorage.getItem(k)){d.classList.add(k);return}}catch(e){}addEventListener("load",function(){d.classList.add(k);try{sessionStorage.setItem(k,"1")}catch(e){}})})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  for (const href of FONT_FILES) {
    preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  }
  return (
    <html lang="zh-Hant-TW" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: FONT_SCRIPT }} />
      </head>
      <body>
        <a className="wc-skip" href="#main">
          跳到主要內容
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
