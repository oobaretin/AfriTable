import Image from "next/image";
import { loadRestaurantsFromJSON } from "@/lib/restaurant-json-loader-server";
import { RestaurantsPageClient } from "./RestaurantsPageClient";

export default function RestaurantsPage() {
  const restaurantsFromJSON = loadRestaurantsFromJSON();

  return (
    <main className="min-h-[100vh] bg-[#000814]">
      {/* Sankofa Brand Bridge Separator with 3D Pattern */}
      <div className="py-12 bg-[#000814] relative">
        {/* 3D Isometric Hexagon Pattern - Header only */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundColor: '#000814',
            backgroundImage: `
              /* Hexagon top faces - brightest blue */
              linear-gradient(30deg, transparent 0%, transparent 45%, #003566 45%, #003566 55%, transparent 55%),
              linear-gradient(150deg, transparent 0%, transparent 45%, #003566 45%, #003566 55%, transparent 55%),
              linear-gradient(90deg, transparent 0%, transparent 45%, #003566 45%, #003566 55%, transparent 55%),
              /* Hexagon side facets - mid blue */
              linear-gradient(30deg, #001d3d 0%, #001d3d 45%, transparent 45%),
              linear-gradient(150deg, transparent 55%, #001d3d 55%, #001d3d 100%),
              linear-gradient(30deg, transparent 55%, #001d3d 55%, #001d3d 100%),
              linear-gradient(150deg, #001d3d 0%, #001d3d 45%, transparent 45%),
              linear-gradient(90deg, #001d3d 0%, #001d3d 45%, transparent 45%),
              linear-gradient(90deg, transparent 55%, #001d3d 55%, #001d3d 100%)`,
            backgroundSize: '100px 173px',
            backgroundPosition: '0 0, 50px 86px, 25px 43px, 75px 129px, 0 0, 50px 86px, 0 0, 50px 86px, 25px 43px, 75px 129px'
          }}
        />
        <div className="mx-auto max-w-6xl px-6 relative z-10">
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
