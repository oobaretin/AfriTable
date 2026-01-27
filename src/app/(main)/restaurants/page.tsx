import Image from "next/image";
import { Reveal } from "@/components/layout/Reveal";
import { CategoryFilterWrapper } from "@/components/home/CategoryFilterWrapper";
import { loadRestaurantsFromJSON } from "@/lib/restaurant-json-loader-server";

export default function RestaurantsPage() {
  const restaurantsFromJSON = loadRestaurantsFromJSON();

  return (
    <main>
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

      {/* Restaurant Grid - Shows filtered results or all restaurants */}
      <div className="pt-4 pb-16 bg-[#050A18]">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <CategoryFilterWrapper restaurants={restaurantsFromJSON} />
          </Reveal>
        </div>
      </div>
    </main>
  );
}

