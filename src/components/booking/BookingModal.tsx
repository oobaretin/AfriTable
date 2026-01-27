"use client";

import * as React from "react";
import { X } from "lucide-react";
import Image from "next/image";
import type { RestaurantRow } from "@/components/restaurant/RestaurantCard";

type BookingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  restaurant: RestaurantRow | null;
};

export function BookingModal({ isOpen, onClose, restaurant }: BookingModalProps) {
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative bg-[#050A18] border border-[#C69C2B]/30 rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto animate-in fade-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors p-2 z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-12 flex flex-col items-center text-center space-y-8">
            {/* Logo */}
            <div className="relative h-16 w-16">
              <Image
                src="/logo.png"
                alt="AfriTable Logo"
                fill
                className="object-contain"
              />
            </div>

            {/* Main Text */}
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-serif text-white font-normal leading-relaxed">
                AfriTable Concierge: Private Preview Coming Soon.
              </h2>
              
              {/* Sub-text */}
              <p className="text-sm text-white/70 leading-relaxed max-w-sm mx-auto">
                We are currently hand-selecting the finest tables for our grand launch.
              </p>
            </div>

            {/* Restaurant Address and Contact Concierge Section */}
            {restaurant && (
              <div className="w-full pt-6 border-t border-white/10 space-y-4">
                {/* Address */}
                <div className="text-sm text-white/80 leading-relaxed">
                  {typeof restaurant.address === "string" 
                    ? restaurant.address 
                    : (restaurant.address as any)?.street 
                      ? `${(restaurant.address as any).street}${(restaurant.address as any).city ? `, ${(restaurant.address as any).city}` : ""}${(restaurant.address as any).state ? `, ${(restaurant.address as any).state}` : ""}${(restaurant.address as any).zip ? ` ${(restaurant.address as any).zip}` : ""}`
                      : "Address not available"}
                </div>

                {/* Phone Number - Click to Call */}
                {restaurant.phone && (
                  <div className="flex flex-col items-center space-y-2 pt-2">
                    <a 
                      href={`tel:${restaurant.phone.replace(/\D/g, "")}`}
                      className="text-2xl md:text-3xl font-light text-white tracking-wider hover:text-[#C69C2B] transition-colors underline underline-offset-4 decoration-[#C69C2B]/50 hover:decoration-[#C69C2B]"
                    >
                      {restaurant.phone}
                    </a>
                    <p className="text-xs text-white/60 font-medium">
                      Click to Call
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
