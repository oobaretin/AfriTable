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
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#000814]">
          {/* The Isometric Pattern */}
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `
                linear-gradient(30deg, #001d3d 12%, transparent 12.5%, transparent 87%, #001d3d 87.5%, #001d3d),
                linear-gradient(150deg, #001d3d 12%, transparent 12.5%, transparent 87%, #001d3d 87.5%, #001d3d),
                linear-gradient(30deg, #001d3d 12%, transparent 12.5%, transparent 87%, #001d3d 87.5%, #001d3d),
                linear-gradient(150deg, #001d3d 12%, transparent 12.5%, transparent 87%, #001d3d 87.5%, #001d3d),
                linear-gradient(60deg, #003566 25%, transparent 25.5%, transparent 75%, #003566 75%, #003566),
                linear-gradient(60deg, #003566 25%, transparent 25.5%, transparent 75%, #003566 75%, #003566)
              `,
              backgroundSize: '40px 70px',
              backgroundPosition: '0 0, 0 0, 20px 35px, 20px 35px, 0 0, 20px 35px'
            }}
          />
          {/* The Deep Shadow Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#000814]/50 to-[#000814]"></div>
        </div>
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
