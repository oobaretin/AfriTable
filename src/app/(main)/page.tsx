import Link from "next/link";
import { HeroSearch } from "@/components/restaurant/HeroSearch";
import { Reveal } from "@/components/layout/Reveal";
import { TrendingCitiesClient } from "@/components/home/TrendingCitiesClient";
import { pulseCityToKey } from "@/lib/trending-cities";
import { HomeSearchProvider } from "@/components/home/HomeSearchProvider";
import { HomepageRestaurantSimple } from "@/components/home/HomepageRestaurantSimple";
import { LivePartnerSlugsProvider } from "@/contexts/live-partner-slugs-context";
import * as fs from "node:fs";
import * as path from "node:path";
import { loadRestaurantsFromJSON } from "@/lib/restaurant-json-loader-server";
import { pickHomepageSpotlight } from "@/lib/catalog-list-item";
import { buildTrendingCityGroups } from "@/lib/trending-cities-groups";
import { getLivePartnerSlugSet } from "@/lib/restaurant-partner-status";

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
  const livePartnerSlugs = [...(await getLivePartnerSlugSet())];
  const featuredCityKeys = (homeConfig?.localPulse?.messages ?? [])
    .map((message: { city?: string }) => (message.city ? pulseCityToKey(message.city) : null))
    .filter((key: string | null): key is string => Boolean(key));

  const homepageSpotlight = pickHomepageSpotlight(restaurantsFromJSON);
  const trendingCityGroups = buildTrendingCityGroups(restaurantsFromJSON, featuredCityKeys);

  return (
    <main>
      <LivePartnerSlugsProvider slugs={livePartnerSlugs}>
        <HomeSearchProvider>
        {/* One job: find a real sit-down table */}
        <HeroSearch sectionId="hero-search" />

        <div id="restaurants-section">
          <HomepageRestaurantSimple spotlight={homepageSpotlight} />
        </div>

        {/* Secondary: city discovery */}
        <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <Reveal>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Explore by city</h2>
              <p className="mt-2 text-muted-foreground">
                Vetted sit-down African and Caribbean dining across top metros.
              </p>
            </div>
          </Reveal>

          <Reveal className="mt-6">
            <TrendingCitiesClient cityGroups={trendingCityGroups} />
          </Reveal>
          <Reveal className="mt-6 flex justify-center">
            <Link
              href="/restaurants"
              className="text-sm font-semibold text-brand-mutedRed underline-offset-4 hover:underline"
            >
              Browse all restaurants →
            </Link>
          </Reveal>
        </section>

        {/* Slim partner path — not competing with diner discovery */}
        <section className="border-t border-slate-200 bg-brand-paper/60">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-bronze">Restaurant owners</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">Claim your listing and go live for booking.</p>
            </div>
            <Link
              href="/join-as-restaurant"
              className="inline-flex rounded-lg bg-brand-mutedRed px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-mutedRed/90"
            >
              Partner with AfriTable
            </Link>
          </div>
        </section>
      </HomeSearchProvider>
      </LivePartnerSlugsProvider>
    </main>
  );
}
