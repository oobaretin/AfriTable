import Link from "next/link";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HeroSearch } from "@/components/restaurant/HeroSearch";
import { Reveal } from "@/components/layout/Reveal";
import { Section } from "@/components/layout/Section";
import { CuisineFilterClient } from "@/components/home/CuisineFilterClient";
import { TrendingCitiesClient } from "@/components/home/TrendingCitiesClient";
import { RestaurantSearchBar } from "@/components/search/RestaurantSearchBar";
import { RestaurantGrid } from "@/components/home/RestaurantGrid";
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

type FeaturedRestaurant = {
  id: string;
  name: string;
  slug: string;
  cuisine_types: string[];
  price_range: number;
  address: unknown;
  images: string[];
  created_at: string;
  avg_rating: number | null;
  review_count: number;
  vibe_tags?: string[] | null;
};

const CUISINES: { label: string; href: string }[] = [
  { label: "Nigerian", href: "/restaurants?cuisine=Nigerian" },
  { label: "Ethiopian", href: "/restaurants?cuisine=Ethiopian" },
  { label: "Ghanaian", href: "/restaurants?cuisine=Ghanaian" },
  { label: "Senegalese", href: "/restaurants?cuisine=Senegalese" },
  { label: "Somali", href: "/restaurants?cuisine=Somali" },
  { label: "Eritrean", href: "/restaurants?cuisine=Eritrean" },
  { label: "South African", href: "/restaurants?cuisine=South%20African" },
  { label: "Kenyan", href: "/restaurants?cuisine=Kenyan" },
  { label: "Jamaican", href: "/restaurants?cuisine=Jamaican" },
  { label: "Trinidadian", href: "/restaurants?cuisine=Trinidadian" },
  { label: "Haitian", href: "/restaurants?cuisine=Haitian" },
  { label: "Other African", href: "/restaurants?cuisine=Other%20African" },
  { label: "Other Caribbean", href: "/restaurants?cuisine=Other%20Caribbean" },
];


