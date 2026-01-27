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
    <section className="py-24 px-6 bg-white overflow-hidden">
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

            {/* Notify Me Form */}
            <div className="mb-12 p-6 rounded-2xl border border-brand-bronze/10 bg-brand-paper">
              <h4 className="text-sm font-black text-brand-dark mb-4 uppercase tracking-tight">
                Notify Me When We Launch
              </h4>
              <form onSubmit={handleNotifyMe} className="space-y-3">
                <Select value={selectedCity} onValueChange={setSelectedCity} required>
                  <SelectTrigger className="w-full">
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
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading} className="btn-bronze whitespace-nowrap">
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

          {/* Right: Stylized Map Visual */}
          <div className="relative">
            <div className="aspect-square bg-brand-paper rounded-[3rem] border border-brand-bronze/5 relative overflow-hidden group">
              {/* Map Background Pattern */}
              <div className="absolute inset-0 opacity-10 grayscale hover:grayscale-0 transition-all duration-700 bg-[url('https://www.transparenttextures.com/patterns/world-map.png')] bg-center bg-no-repeat bg-contain"></div>
              
              {/* Map Pins (Simulated) */}
              <div className="absolute top-1/4 left-1/3 animate-bounce">
                <div className="h-4 w-4 rounded-full bg-brand-mutedRed shadow-[0_0_15px_rgba(163,59,50,0.5)]"></div>
              </div>
              <div className="absolute bottom-1/3 right-1/4 animate-bounce" style={{ animationDelay: "150ms" }}>
                <div className="h-4 w-4 rounded-full bg-brand-forest shadow-[0_0_15px_rgba(45,90,39,0.5)]"></div>
              </div>
              <div className="absolute top-1/2 right-1/2 animate-bounce" style={{ animationDelay: "300ms" }}>
                <div className="h-4 w-4 rounded-full bg-brand-ochre shadow-[0_0_15px_rgba(198,156,43,0.5)]"></div>
              </div>

              {/* Stats Overlay */}
              <div className="absolute bottom-8 left-8 right-8 bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white shadow-xl">
                 <p className="text-[10px] font-black uppercase text-brand-bronze mb-2">Network Status</p>
                 <div className="flex justify-between items-end">
                    <div>
                       <p className="text-2xl font-black text-brand-dark">Launching</p>
                       <p className="text-xs font-bold text-slate-500">Spring 2026</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-brand-forest">95% Ready</p>
                       <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-brand-forest w-[95%] transition-all duration-500"></div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
