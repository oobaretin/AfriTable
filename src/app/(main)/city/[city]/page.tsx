import "server-only";

import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { Button } from "@/components/ui/button";

function titleCaseFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateStaticParams() {
  // Requested cities (easy static perf + nice URLs)
  return [{ city: "houston" }, { city: "dallas" }, { city: "atlanta" }];
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const cityLabel = titleCaseFromSlug(params.city);
  return {
    title: `${cityLabel} Restaurants - AfriTable`,
    description: `Book tables at top African & Caribbean restaurants in ${cityLabel}.`,
  };
}

export default async function CityPage({ params }: { params: { city: string } }) {
  const citySlug = params.city.toLowerCase();
  const cityLabel = titleCaseFromSlug(citySlug);

  const supabase = createSupabaseServerClient();

  // Use generated column when available; ilike is case-insensitive.
  const { data } = await supabase
    .from("restaurants_with_rating")
    .select("*")
    .eq("is_active", true)
    .ilike("display_city", cityLabel)
    .order("avg_rating", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(48);

  const restaurants = (data ?? []) as any[];

  return (
    <main>
      <Section className="pb-0">
        <Container>
          <PageHeader
            title={
              <>
                African &amp; Caribbean restaurants in <span className="text-primary">{cityLabel}</span>
              </>
            }
            description="Discover bold flavors and reserve your table in minutes."
            right={
              <Button asChild variant="outline">
                <Link href={`/restaurants?city=${encodeURIComponent(cityLabel)}`}>Open full search</Link>
              </Button>
            }
          />
        </Container>
      </Section>

      <Section>
        <Container>
          {restaurants.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} href={`/restaurants/${encodeURIComponent(r.slug)}`} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border bg-background/60 p-8 text-sm text-muted-foreground">
              No active restaurants found in {cityLabel} yet. Try the{" "}
              <Link className="text-primary hover:underline" href="/restaurants">
                main restaurant list
              </Link>
              .
            </div>
          )}
        </Container>
      </Section>
    </main>
  );
}

