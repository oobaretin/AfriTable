import Image from "next/image";
import { loadRestaurantsFromJSON } from "@/lib/restaurant-json-loader-server";
import { RestaurantsPageClient } from "./RestaurantsPageClient";

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

      {/* Zip Code Search, Vibe Filter, and Restaurant Grid */}
      <RestaurantsPageClient restaurants={restaurantsFromJSON} />
    </main>
  );
}
