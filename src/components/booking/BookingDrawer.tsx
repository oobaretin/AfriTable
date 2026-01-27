"use client";

import * as React from "react";
import { X } from "lucide-react";
import Image from "next/image";
import type { RestaurantRow } from "@/components/restaurant/RestaurantCard";

type BookingDrawerProps = {
  restaurant: RestaurantRow | null;
  isOpen: boolean;
  onClose: () => void;
};

export function BookingDrawer({ restaurant, isOpen, onClose }: BookingDrawerProps) {
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [partySize, setPartySize] = React.useState("2");

  // Set default date to tomorrow
  React.useEffect(() => {
    if (isOpen && !date) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split("T")[0]);
    }
  }, [isOpen, date]);

  // Reset form when drawer closes
  React.useEffect(() => {
    if (!isOpen) {
      setDate("");
      setTime("");
      setPartySize("2");
    }
  }, [isOpen]);

  // Prevent body scroll when drawer is open
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    // Navigate to booking page with params
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (time) params.set("time", time);
    if (partySize) params.set("partySize", partySize);

    const url = `/restaurants/${restaurant.slug}${params.toString() ? `?${params.toString()}` : ""}`;
    window.location.href = url;
  };

  if (!restaurant) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Glassmorphism Background */}
        <div className="absolute inset-0 bg-[#050A18]/95 backdrop-blur-xl"></div>
        
        <div className="relative h-full flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="border-b border-white/10 p-8 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic leading-none mb-2">
                {restaurant.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors p-2 ml-4"
              aria-label="Close drawer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 p-8 space-y-10">
            {/* Date Input */}
            <div>
              <label className="block text-[10px] font-black text-[#C69C2B] uppercase tracking-[0.3em] mb-4">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
                className="w-full bg-transparent border-b-2 border-white/20 pb-3 px-0 text-white font-bold text-base focus:outline-none focus:border-[#C69C2B] transition-colors"
              />
            </div>

            {/* Time Input */}
            <div>
              <label className="block text-[10px] font-black text-[#C69C2B] uppercase tracking-[0.3em] mb-4">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full bg-transparent border-b-2 border-white/20 pb-3 px-0 text-white font-bold text-base focus:outline-none focus:border-[#C69C2B] transition-colors"
              />
            </div>

            {/* Guests Input */}
            <div>
              <label className="block text-[10px] font-black text-[#C69C2B] uppercase tracking-[0.3em] mb-4">
                Guests
              </label>
              <select
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                required
                className="w-full bg-transparent border-b-2 border-white/20 pb-3 px-0 text-white font-bold text-base focus:outline-none focus:border-[#C69C2B] transition-colors appearance-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                  <option key={size} value={size} className="bg-[#050A18] text-white">
                    {size} {size === 1 ? "Guest" : "Guests"}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-8">
              <button
                type="submit"
                className="w-full bg-[#A33B32] hover:bg-[#A33B32]/90 text-white text-sm font-black px-8 py-5 rounded-full uppercase tracking-widest transition-all"
              >
                Confirm Reservation
              </button>
            </div>
          </form>

          {/* Sankofa Branding Footer */}
          <div className="border-t border-white/10 p-8 flex flex-col items-center gap-4">
            <div className="relative h-12 w-12">
              <Image
                src="/logo.png"
                alt="Sankofa"
                fill
                className="object-contain"
                style={{ filter: "brightness(0) saturate(100%) invert(67%) sepia(95%) saturate(1352%) hue-rotate(5deg) brightness(102%) contrast(85%)" }}
              />
            </div>
            <p className="text-[10px] font-medium text-[#C69C2B] uppercase tracking-[0.2em] text-center">
              Honoring the Past, Finding your Table
            </p>
          </div>

          {/* Subtle Background Glow */}
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-900/10 blur-[80px] pointer-events-none"></div>
        </div>
      </div>
    </>
  );
}
