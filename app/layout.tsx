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
  icons: { icon: "/avatar.jpg", apple: "/avatar.jpg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f8f8",
};

const FONT_FILES = ["/fonts/noto-sans-tc.woff2", "/fonts/nunito-800.woff2", "/fonts/ibm-plex-mono-400.woff2"];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  for (const href of FONT_FILES) {
    preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  }
  return (
    <html lang="zh-Hant-TW">
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
