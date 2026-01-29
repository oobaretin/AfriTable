"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { PLACEHOLDERS } from "@/lib/placeholders";

type ShareStampProps = {
  restaurant: {
    name: string;
    cuisine?: string;
    city?: string;
    rating?: number;
    slug?: string;
  };
  mealImage: string;
  reviewText?: string;
  userName?: string;
};

export function ShareStamp({ restaurant, mealImage, reviewText }: ShareStampProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div className="group relative max-w-sm overflow-hidden rounded-[2.5rem] bg-brand-paper p-4 shadow-xl border border-brand-bronze/10">
      {/* The "Stamp" Photo Frame */}
      <div className="relative aspect-square overflow-hidden rounded-[2rem] mb-4">
        <Image
          src={mealImage || PLACEHOLDERS.medium}
          alt="Delicious Meal"
          fill
          className={`object-cover transition-transform duration-700 ${isHovered ? "scale-110" : ""}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
        {/* The Digital Watermark Overlay */}
        <div className="absolute top-4 right-4 h-16 w-16 opacity-90 backdrop-blur-sm bg-white/20 rounded-full flex items-center justify-center border border-white/30 rotate-12">
          <div className="text-3xl grayscale brightness-200">🦅</div>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-2 pb-2">
        <div className="flex items-start justify-between mb-2">
          <div>
            {restaurant.slug ? (
              <Link href={`/restaurants/${restaurant.slug}`}>
                <h4 className="font-black text-brand-dark uppercase tracking-tighter text-lg leading-none hover:text-brand-bronze transition-colors">
                  {restaurant.name}
                </h4>
              </Link>
            ) : (
              <h4 className="font-black text-brand-dark uppercase tracking-tighter text-lg leading-none">
                {restaurant.name}
              </h4>
            )}
            <p className="text-[10px] font-bold text-brand-bronze uppercase tracking-widest mt-1">
              {restaurant.cuisine || ""} {restaurant.city ? `• ${restaurant.city}` : ""}
            </p>
          </div>
          {restaurant.rating && (
            <span className="text-2xl">⭐ {restaurant.rating.toFixed(1)}</span>
          )}
        </div>

        {reviewText && (
          <p className="text-sm text-slate-600 italic leading-relaxed mb-4">
            &quot;{reviewText}&quot;
          </p>
        )}

        {/* Social Actions */}
        <div className="flex items-center justify-between border-t border-brand-bronze/5 pt-4">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 w-6 rounded-full border-2 border-brand-paper bg-slate-200 overflow-hidden">
                <Image
                  src={`https://i.pravatar.cc/100?img=${i + 10}`}
                  alt="User"
                  width={24}
                  height={24}
                  className="object-cover"
                />
              </div>
            ))}
            <span className="pl-4 text-[10px] font-bold text-slate-400 flex items-center tracking-tight">
              +12 others loved this
            </span>
          </div>
          
          <button className="flex items-center gap-1.5 text-xs font-black text-brand-bronze hover:text-brand-mutedRed transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0-10.628a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5m0 10.628a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0 4.5" />
            </svg>
            SHARE
          </button>
        </div>
      </div>
    </div>
  );
}
