import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, SITE_NAME, absoluteUrl, canonicalUrl } from "./site";

type PageMeta = {
  title: string;
  description: string;
  path: string;
  image?: { src: string; width: number; height: number };
  type?: "website" | "article";
  absoluteTitle?: boolean;
};

export function pageMetadata({ title, description, path, image, type = "website", absoluteTitle }: PageMeta): Metadata {
  const url = canonicalUrl(path);
  const og = image ?? { src: DEFAULT_OG_IMAGE, width: 1200, height: 630 };
  const imageUrl = absoluteUrl(og.src);
  const fullTitle = absoluteTitle ? title : `${title}｜${SITE_NAME}`;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      siteName: SITE_NAME,
      locale: "zh_TW",
      title: fullTitle,
      description,
      images: [{ url: imageUrl, width: og.width, height: og.height, alt: fullTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
  };
}
