import Link from "next/link";
import Image from "next/image";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HeroSearch } from "@/components/restaurant/HeroSearch";
import { Reveal } from "@/components/layout/Reveal";
import { Section } from "@/components/layout/Section";
import { TrendingCitiesClient } from "@/components/home/TrendingCitiesClient";
import { RestaurantGrid } from "@/components/home/RestaurantGrid";
import { RestaurantResults } from "@/components/home/RestaurantResults";
import { RestaurantOwnerCTA } from "@/components/home/RestaurantOwnerCTA";
import { LocalPulse } from "@/components/home/LocalPulse";
import { StickySearch } from "@/components/home/StickySearch";
import { HeritageSection } from "@/components/home/HeritageSection";
import { CommunityFeed } from "@/components/home/CommunityFeed";
import { SuccessStory } from "@/components/home/SuccessStory";
import { Leaderboard } from "@/components/home/Leaderboard";
import * as fs from "node:fs";
import * as path from "node:path";
import { loadRestaurantsFromJSON } from "@/lib/restaurant-json-loader-server";

// loadRestaurantsFromJSON is now imported from restaurant-json-loader-server

function loadHomeConfig() {
  try {
    const filePath = path.join(process.cwd(), "data", "home_config.json");
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error("[Homepage] Error loading home_config.json:", error);
  }
  return null;
}

export default async function MainHomePage() {
  const restaurantsFromJSON = loadRestaurantsFromJSON();
  const homeConfig = loadHomeConfig();

  return (
    <main>
      {/* Sticky Search Bar */}
      <StickySearch />
      
      {/* Hero - Search-First Design */}
      <HeroSearch />

      {/* Restaurant Results - Ultimate Dining Gallery */}
      <RestaurantResults restaurants={restaurantsFromJSON} />

      {/* Sankofa Brand Bridge Separator */}
      <div className="pt-8 pb-4 bg-[#050A18]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center">
            {/* Left line stretching to edge */}
            <div className="flex-1 h-px bg-white/10"></div>
            {/* Centered logo */}
            <div className="px-6">
              <div className="relative h-12 w-12">
                <Image
                  src="/logo.png"
                  alt="Sankofa"
                  fill
                  className="object-contain opacity-60"
                  style={{ filter: "brightness(0) saturate(100%) invert(67%) sepia(95%) saturate(1352%) hue-rotate(5deg) brightness(102%) contrast(85%)" }}
                />
              </div>
            </div>
            {/* Right line stretching to edge */}
            <div className="flex-1 h-px bg-white/10"></div>
          </div>
        </div>
      </div>

      {/* Restaurant Grid - Shows filtered results or all restaurants */}
      <div id="restaurants-section" className="pt-4 pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <RestaurantGrid restaurants={restaurantsFromJSON} />
          </Reveal>
        </div>
      </div>

      <Separator />

      {/* Local Pulse Section */}
      {homeConfig?.localPulse?.messages && (
        <LocalPulse messages={homeConfig.localPulse.messages} />
      )}

      <Separator />

      {/* Browse by cuisine */}
      <Section>
        <Reveal>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Browse by cuisine</h2>
            <p className="mt-2 text-muted-foreground">From jollof to jerk, explore your favorites.</p>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CUISINES.map((c) => {
            // Map cuisines to emojis and descriptions
            const cuisineInfo: Record<string, { emoji: string; description: string }> = {
              Nigerian: { emoji: "🥘", description: "Explore Jollof & Pounded Yam" },
              Ethiopian: { emoji: "🍛", description: "Discover Injera & Wat" },
              Jamaican: { emoji: "🍗", description: "Taste Jerk & Curry Goat" },
              Haitian: { emoji: "🍲", description: "Try Griot & Soup Joumou" },
              Ghanaian: { emoji: "🍽️", description: "Enjoy Banku & Fufu" },
              Senegalese: { emoji: "🥘", description: "Savor Thieboudienne" },
              Somali: { emoji: "🍖", description: "Experience Bariis & Hilib" },
              Eritrean: { emoji: "🍛", description: "Try Zigni & Injera" },
              "South African": { emoji: "🍖", description: "Taste Bobotie & Sosaties" },
              Kenyan: { emoji: "🍛", description: "Enjoy Nyama Choma & Ugali" },
              Trinidadian: { emoji: "🍛", description: "Try Doubles & Roti" },
              "Other African": { emoji: "🌍", description: "Explore African Flavors" },
              "Other Caribbean": { emoji: "🏝️", description: "Discover Island Cuisine" },
            };
            
            const info = cuisineInfo[c.label] || { emoji: "🍴", description: "Explore restaurants" };
            
            return (
              <Reveal key={c.label}>
                <Link href={c.href} className="block">
                  <div className="group relative overflow-hidden rounded-2xl bg-orange-600 p-8 text-white transition-all hover:scale-[1.02]">
                    <div className="absolute -right-4 -bottom-4 opacity-20 text-6xl rotate-12">{info.emoji}</div>
                    <h3 className="text-2xl font-black">{c.label}</h3>
                    <p className="text-orange-100 mb-4">{info.description}</p>
                    <span className="text-sm font-bold border-b-2 border-white pb-1">Explore →</span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* Trending cities */}
      <section className="mx-auto max-w-6xl px-6 pb-14 md:pb-20">
        <Reveal>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Trending cities</h2>
            <p className="mt-2 text-muted-foreground">Discover African & Caribbean restaurants by city.</p>
          </div>
        </Reveal>

        <Reveal className="mt-6">
          <TrendingCitiesClient restaurants={restaurantsFromJSON} />
        </Reveal>
      </section>

      {/* How it works */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <Reveal>
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">How it works</h2>
              <p className="mt-2 text-muted-foreground">A premium booking experience in three simple steps.</p>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {(homeConfig?.howItWorks?.steps || [
              {
                number: 1,
                title: "Discover",
                description: "We vet every restaurant for quality and authenticity. No more guessing.",
                icon: "🔎",
              },
              {
                number: 2,
                title: "Reserve",
                description: "Real-time availability. Your table is actually there when you arrive.",
                icon: "🗓️",
              },
              {
                number: 3,
                title: "Celebrate",
                description: "Join a community that values the stories behind the spices.",
                icon: "🍲",
              },
            ]).map((s: any) => (
              <Reveal key={s.title}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-3">
                      <div className="text-2xl">{s.icon}</div>
                      <span className="text-sm font-bold text-orange-600">Step {s.number}</span>
                    </div>
                    <CardTitle className="text-lg">{s.title}</CardTitle>
                    <CardDescription>{s.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Reveal>
            ))}
          </div>

          {/* The AfriTable Promise */}
          {homeConfig?.howItWorks?.promise && (
            <Reveal className="mt-12">
              <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-black text-slate-900 mb-3">
                    {homeConfig.howItWorks.promise.title}
                  </CardTitle>
                  <CardDescription className="text-base text-slate-700 leading-relaxed max-w-3xl mx-auto">
                    {homeConfig.howItWorks.promise.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Reveal>
          )}
        </div>
      </section>

      {/* Heritage Section */}
      <Reveal>
        <HeritageSection />
      </Reveal>

      {/* Community Feed */}
      <CommunityFeed />

      {/* Success Story */}
      <SuccessStory />

      {/* Ambassador's Circle Leaderboard */}
      <Reveal>
        <Leaderboard />
      </Reveal>

      {/* Restaurant Owner CTA */}
      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <Reveal>
          <RestaurantOwnerCTA />
        </Reveal>
      </section>
    </main>
  );
}
