"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type NoResultsFoundProps = {
  searchedCity?: string;
  searchedCuisine?: string;
};

export function NoResultsFound({ searchedCity, searchedCuisine }: NoResultsFoundProps) {
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleNotifyMe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !searchedCity?.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/city-notify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          city: searchedCity.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to subscribe");
      }

      toast.success(`We'll notify you when we launch in ${searchedCity}!`);
      setEmail("");
    } catch (error) {
      console.error("Failed to subscribe:", error);
      toast.error(error instanceof Error ? error.message : "Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto my-20 px-6">
      <div className="bg-brand-paper rounded-[3rem] p-10 md:p-16 text-center border-2 border-dashed border-brand-bronze/20">
        {/* Visual Cue */}
        <div className="text-6xl mb-6 opacity-40" role="img" aria-label="Globe">
          🌍
        </div>

        <h2 className="text-3xl md:text-4xl font-black text-brand-dark uppercase tracking-tighter mb-4">
          We haven&apos;t reached <span className="text-brand-bronze">{searchedCity || "there"}</span> yet.
        </h2>

        <p className="text-slate-600 mb-10 max-w-lg mx-auto leading-relaxed italic">
          AfriTable is expanding fast. We don&apos;t have {searchedCuisine ? `${searchedCuisine} restaurants` : "restaurants"}{" "}
          listed here quite yet, but your interest helps us decide where to land next.
        </p>

        {/* Lead Capture Form */}
        {searchedCity && (
          <form onSubmit={handleNotifyMe} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-brand-bronze outline-none font-medium"
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-dark text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-forest transition-all shadow-xl disabled:opacity-50"
              >
                {isSubmitting ? "Subscribing..." : "Notify Me"}
              </Button>
            </div>
            <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Be the first to know when we launch in {searchedCity}.
            </p>
          </form>
        )}

        {/* Suggest a Restaurant Shortcut */}
        <div className="mt-12 pt-8 border-t border-brand-bronze/10">
          <p className="text-sm text-brand-dark font-bold mb-4">Know a great spot we missed?</p>
          <Link
            href="/submit-restaurant"
            className="text-brand-bronze font-black uppercase text-xs tracking-[0.2em] hover:text-brand-dark transition-colors inline-block"
          >
            Suggest a Restaurant →
          </Link>
        </div>
      </div>
    </div>
  );
}
