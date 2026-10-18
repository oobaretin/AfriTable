"use client";

import * as React from "react";
import Image from "next/image";
import {
  isAfriTableBrandImage,
  isPlausibleRestaurantImageUrl,
  RESTAURANT_BRAND_PLACEHOLDER,
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
    if (!isPlausibleRestaurantImageUrl(url) && !isAfriTableBrandImage(url)) continue;
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
  const [remoteLoaded, setRemoteLoaded] = React.useState(false);

  React.useEffect(() => {
    setIndex(0);
    setRemoteLoaded(false);
  }, [candidates]);

  const currentSrc = candidates[Math.min(index, candidates.length - 1)] ?? RESTAURANT_BRAND_PLACEHOLDER;
  const brand = isAfriTableBrandImage(currentSrc);
  /** All remote http(s) photos use native img + no-referrer (Maps, CDN, restaurant sites). */
  const useNativeImg =
    !brand && (currentSrc.startsWith("http://") || currentSrc.startsWith("https://"));

  const tryNextCandidate = React.useCallback(() => {
    setRemoteLoaded(false);
    setIndex((current) => (current + 1 < candidates.length ? current + 1 : current));
  }, [candidates.length]);

  // Probe off-DOM: Google 403 often skips img onError/onLoad in the document.
  React.useEffect(() => {
    if (brand || !useNativeImg) return;
    let cancelled = false;
    const probe = new window.Image();
    probe.referrerPolicy = "no-referrer";
    probe.onload = () => {
      if (cancelled) return;
      if (probe.naturalWidth < 2) tryNextCandidate();
      else setRemoteLoaded(true);
    };
    probe.onerror = () => {
      if (!cancelled) tryNextCandidate();
    };
    probe.src = currentSrc;
    return () => {
      cancelled = true;
      probe.onload = null;
      probe.onerror = null;
    };
  }, [brand, useNativeImg, currentSrc, tryNextCandidate]);

  const handleRemoteLoad = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (img.naturalWidth < 2) {
        tryNextCandidate();
        return;
      }
      setRemoteLoaded(true);
    },
    [tryNextCandidate],
  );

  if (useNativeImg) {
    const imgClass = fill
      ? `absolute inset-0 h-full w-full ${className}`
      : className;
    const underlayClass = fill
      ? `absolute inset-0 h-full w-full object-cover ${className}`
      : `${className} object-cover`;
    return (
      <div className={fill ? "absolute inset-0" : "relative"}>
        <img
          src={RESTAURANT_BRAND_PLACEHOLDER}
          alt=""
          aria-hidden
          className={underlayClass}
          decoding="async"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- Maps + arbitrary website hosts */}
        <img
          key={currentSrc}
          src={currentSrc}
          alt={alt}
          className={`${imgClass} transition-opacity duration-200 ${remoteLoaded ? "opacity-100" : "opacity-0"}`}
          loading={priority ? "eager" : loading ?? "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={handleRemoteLoad}
          onError={tryNextCandidate}
          width={fill ? undefined : width ?? 128}
          height={fill ? undefined : height ?? 128}
        />
      </div>
    );
  }

  const shared = {
    src: currentSrc,
    alt,
    unoptimized: brand,
    priority,
    loading,
    className,
    onError: tryNextCandidate,
    ...(brand || !priority ? {} : { placeholder: "blur" as const, blurDataURL: BLUR_DATA_URL }),
  };

  if (fill) {
    return <Image {...shared} fill sizes={sizes} />;
  }

  return <Image {...shared} width={width ?? 128} height={height ?? 128} sizes={sizes} />;
}
