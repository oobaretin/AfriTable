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

function agentLog(payload: Record<string, unknown>) {
  const body = JSON.stringify({ sessionId: "c696a7", timestamp: Date.now(), ...payload });
  // #region agent log
  fetch("/api/debug/session-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }).catch(() => {});
  fetch("http://127.0.0.1:7334/ingest/db39d61a-a551-4eae-93f4-8f741a47f367", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c696a7" },
    body,
  }).catch(() => {});
  // #endregion
}

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
  /** True once off-DOM probe (or onLoad) confirms pixels; avoids mounting dead URLs (broken icon). */
  const [remoteValidated, setRemoteValidated] = React.useState(false);

  React.useEffect(() => {
    setIndex(0);
    setRemoteValidated(false);
  }, [candidates]);

  const currentSrc = candidates[Math.min(index, candidates.length - 1)] ?? RESTAURANT_BRAND_PLACEHOLDER;
  const brand = isAfriTableBrandImage(currentSrc);
  /** All remote http(s) photos use native img + no-referrer (Maps, CDN, restaurant sites). */
  const useNativeImg =
    !brand && (currentSrc.startsWith("http://") || currentSrc.startsWith("https://"));

  const tryNextCandidate = React.useCallback(() => {
    setRemoteValidated(false);
    setIndex((current) => (current + 1 < candidates.length ? current + 1 : current));
  }, [candidates.length]);

  React.useEffect(() => {
    if (!brand || index === 0) return;
    agentLog({
      runId: "post-fix-3",
      hypothesisId: "H4",
      location: "RestaurantCoverImage.tsx:fallback-brand",
      message: "showing brand placeholder after remote failures",
      data: { index, candidateCount: candidates.length, alt: alt.slice(0, 40) },
    });
  }, [brand, index, candidates.length, alt]);

  // Probe off-DOM: Google 403 often skips img onError/onLoad in the document.
  React.useEffect(() => {
    if (brand || !useNativeImg) return;
    let cancelled = false;
    const probe = new window.Image();
    probe.referrerPolicy = "no-referrer";
    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      agentLog({
        runId: "post-fix-3",
        hypothesisId: "H15",
        location: "RestaurantCoverImage.tsx:probe-timeout",
        message: "off-DOM probe timed out",
        data: { index, candidateCount: candidates.length, srcTail: currentSrc.slice(-48) },
      });
      tryNextCandidate();
    }, 10_000);
    probe.onload = () => {
      if (cancelled) return;
      window.clearTimeout(timeoutId);
      const ok = probe.naturalWidth >= 2;
      agentLog({
        runId: "post-fix-3",
        hypothesisId: "H1",
        location: "RestaurantCoverImage.tsx:probe-onload",
        message: "off-DOM probe finished",
        data: {
          ok,
          nw: probe.naturalWidth,
          index,
          candidateCount: candidates.length,
          srcTail: currentSrc.slice(-48),
        },
      });
      if (!ok) tryNextCandidate();
      else setRemoteValidated(true);
    };
    probe.onerror = () => {
      if (cancelled) return;
      window.clearTimeout(timeoutId);
      agentLog({
        runId: "post-fix-3",
        hypothesisId: "H2",
        location: "RestaurantCoverImage.tsx:probe-onerror",
        message: "off-DOM probe error",
        data: { index, candidateCount: candidates.length, srcTail: currentSrc.slice(-48) },
      });
      tryNextCandidate();
    };
    probe.src = currentSrc;
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      probe.onload = null;
      probe.onerror = null;
    };
  }, [brand, useNativeImg, currentSrc, tryNextCandidate, index, candidates.length]);

  const handleRemoteLoad = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (img.naturalWidth < 2) {
        tryNextCandidate();
        return;
      }
      setRemoteValidated(true);
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
        {remoteValidated ? (
          /* eslint-disable-next-line @next/next/no-img-element -- Maps + arbitrary website hosts */
          <img
            key={currentSrc}
            src={currentSrc}
            alt={alt}
            className={`${imgClass} transition-opacity duration-200 opacity-100`}
            loading={priority ? "eager" : loading ?? "lazy"}
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={handleRemoteLoad}
            onError={tryNextCandidate}
            width={fill ? undefined : width ?? 128}
            height={fill ? undefined : height ?? 128}
          />
        ) : null}
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
