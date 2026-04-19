"use client";

import * as React from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const cities = ["Houston", "Atlanta", "New York", "Los Angeles", "Dallas", "DC", "Chicago", "Miami", "Philadelphia", "Boston"];

const notifySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  city: z.string().min(1, "Please select a city"),
});

export function ContactAndMap() {
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
          source: "cities_of_flavor",
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.message || "Could not subscribe. Please try again.");
        return;
      }
      toast.success(`We'll notify you when we launch in ${parsed.data.city}!`);
      setEmail("");
      setSelectedCity("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-visible bg-white px-6 py-24" aria-label="Contact and city updates">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-brand-forest">Launching Soon</h2>
        <h3 className="mb-8 text-5xl font-black uppercase tracking-tighter text-brand-dark">
          Connecting the <br /> <span className="text-brand-bronze">Diaspora</span>
        </h3>

        <p className="mb-10 max-w-lg text-lg leading-relaxed text-slate-600">
          AfriTable is a nationwide directory—pick your metro below for launch updates where you dine, or reach us directly.
        </p>

        {/* City Tag Cloud */}
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

        {/* Contact / Notify Me Form */}
        <div className="mb-12 rounded-2xl border border-brand-bronze/10 bg-brand-paper p-6">
          <h4 id="contact-form-heading" className="mb-4 text-sm font-black uppercase tracking-tight text-brand-dark">
            Notify Me When We Launch
          </h4>
          <form onSubmit={handleNotifyMe} className="space-y-3" aria-labelledby="contact-form-heading">
            <input type="hidden" name="city" value={selectedCity} aria-hidden readOnly />
            <div>
              <label htmlFor="contact-city" className="sr-only">
                Select your city
              </label>
              <Select value={selectedCity} onValueChange={setSelectedCity} required>
                <SelectTrigger id="contact-city" className="w-full" aria-label="Select your city">
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
              <label htmlFor="contact-email" className="sr-only">
                Your email
              </label>
              <Input
                id="contact-email"
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
              <Button type="submit" disabled={loading} className="btn-bronze whitespace-nowrap" aria-label={loading ? "Submitting" : "Notify Me"}>
                {loading ? "..." : "Notify Me"}
              </Button>
            </div>
            <p className="text-xs text-slate-500">We&apos;ll send you an email when AfriTable launches in your city.</p>
          </form>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-bronze/10 bg-brand-paper text-xl shadow-sm">
              📧
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">General Inquiries</p>
              <a href="mailto:hello@afritable.com" className="font-bold text-brand-dark transition-colors hover:text-brand-bronze">
                hello@afritable.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-bronze/10 bg-brand-paper text-xl shadow-sm">
              🤝
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Partnerships</p>
              <a href="mailto:partners@afritable.com" className="font-bold text-brand-dark transition-colors hover:text-brand-bronze">
                partners@afritable.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
