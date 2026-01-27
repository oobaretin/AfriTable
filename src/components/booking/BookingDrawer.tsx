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

type DrawerStep = "booking" | "waitlist" | "thankyou";

export function BookingDrawer({ restaurant, isOpen, onClose }: BookingDrawerProps) {
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [partySize, setPartySize] = React.useState("2");
  const [step, setStep] = React.useState<DrawerStep>("booking");
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
      setStep("booking");
      setEmail("");
      setIsSubmitting(false);
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

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    // Transition to Founding Member waitlist
    setStep("waitlist");
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    
    // TODO: Add API call to submit email to waitlist
    // For now, show thank you state after a brief delay
    setTimeout(() => {
      setIsSubmitting(false);
      setStep("thankyou");
    }, 1000);
  };

  // Get restaurant website URL
  const restaurantWebsite = React.useMemo(() => {
    if (!restaurant) return null;
    const website = (restaurant as any).website;
    if (website && typeof website === "string" && website !== "N/A") {
      return website.startsWith("http") ? website : `https://${website}`;
    }
    return null;
  }, [restaurant]);

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
          <div className="border-b border-white/10 p-8 flex items-start justify-between transition-all duration-300">
            <div className="flex-1">
              {step === "booking" && (
                <div className="transition-all duration-300">
                  <h2 className="text-[10px] font-black text-[#C69C2B] uppercase tracking-[0.5em] mb-2">
                    The Invitation
                  </h2>
                  <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic leading-none mb-3">
                    YOUR TABLE AWAITS
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed max-w-md">
                    From the pulse of Lagos to the heart of Harlem, we are curating the ultimate directory of the diaspora&apos;s finest tables. Tell us when you&apos;d like to dine, and we&apos;ll handle the rest.
                  </p>
                </div>
              )}
              {step === "waitlist" && (
                <div className="transition-all duration-300">
                  <h2 className="text-[10px] font-black text-[#C69C2B] uppercase tracking-[0.5em] mb-2">
                    The Capture
                  </h2>
                  <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                    BECOME A FOUNDING MEMBER
                  </h3>
                </div>
              )}
              {step === "thankyou" && (
                <div className="transition-all duration-300">
                  <h2 className="text-[10px] font-black text-[#C69C2B] uppercase tracking-[0.5em] mb-2">
                    The Confirmation
                  </h2>
                  <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                    YOU&apos;RE ON THE LIST
                  </h3>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors p-2 ml-4"
              aria-label="Close drawer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Booking Form, Waitlist Form, or Thank You */}
          <div className="flex-1 transition-all duration-300">
            {step === "booking" && (
            <form onSubmit={handleBookingSubmit} className="p-8 space-y-10">
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
            )}
            
            {step === "waitlist" && (
            <form onSubmit={handleWaitlistSubmit} className="p-8 flex flex-col justify-center min-h-[400px]">
              {/* Waitlist Message */}
              <p className="text-white/80 text-base leading-relaxed mb-6 text-center max-w-md mx-auto">
                AfriTable is currently in its private preview phase. We are fine-tuning our booking engine to ensure your experience is as seamless as the traditions we honor.
              </p>
              <p className="text-white/80 text-base leading-relaxed mb-10 text-center max-w-md mx-auto">
                Join the inner circle for VIP access to grand openings, secret menus, and the first seat at the table when we launch.
              </p>

              {/* Email Input */}
              <div className="mb-8">
                <label className="block text-[10px] font-black text-[#C69C2B] uppercase tracking-[0.3em] mb-4">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-transparent border-b-2 border-white/20 pb-3 px-0 text-white font-bold text-base placeholder:text-white/30 focus:outline-none focus:border-[#C69C2B] transition-colors"
                />
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#A33B32] hover:bg-[#A33B32]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black px-8 py-5 rounded-full uppercase tracking-widest transition-all"
                >
                  {isSubmitting ? "Securing..." : "SECURE MY ACCESS"}
                </button>
              </div>
            </form>
            )}

            {step === "thankyou" && (
            <div className="p-8 flex flex-col justify-center min-h-[400px]">
              <p className="text-white/80 text-base leading-relaxed mb-6 text-center max-w-md mx-auto">
                Welcome to the family. We&apos;ve noted your interest in <span className="font-bold text-white">{restaurant.name}</span> and will notify you the moment our booking concierge goes live.
              </p>
              
              {restaurantWebsite ? (
                <p className="text-white/80 text-base leading-relaxed mb-8 text-center max-w-md mx-auto">
                  In the meantime, you can explore their current menu here:{" "}
                  <a
                    href={restaurantWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C69C2B] hover:text-[#C69C2B]/80 underline underline-offset-4 font-bold"
                  >
                    {restaurant.name}
                  </a>
                </p>
              ) : (
                <p className="text-white/60 text-sm leading-relaxed mb-8 text-center max-w-md mx-auto">
                  We&apos;ll be in touch soon with exclusive access.
                </p>
              )}
            </div>
            )}
          </div>

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
