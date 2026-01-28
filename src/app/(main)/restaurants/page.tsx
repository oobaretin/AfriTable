import Image from "next/image";
import { loadRestaurantsFromJSON } from "@/lib/restaurant-json-loader-server";
import { RestaurantsPageClient } from "./RestaurantsPageClient";

function RestaurantsGrid() {
  const restaurantsFromJSON = loadRestaurantsFromJSON();
  return <RestaurantsGridClient restaurants={restaurantsFromJSON} />;
}

export default function RestaurantsPage() {
  const restaurantsFromJSON = loadRestaurantsFromJSON();

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

      {/* Zip Code Search and Vibe Filter Section */}
      <RestaurantsPageSearchWrapper restaurants={restaurantsFromJSON} />

      {/* Restaurant Grid - Shows filtered results or all restaurants */}
      <div className="pb-16 bg-[#050A18] min-h-[100vh] flex flex-col">
        <div className="mx-auto max-w-6xl px-6 flex-1 flex flex-col">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
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

// Client component wrapper for search
function RestaurantsPageSearchWrapper({ restaurants }: { restaurants: any[] }) {
  return <RestaurantsPageSearch restaurants={restaurants} onFilterChange={() => {}} />;
}

