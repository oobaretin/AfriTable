"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RestaurantCoverImage } from "@/components/restaurant/RestaurantCoverImage";
import { rankRestaurantImages } from "@/lib/restaurant-image";
import { cn } from "@/lib/utils";

type ImmersiveGalleryProps = {
  images: string[];
  restaurantName: string;
};

export function ImmersiveGallery({ images, restaurantName }: ImmersiveGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const safeImages = React.useMemo(() => {
    const ranked = rankRestaurantImages(images);
    return ranked.length ? ranked : images?.filter(Boolean) ?? [];
  }, [images]);

  const galleryImage = (index: number) => {
    if (!safeImages.length) return "";
    if (index < safeImages.length) return safeImages[index];
    return safeImages[safeImages.length - 1];
  };

  function openLightbox(index: number) {
    setActiveIndex(Math.min(index, safeImages.length - 1));
    setLightboxOpen(true);
  }

  function goPrev() {
    setActiveIndex((i) => (i - 1 + safeImages.length) % safeImages.length);
  }

  function goNext() {
    setActiveIndex((i) => (i + 1) % safeImages.length);
  }

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

  const mainImage = galleryImage(0);
  const secondImage = galleryImage(1);
  const thirdImage = galleryImage(2);
  const fourthImage = galleryImage(3);

  const panelClass = "h-full overflow-hidden group cursor-pointer";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 h-[500px] gap-2 p-2">
        <button
          type="button"
          className={cn(panelClass, "md:col-span-2 rounded-l-3xl text-left")}
          onClick={() => openLightbox(0)}
          aria-label={`View photo 1 of ${safeImages.length}`}
        >
          <div className="relative w-full h-full">
            <RestaurantCoverImage
              src={mainImage}
              alt={`${restaurantName} - Main`}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {safeImages.length > 1 && (
              <span className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                View all {safeImages.length} photos
              </span>
            )}
          </div>
        </button>

        <div className="grid grid-rows-2 gap-2 md:col-span-1">
          <button
            type="button"
            className={cn(panelClass, "rounded-tr-3xl md:rounded-none text-left")}
            onClick={() => openLightbox(1)}
            aria-label={`View photo 2 of ${safeImages.length}`}
          >
            <div className="relative w-full h-full">
              <RestaurantCoverImage
                src={secondImage}
                alt={`${restaurantName} - Interior`}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 25vw"
              />
            </div>
          </button>
          <button
            type="button"
            className={cn(panelClass, "text-left")}
            onClick={() => openLightbox(2)}
            aria-label={`View photo 3 of ${safeImages.length}`}
          >
            <div className="relative w-full h-full">
              <RestaurantCoverImage
                src={thirdImage}
                alt={`${restaurantName} - Plating`}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 25vw"
              />
            </div>
          </button>
        </div>

        <button
          type="button"
          className={cn(panelClass, "hidden md:block rounded-r-3xl text-left")}
          onClick={() => openLightbox(3)}
          aria-label={`View photo 4 of ${safeImages.length}`}
        >
          <div className="relative w-full h-full">
            <RestaurantCoverImage
              src={fourthImage}
              alt={`${restaurantName} - Atmosphere`}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="25vw"
            />
          </div>
        </button>
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl border-none bg-black/95 p-0 text-white">
          <DialogTitle className="sr-only">{restaurantName} photos</DialogTitle>
          <div className="relative">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
              aria-label="Close gallery"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative aspect-[16/10] w-full">
              <RestaurantCoverImage
                src={safeImages[activeIndex]}
                alt={`${restaurantName} photo ${activeIndex + 1}`}
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            {safeImages.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60"
                  onClick={goPrev}
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60"
                  onClick={goNext}
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium">
                  {activeIndex + 1} / {safeImages.length}
                </p>
                <div className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {safeImages.map((url, idx) => (
                    <button
                      key={url + idx}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={cn(
                        "relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2",
                        idx === activeIndex ? "border-brand-bronze" : "border-transparent opacity-70",
                      )}
                      aria-label={`View photo ${idx + 1}`}
                    >
                      <RestaurantCoverImage src={url} alt="" className="object-cover" sizes="80px" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
