"use client";

import Image from "next/image";
import { isAfriTableBrandImage } from "@/lib/restaurant-image";

const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

type RestaurantCoverImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
  fill?: boolean;
  width?: number;
  height?: number;
};

/** Cover image for cards/galleries; local brand SVGs use unoptimized to avoid Next optimizer errors. */
export function RestaurantCoverImage({
  src,
  alt,
  className = "object-cover",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
  loading,
  fill = true,
  width,
  height,
}: RestaurantCoverImageProps) {
  const brand = isAfriTableBrandImage(src);
  const shared = {
    src,
    alt,
    unoptimized: brand,
    priority,
    loading,
    className,
    ...(brand ? {} : { placeholder: "blur" as const, blurDataURL: BLUR_DATA_URL }),
  };

  if (fill) {
    return <Image {...shared} fill sizes={sizes} />;
  }

  return <Image {...shared} width={width ?? 128} height={height ?? 128} sizes={sizes} />;
}
