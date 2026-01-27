import Image from "next/image";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HeroSearch } from "@/components/restaurant/HeroSearch";
import { Reveal } from "@/components/layout/Reveal";
import { TrendingCitiesClient } from "@/components/home/TrendingCitiesClient";
import { CategoryFilterWrapper } from "@/components/home/CategoryFilterWrapper";
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
      <div className="py-12 bg-[#050A18]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center">
            {/* Left line stretching to edge */}
            <div className="flex-1 h-px bg-white/10"></div>
            {/* Centered logo - matching Navbar */}
            <div className="px-6 flex items-center">
              <Image
                src="/logo.png"
                alt="AfriTable"
                width={420}
                height={120}
                className="h-10 w-auto object-contain"
              />
            </div>
            {/* Right line stretching to edge */}
            <div className="flex-1 h-px bg-white/10"></div>
          </div>
        </div>
      </div>

      {/* Restaurant Grid - Shows filtered results or all restaurants */}
      <div id="restaurants-section" className="pt-4 pb-16 bg-[#050A18]">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <CategoryFilterWrapper restaurants={restaurantsFromJSON} />
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
