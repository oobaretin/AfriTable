import Link from "next/link";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HeroSearch } from "@/components/restaurant/HeroSearch";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { Reveal } from "@/components/layout/Reveal";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";

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

const CITIES: { label: string; href: string }[] = [
  { label: "Houston, TX", href: "/restaurants?city=Houston%2C%20TX" },
  { label: "Atlanta, GA", href: "/restaurants?city=Atlanta%2C%20GA" },
  { label: "Washington, DC", href: "/restaurants?city=Washington%2C%20DC" },
  { label: "New York, NY", href: "/restaurants?city=New%20York%2C%20NY" },
  { label: "Los Angeles, CA", href: "/restaurants?city=Los%20Angeles%2C%20CA" },
  { label: "Dallas, TX", href: "/restaurants?city=Dallas%2C%20TX" },
  { label: "Chicago, IL", href: "/restaurants?city=Chicago%2C%20IL" },
  { label: "Philadelphia, PA", href: "/restaurants?city=Philadelphia%2C%20PA" },
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

export default async function MainHomePage() {
  const featured = await getFeaturedRestaurants();

  return (
    <main>
      {/* Hero */}
      <section className="relative z-30 overflow-x-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,oklch(0.78_0.18_55),transparent_55%),radial-gradient(circle_at_80%_20%,oklch(0.35_0.06_145),transparent_55%),linear-gradient(135deg,oklch(0.16_0.02_55),oklch(0.10_0.01_145))]" />
        <div className="absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:40px_40px]" />

        <Container className="pb-16 pt-14 md:pb-24 md:pt-20">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center text-white">
              <Badge className="mx-auto mb-5 border-white/20 bg-white/10 text-white" variant="outline">
                African & Caribbean dining across America
              </Badge>
              <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
                Discover Authentic African &amp; Caribbean Dining
              </h1>
              <p className="mt-4 text-pretty text-base text-white/80 md:text-lg">
                Reserve tables at the best African and Caribbean restaurants across America.
              </p>
            </div>
          </Reveal>

          <div className="mt-10">
            <HeroSearch />
          </div>

          <Reveal className="mt-10">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3 text-sm text-white/80">
              <span className="font-medium text-white">Trending:</span>
              {CITIES.slice(0, 4).map((c) => (
                <Link key={c.label} href={c.href} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 hover:bg-white/10">
                  {c.label}
                </Link>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

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

        <div className="mt-6 flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(featured.length ? featured : Array.from({ length: 6 })).map((r: any, idx: number) => (
            <div key={r?.id ?? idx} className="w-[280px] shrink-0 md:w-[320px]">
              {r ? (
                <RestaurantCard restaurant={r} href={`/restaurants/${encodeURIComponent(r.slug)}`} />
              ) : (
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base">Coming soon</CardTitle>
                    <CardDescription>We’re onboarding restaurants now.</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    If you own a restaurant, join AfriTable to reach diners across America.
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>

        <div className="mt-2 md:hidden">
          <Button asChild variant="outline" className="w-full">
            <Link href="/restaurants">View all restaurants</Link>
          </Button>
        </div>
      </Section>

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
          {CUISINES.map((c) => (
            <Reveal key={c.label}>
              <Link href={c.href} className="block">
                <Card className="group overflow-hidden">
                  <div className="relative h-28 bg-gradient-to-br from-[oklch(0.94_0.05_80)] via-[oklch(0.98_0_0)] to-[oklch(0.92_0.05_145)]">
                    <div className="absolute inset-0 opacity-40 transition-opacity group-hover:opacity-60 [background:radial-gradient(circle_at_20%_30%,oklch(0.78_0.18_55),transparent_55%),radial-gradient(circle_at_80%_40%,oklch(0.35_0.06_145),transparent_55%)]" />
                  </div>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base">{c.label}</CardTitle>
                    <CardDescription>Explore restaurants</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Popular cities */}
      <section className="mx-auto max-w-6xl px-6 pb-14 md:pb-20">
        <Reveal>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Popular cities</h2>
            <p className="mt-2 text-muted-foreground">Find top African & Caribbean dining in major US markets.</p>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CITIES.map((c) => (
            <Reveal key={c.label}>
              <Link href={c.href} className="block">
                <Card className="group">
                  <CardHeader className="py-5">
                    <CardTitle className="text-base">{c.label}</CardTitle>
                    <CardDescription className="group-hover:text-foreground">Browse restaurants</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
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
            {[
              {
                title: "Browse & Discover",
                desc: "Find your favorite African & Caribbean cuisine.",
                icon: "🔎",
              },
              { title: "Reserve Your Table", desc: "Book instantly online in seconds.", icon: "🗓️" },
              { title: "Enjoy Your Meal", desc: "Show up, dine, and celebrate culture.", icon: "🍲" },
            ].map((s) => (
              <Reveal key={s.title}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="mb-2 text-2xl">{s.icon}</div>
                    <CardTitle className="text-lg">{s.title}</CardTitle>
                    <CardDescription>{s.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <Reveal>
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-[oklch(0.98_0_0)] via-[oklch(0.94_0.05_80)] to-[oklch(0.92_0.05_145)]">
            <CardHeader className="md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle>Own a restaurant?</CardTitle>
                <CardDescription>Join AfriTable and connect with diners across America.</CardDescription>
              </div>
              <Button asChild className="mt-4 md:mt-0">
                <Link href="/restaurant-signup">Get started</Link>
              </Button>
            </CardHeader>
          </Card>
        </Reveal>
      </section>
    </main>
  );
}

