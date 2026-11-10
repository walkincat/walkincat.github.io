type CoverImage = { src: string; width: number; height: number };

const PALETTES = [
  { bg: "#ecebf6", big: "#b5b9e0", mid: "#9a92c9", band: "#b5b9e0" },
  { bg: "#b5b9e0", big: "#ecebf6", mid: "#9a92c9", band: "#9a92c9" },
  { bg: "#9a92c9", big: "#b5b9e0", mid: "#ecebf6", band: "#b5b9e0" },
];

/** Brand placeholder (cat ears + circles) when a post has no cover; the real image otherwise. */
export function Cover({
  cover,
  alt,
  variant = 0,
  className = "wc-cover",
  eager = false,
}: {
  cover?: CoverImage;
  alt: string;
  variant?: number;
  className?: string;
  eager?: boolean;
}) {
  if (cover) {
    return (
      <div className={className}>
        <img
          src={cover.src}
          width={cover.width}
          height={cover.height}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          decoding="async"
        />
      </div>
    );
  }
  const p = PALETTES[variant % PALETTES.length];
  return (
    <div className={className} role="img" aria-label="品牌佔位封面：淡紫圓形與貓耳圖形">
      <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="320" height="180" fill={p.bg} />
        <circle cx="70" cy="60" r="70" fill={p.big} />
        <circle cx="130" cy="104" r="30" fill={p.mid} />
        <path d="M222 182 L226 118 L250 136 Q264 130 278 136 L302 118 L306 182 Z" fill="#fff" stroke="#343334" strokeWidth="5" strokeLinejoin="round" />
        <rect x="236" y="148" width="56" height="16" rx="8" fill={p.band} />
      </svg>
    </div>
  );
}
