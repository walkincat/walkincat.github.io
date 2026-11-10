"use client";

import { useEffect, useRef, useState } from "react";

// Decorative skate cat. If the image fails (also before hydration), the element is removed.
export function IpCat({ className }: { className: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  if (failed) return null;
  return (
    <img
      ref={ref}
      className={`wc-ip ${className}`}
      src="/ip-skate-cat.webp"
      width={560}
      height={791}
      alt=""
      aria-hidden="true"
      onError={() => setFailed(true)}
    />
  );
}
