"use client";

import * as React from "react";
import Image from "next/image";
import {
  isAfriTableBrandImage,
  RESTAURANT_BRAND_PLACEHOLDER,
  useNativeRestaurantImage,
} from "@/lib/restaurant-image";

const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

type RestaurantCoverImageProps = {
  src: string;
  /** Additional URLs to try when the primary src fails (e.g. Street View after expired venue photo). */
  fallbacks?: string[];
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
  fill?: boolean;
  width?: number;
  height?: number;
};

function buildCandidateList(src: string, fallbacks: string[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [src, ...(fallbacks ?? []), RESTAURANT_BRAND_PLACEHOLDER]) {
    const url = String(raw ?? "").trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

/** Cover image for cards/galleries; local brand SVGs use unoptimized to avoid Next optimizer errors. */
export function RestaurantCoverImage({
  src,
  fallbacks,
  alt,
  className = "object-cover",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
  loading,
  fill = true,
  width,
  height,
}: RestaurantCoverImageProps) {
  const candidates = React.useMemo(() => buildCandidateList(src, fallbacks), [src, fallbacks]);
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    setIndex(0);
  }, [candidates]);

  const currentSrc = candidates[Math.min(index, candidates.length - 1)] ?? RESTAURANT_BRAND_PLACEHOLDER;
  const brand = isAfriTableBrandImage(currentSrc);
  const native = useNativeRestaurantImage(currentSrc);

  const handleError = React.useCallback(() => {
    setIndex((current) => (current + 1 < candidates.length ? current + 1 : current));
  }, [candidates.length]);

  if (native) {
    const imgClass = fill
      ? `absolute inset-0 h-full w-full ${className}`
      : className;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary restaurant website hosts
      <img
        src={currentSrc}
        alt={alt}
        className={imgClass}
        loading={priority ? "eager" : loading ?? "lazy"}
        decoding="async"
        onError={handleError}
        width={fill ? undefined : width ?? 128}
        height={fill ? undefined : height ?? 128}
      />
    );
  }

  const shared = {
    src: currentSrc,
    alt,
    unoptimized: brand,
    priority,
    loading,
    className,
    onError: handleError,
    ...(brand ? {} : { placeholder: "blur" as const, blurDataURL: BLUR_DATA_URL }),
  };

  if (fill) {
    return <Image {...shared} fill sizes={sizes} />;
  }

  return <Image {...shared} width={width ?? 128} height={height ?? 128} sizes={sizes} />;
}
