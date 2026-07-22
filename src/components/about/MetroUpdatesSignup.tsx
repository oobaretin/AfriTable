"use client";

import * as React from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const cities = [
  "Houston",
  "Atlanta",
  "New York",
  "Los Angeles",
  "Dallas",
  "DC",
  "Chicago",
  "Miami",
  "Philadelphia",
  "Boston",
  "Seattle",
  "Austin",
  "San Francisco",
];

const notifySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  city: z.string().min(1, "Please select a city"),
});

/** Metro expansion signup — belongs on About, not Contact. */
export function MetroUpdatesSignup() {
  const [email, setEmail] = React.useState("");
  const [selectedCity, setSelectedCity] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleNotifyMe(e: React.FormEvent) {
    e.preventDefault();
    const parsed = notifySchema.safeParse({ email, city: selectedCity });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      toast.error(firstError?.message || "Please check your input");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/city-notify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: parsed.data.email,
          city: parsed.data.city,
          source: "about_metro_updates",
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.message || "Could not subscribe. Please try again.");
        return;
      }
      toast.success(`You're on the list—we'll email you when we add more listings in ${parsed.data.city}.`);
      setEmail("");
      setSelectedCity("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-visible bg-slate-50 px-6 py-24" aria-labelledby="metro-updates-heading">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-brand-forest">Growing nationwide</p>
        <h2
          id="metro-updates-heading"
          className="mb-8 text-4xl font-black uppercase tracking-tighter text-brand-dark md:text-5xl"
        >
          Connecting the <span className="text-brand-bronze">Diaspora</span>
        </h2>

        <p className="mb-10 max-w-lg text-lg leading-relaxed text-slate-600">
          Our directory spans major U.S. metros today—and we&apos;re adding more vetted listings every month. Tell us
          where you dine and we&apos;ll notify you as AfriTable expands in your city.
        </p>

        <div className="mb-8 flex flex-wrap gap-3">
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              className={`rounded-full border px-5 py-2 text-sm font-bold transition-colors ${
                selectedCity === city
                  ? "border-brand-bronze bg-brand-paper text-brand-bronze"
                  : "cursor-pointer border-slate-200 text-slate-500 hover:border-brand-bronze hover:text-brand-bronze"
              }`}
              onClick={() => setSelectedCity(city)}
              aria-pressed={selectedCity === city}
            >
              {city}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-brand-bronze/10 bg-white p-6 shadow-sm">
          <h3 id="metro-updates-form-heading" className="mb-4 text-sm font-black uppercase tracking-tight text-brand-dark">
            Get updates in your city
          </h3>
          <form onSubmit={handleNotifyMe} className="space-y-3" aria-labelledby="metro-updates-form-heading">
            <input type="hidden" name="city" value={selectedCity} aria-hidden readOnly />
            <div>
              <label htmlFor="metro-updates-city" className="sr-only">
                Select your city
              </label>
              <Select value={selectedCity} onValueChange={setSelectedCity} required>
                <SelectTrigger id="metro-updates-city" className="w-full" aria-label="Select your city">
                  <SelectValue placeholder="Select your city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <label htmlFor="metro-updates-email" className="sr-only">
                Your email
              </label>
              <Input
                id="metro-updates-email"
                name="email"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
                autoComplete="email"
                aria-label="Your email"
              />
              <Button
                type="submit"
                disabled={loading}
                className="btn-bronze whitespace-nowrap"
                aria-label={loading ? "Submitting" : "Notify Me"}
              >
                {loading ? "..." : "Notify Me"}
              </Button>
            </div>
            <p className="text-xs text-slate-500">We&apos;ll email you when we add new vetted listings in your metro.</p>
          </form>
        </div>
      </div>
    </section>
  );
}
