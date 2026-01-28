import { Suspense } from "react";
import Image from "next/image";
import { loadRestaurantsFromJSON } from "@/lib/restaurant-json-loader-server";
import { RestaurantCardSkeleton } from "@/components/home/RestaurantCardSkeleton";
import { RestaurantsGridClient } from "./RestaurantsGridClient";

function RestaurantsGrid() {
  const restaurantsFromJSON = loadRestaurantsFromJSON();
  return <RestaurantsGridClient restaurants={restaurantsFromJSON} />;
}

export default function RestaurantsPage() {
  return (
    <main className="min-h-[100vh] bg-[#050A18]">
      {/* Sankofa Brand Bridge Separator */}
      <div className="py-12 bg-[#050A18]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center">
            {/* Left line stretching to edge */}
            <div className="flex-1 h-px bg-white/10"></div>
            {/* Centered logo - matching Navbar */}
            <div className="px-6 flex items-center">
              <Image
                src="/logo.png"
                alt="AfriTable"
                width={420}
                height={120}
                className="h-10 w-auto object-contain"
              />
            </div>
            {/* Right line stretching to edge */}
            <div className="flex-1 h-px bg-white/10"></div>
          </div>
        </div>
      </div>

      {/* Premium Header */}
      <div className="bg-[#050A18] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center space-y-6">
            {/* Main Title */}
            <h1 className="text-5xl md:text-6xl font-serif text-[#C69C2B] font-normal">
              The Full Collection
            </h1>
            
            {/* Subtitle - Will be updated dynamically */}
            <p className="text-sm md:text-base text-white/60 tracking-[0.2em] uppercase">
              The Full Collection
            </p>
            
            {/* Divider Line */}
            <div className="flex justify-center pt-2">
              <div className="w-10 h-px bg-[#C69C2B]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Grid - Shows filtered results or all restaurants */}
      <div className="pb-16 bg-[#050A18] min-h-[100vh]">
        <div className="mx-auto max-w-6xl px-6">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <RestaurantCardSkeleton key={`suspense-skeleton-${i}`} />
                ))}
              </div>
            }
          >
            <RestaurantsGrid />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

