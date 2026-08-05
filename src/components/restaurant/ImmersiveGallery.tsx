"use client";

import * as React from "react";
import { RestaurantCoverImage } from "@/components/restaurant/RestaurantCoverImage";
import { rankRestaurantImages } from "@/lib/restaurant-image";

type ImmersiveGalleryProps = {
  images: string[];
  restaurantName: string;
};

export function ImmersiveGallery({ images, restaurantName }: ImmersiveGalleryProps) {
  // Venue photos before Street View; never hero a SV when better shots exist
  const safeImages = React.useMemo(() => {
    const ranked = rankRestaurantImages(images);
    return ranked.length ? ranked : images?.filter(Boolean) ?? [];
  }, [images]);

  /** Avoid repeating the hero when a listing has fewer than four photos. */
  const galleryImage = (index: number) => {
    if (!safeImages.length) return "";
    if (index < safeImages.length) return safeImages[index];
    return safeImages[safeImages.length - 1];
  };
  
  // If no images, show placeholder gradient
  if (safeImages.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 h-[500px] gap-2 p-2">
        <div className="md:col-span-2 h-full overflow-hidden rounded-l-3xl bg-gradient-to-br from-brand-bronze/20 via-brand-ochre/10 to-brand-forest/20">
          <div className="h-full w-full flex items-center justify-center text-slate-400">
            <span className="text-4xl">📸</span>
          </div>
        </div>
        <div className="grid grid-rows-2 gap-2 md:col-span-1">
          <div className="h-full bg-gradient-to-br from-brand-bronze/10 to-brand-ochre/10 rounded-tr-3xl md:rounded-none"></div>
          <div className="h-full bg-gradient-to-br from-brand-forest/10 to-brand-bronze/10"></div>
        </div>
        <div className="hidden md:block h-full overflow-hidden rounded-r-3xl bg-gradient-to-br from-brand-ochre/20 to-brand-forest/20"></div>
      </div>
    );
  }

  // Get images for each position
  const mainImage = galleryImage(0);
  const secondImage = galleryImage(1);
  const thirdImage = galleryImage(2);
  const fourthImage = galleryImage(3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 h-[500px] gap-2 p-2">
      {/* Main large image - left side */}
      <div className="md:col-span-2 h-full overflow-hidden rounded-l-3xl group cursor-pointer">
        <div className="relative w-full h-full">
          <RestaurantCoverImage
            src={mainImage}
            alt={`${restaurantName} - Main`}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>

      {/* Two smaller images stacked - middle */}
      <div className="grid grid-rows-2 gap-2 md:col-span-1">
        <div className="h-full overflow-hidden rounded-tr-3xl md:rounded-none group cursor-pointer">
          <div className="relative w-full h-full">
            <RestaurantCoverImage
              src={secondImage}
              alt={`${restaurantName} - Interior`}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 25vw"
            />
          </div>
        </div>
        <div className="h-full overflow-hidden group cursor-pointer">
          <div className="relative w-full h-full">
            <RestaurantCoverImage
              src={thirdImage}
              alt={`${restaurantName} - Plating`}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 25vw"
            />
          </div>
        </div>
      </div>

      {/* Tall image - right side (hidden on mobile) */}
      <div className="hidden md:block h-full overflow-hidden rounded-r-3xl group cursor-pointer">
        <div className="relative w-full h-full">
          <RestaurantCoverImage
            src={fourthImage}
            alt={`${restaurantName} - Atmosphere`}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="25vw"
          />
        </div>
      </div>
    </div>
  );
}
