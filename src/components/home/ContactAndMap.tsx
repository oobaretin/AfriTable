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
    <section className="py-24 px-6 bg-white overflow-visible" aria-label="Contact form and map">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          
          {/* Left: Contact Info & Cities */}
          <div>
            <h2 className="text-sm font-black text-brand-forest uppercase tracking-[0.3em] mb-4">
              Launching Soon
            </h2>
            <h3 className="text-5xl font-black text-brand-dark mb-8 tracking-tighter uppercase">
              Connecting the <br/> <span className="text-brand-bronze">Diaspora</span>
            </h3>
            
            <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-lg">
              We are currently establishing roots in major culinary hubs across the US. Don&apos;t see your city? Tell us where we should head next.
            </p>

            {/* City Tag Cloud */}
            <div className="flex flex-wrap gap-3 mb-8">
              {cities.map((city) => (
                <span 
                  key={city} 
                  className={`px-5 py-2 rounded-full border text-sm font-bold transition-colors cursor-default ${
                    selectedCity === city
                      ? "border-brand-bronze text-brand-bronze bg-brand-paper"
                      : "border-slate-200 text-slate-500 hover:border-brand-bronze hover:text-brand-bronze"
                  }`}
                  onClick={() => setSelectedCity(city)}
                >
                  {city}
                </span>
              ))}
            </div>

            {/* Contact / Notify Me Form - all inputs have id and name for accessibility and console */}
            <div className="mb-12 p-6 rounded-2xl border border-brand-bronze/10 bg-brand-paper">
              <h4 id="contact-form-heading" className="text-sm font-black text-brand-dark mb-4 uppercase tracking-tight">
                Notify Me When We Launch
              </h4>
              <form onSubmit={handleNotifyMe} className="space-y-3" aria-labelledby="contact-form-heading">
                <input type="hidden" name="city" value={selectedCity} aria-hidden readOnly />
                <div>
                  <label htmlFor="contact-city" className="sr-only">Select your city</label>
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
                  <label htmlFor="contact-email" className="sr-only">Your email</label>
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
                <p className="text-xs text-slate-500">
                  We&apos;ll send you an email when AfriTable launches in your city.
                </p>
              </form>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-brand-paper flex items-center justify-center text-xl shadow-sm border border-brand-bronze/10">
                  📧
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">General Inquiries</p>
                  <a href="mailto:hello@afritable.com" className="font-bold text-brand-dark hover:text-brand-bronze transition-colors">
                    hello@afritable.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-brand-paper flex items-center justify-center text-xl shadow-sm border border-brand-bronze/10">
                  🤝
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Partnerships</p>
                  <a href="mailto:partners@afritable.com" className="font-bold text-brand-dark hover:text-brand-bronze transition-colors">
                    partners@afritable.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Google Maps Embed - Houston, TX with dark-mode filter to match dark blue theme */}
          <div className="w-full h-[450px] rounded-2xl border border-white/10 overflow-hidden bg-[#000814]">
            <iframe
              title="AfriTable - Houston, TX"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d221448.2578125!2d-95.3698!3d29.7604!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8640b8b4488d8501%3A0xca0d74def889065!2sHouston%2C%20TX%2C%20USA!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