async function getFeaturedRestaurants(): Promise<FeaturedRestaurant[]> {
  const supabase = createSupabasePublicClient();

  try {
    // Prefer explicitly featured restaurants that haven't expired.
    const nowIso = new Date().toISOString();
    const featuredQuery = await supabase
      .from("restaurants_with_rating")
      .select("id,name,slug,cuisine_types,price_range,address,images,created_at,avg_rating,review_count")
      .eq("is_active", true)
      .eq("is_featured", true)
      .or(`featured_until.is.null,featured_until.gt.${nowIso}`)
      .order("avg_rating", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(12);

    if (featuredQuery.error) {
      console.error("[Homepage] Error fetching featured restaurants:", {
        message: featuredQuery.error.message,
        details: featuredQuery.error.details,
        hint: featuredQuery.error.hint,
        code: featuredQuery.error.code,
      });
    }

    const featured = (featuredQuery.data ?? []) as FeaturedRestaurant[];
    if (featured.length) {
      console.log(`[Homepage] Found ${featured.length} featured restaurants`);
      return featured;
    }

    // Fallback: top-rated active restaurants.
    const { data, error } = await supabase
      .from("restaurants_with_rating")
      .select("id,name,slug,cuisine_types,price_range,address,images,created_at,avg_rating,review_count")
      .eq("is_active", true)
      .order("avg_rating", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      console.error("[Homepage] Error fetching restaurants:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return [];
    }

    console.log(`[Homepage] Found ${data?.length || 0} restaurants (fallback query)`);
    return (data ?? []) as FeaturedRestaurant[];
  } catch (err) {
    console.error("[Homepage] Unexpected error:", err);
    return [];
  }
}


// loadRestaurantsFromJSON is now imported from restaurant-json-loader-server

function getFeaturedRestaurantsFromJSON(): FeaturedRestaurant[] {
  const jsonRestaurants = loadRestaurantsFromJSON();
  
  // Priority restaurants to show first
  const priorityNames = ["Tatiana", "Swahili Village", "Apt 4B"];
  
  // Filter for restaurants with price_range "$$$"
  const premiumRestaurants = jsonRestaurants.filter((r) => r.price_range === "$$$");
  
  // Sort: priority restaurants first, then others
  const sortedRestaurants = premiumRestaurants.sort((a, b) => {
    const aIndex = priorityNames.findIndex(name => a.name.includes(name) || name.includes(a.name));
    const bIndex = priorityNames.findIndex(name => b.name.includes(name) || name.includes(b.name));
    
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex; // Both are priority, maintain order
    }
    if (aIndex !== -1) return -1; // a is priority
    if (bIndex !== -1) return 1; // b is priority
    return 0; // Neither is priority, maintain original order
  });
  
  // Transform JSON format to FeaturedRestaurant format
  return sortedRestaurants.map((r) => {
    // Convert price_range string to number: "$" = 1, "$$" = 2, "$$$" = 3, "$$$$" = 4
    const priceRangeMap: Record<string, number> = {
      $: 1,
      $$: 2,
      $$$: 3,
      $$$$: 4,
    };
    
    // Parse address string to extract city/state if needed
    let addressObj: unknown = r.address;
    if (typeof r.address === "string") {
      const parts = r.address.split(",").map((s) => s.trim());
      if (parts.length >= 2) {
        const cityState = parts[1];
        const cityMatch = cityState.match(/^([^,]+)/);
        const stateMatch = cityState.match(/\b([A-Z]{2})\b/);
        addressObj = {
          street: parts[0],
          city: cityMatch ? cityMatch[1].trim() : cityState,
          state: stateMatch ? stateMatch[1] : null,
          zip: parts.length > 2 ? parts[2] : null,
        };
      } else {
        addressObj = { street: r.address };
      }
    }
    
    return {
      id: r.id,
      name: r.name,
      slug: r.id, // Use id as slug
      cuisine_types: [r.cuisine], // Convert single cuisine string to array
      price_range: priceRangeMap[r.price_range] || 3,
      address: addressObj,
      images: r.images || [],
      created_at: new Date().toISOString(), // Use current date as fallback
      avg_rating: r.rating || null,
      review_count: 0, // JSON doesn't have review count
      vibe_tags: (r as any).vibe_tags || null, // Include vibe tags if available
      region: (r as any).region || null, // Include region field for color mapping
    };
  });
}

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
  // Get featured restaurants from JSON (filtered for $$$ price range)
  const featuredFromJSON = getFeaturedRestaurantsFromJSON();
  
  // Fallback to Supabase if no JSON restaurants found
  const featuredFromDB = await getFeaturedRestaurants();
  const featured = featuredFromJSON.length > 0 ? featuredFromJSON : featuredFromDB;
  
  const restaurantsFromJSON = loadRestaurantsFromJSON();
  const homeConfig = loadHomeConfig();

  return (
    <main>
      {/* Sticky Search Bar */}
      <StickySearch />
      
      {/* Hero - Search-First Design */}
      <HeroSearch />

      {/* Restaurant Search */}
      <Section>
        <Reveal>
          <div className="flex flex-col items-center gap-4">
            <div className="w-full text-center">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Search restaurants</h2>
              <p className="mt-2 text-muted-foreground">Find restaurants by name, city, or cuisine</p>
            </div>
            <div className="w-full">
              <RestaurantSearchBar restaurants={restaurantsFromJSON} />
            </div>
          </div>
        </Reveal>
      </Section>

      <Separator />

      {/* Restaurant Grid with Cuisine Filter */}
      <Section>
        <Reveal>
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">All restaurants</h2>
              <p className="mt-2 text-muted-foreground">
                Explore our complete collection of African & Caribbean restaurants.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <RestaurantGrid restaurants={restaurantsFromJSON} />
        </Reveal>
      </Section>

      <Separator />

      {/* Featured */}
      <Section>
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Featured restaurants</h2>
              <p className="mt-2 text-muted-foreground">
                Handpicked spots with bold flavors, great vibes, and easy reservations.
              </p>
            </div>
            <Button asChild variant="outline" className="hidden md:inline-flex">
              <Link href="/restaurants">View all</Link>
            </Button>
          </div>
        </Reveal>

        <Reveal className="mt-6">
          <CuisineFilterClient restaurants={featured} />
        </Reveal>

        <div className="mt-2 md:hidden">
          <Button asChild variant="outline" className="w-full">
            <Link href="/restaurants">View all restaurants</Link>
          </Button>
        </div>
      </Section>

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
