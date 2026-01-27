"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Confetti } from "./Confetti";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  city?: string;
  images?: string[];
  address?: unknown;
};

type BookingDetails = {
  restaurantSlug: string;
  restaurantId: string;
  date: Date;
  time: string;
  partySize: number;
};

type BookingCheckoutProps = {
  restaurant: Restaurant;
  bookingDetails: BookingDetails;
};

export function BookingCheckout({ restaurant, bookingDetails }: BookingCheckoutProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);

  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequests: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          restaurantSlug: bookingDetails.restaurantSlug,
          date: format(bookingDetails.date, "yyyy-MM-dd"),
          time: bookingDetails.time,
          partySize: bookingDetails.partySize >= 20 ? "20+" : bookingDetails.partySize,
          guest: {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
          },
          specialRequests: formData.specialRequests.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to create reservation");
      }

      // Show confetti
      setShowConfetti(true);

      // Redirect to success page after a brief delay
      setTimeout(() => {
        router.push(`/reservation-success?restaurant=${encodeURIComponent(restaurant.slug)}&date=${format(bookingDetails.date, "yyyy-MM-dd")}`);
      }, 2000);
    } catch (error) {
      console.error("Reservation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create reservation. Please try again.");
      setIsSubmitting(false);
    }
  }

  function formatTime(time: string): string {
    try {
      // Handle both HH:mm and HH:mm:ss formats
      const [hours, minutes] = time.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return format(date, "h:mm a");
    } catch {
      return time;
    }
  }

  function formatDate(date: Date): string {
    return format(date, "EEEE, MMM d");
  }

  function extractCity(address: unknown): string {
    if (!address) return "";
    if (typeof address === "string") {
      const parts = address.split(",");
      return parts.length > 0 ? parts[parts.length - 2]?.trim() || "" : "";
    }
    if (typeof address === "object" && address !== null) {
      return (address as any).city || "";
    }
    return "";
  }

  const restaurantImage = restaurant.images?.[0] || "/api/placeholder/400/250";
  const city = extractCity(restaurant.address) || restaurant.city || "";

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="min-h-screen bg-brand-paper py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Left Side: The Form (3 Columns) */}
          <div className="lg:col-span-3 space-y-8">
            <header>
              <h1 className="text-4xl font-black text-brand-dark uppercase tracking-tighter mb-2">
                Secure Your Table
              </h1>
              <p className="text-brand-bronze font-bold text-sm tracking-widest uppercase">Step 2 of 2: Guest Information</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-bronze outline-none font-medium"
                    placeholder="Kofi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-bronze outline-none font-medium"
                    placeholder="Adabo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-bronze outline-none font-medium"
                  placeholder="kofi@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  minLength={7}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-bronze outline-none font-medium"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialRequests" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Special Notes (Optional)
                </Label>
                <Textarea
                  id="specialRequests"
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-bronze outline-none font-medium h-32 resize-none"
                  placeholder="Birthday, allergies, or table preference..."
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-bronze py-5 rounded-2xl text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-bronze/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Confirming..." : "Confirm Reservation"}
              </Button>
            </form>

            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              By clicking confirm, you agree to AfriTable&apos;s terms and the restaurant&apos;s policy.
            </p>
          </div>

          {/* Right Side: Order Summary (2 Columns) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 sticky top-12">
              <Image
                src={restaurantImage}
                alt={restaurant.name}
                width={400}
                height={250}
                className="w-full h-40 object-cover rounded-3xl mb-6"
              />
              <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tighter mb-1">
                {restaurant.name}
              </h3>
              <p className="text-brand-bronze font-bold text-xs uppercase tracking-widest mb-6">
                {city || "Location"}
              </p>

              <div className="space-y-4 pt-6 border-t border-slate-50">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</span>
                  <span className="font-black text-brand-dark">{formatDate(bookingDetails.date)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time</span>
                  <span className="font-black text-brand-dark">{formatTime(bookingDetails.time)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Guests</span>
                  <span className="font-black text-brand-dark">
                    {bookingDetails.partySize} {bookingDetails.partySize === 1 ? "Person" : "People"}
                  </span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-brand-paper rounded-2xl border border-brand-bronze/10 text-center">
                <p className="text-[10px] font-black text-brand-bronze uppercase">Booking Fee</p>
                <p className="text-xl font-black text-brand-dark">$0.00</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase">Complimentary for Pilot Members</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
