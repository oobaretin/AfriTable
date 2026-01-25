import "server-only";

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabasePublicClient } from "@/lib/supabase/public";
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

function buildCityHref(params: { city: string; cuisine?: string; price?: string | number }) {
  const sp = new URLSearchParams();
  if (params.cuisine) sp.set("cuisine", params.cuisine);
  if (params.price) sp.set("price", String(params.price));
  const qs = sp.toString();
  return `/city/${encodeURIComponent(params.city)}${qs ? `?${qs}` : ""}`;
}

function FilterLink(props: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <Button asChild variant={props.active ? "default" : "outline"} size="sm">
      <Link href={props.href} aria-label={props["aria-label"]}>
        {props.children}
      </Link>
    </Button>
  );
}

export default async function CityPage({
  params,
  searchParams,
}: {
  params: { city: string };
  searchParams?: { cuisine?: string; price?: string };
}) {
  const citySlug = decodeURIComponent(params.city).toLowerCase();
  const cityLabel = titleCaseFromSlug(citySlug);

  const cuisine = searchParams?.cuisine?.trim() || undefined;
  const price = searchParams?.price?.trim() || undefined;

  const supabase = createSupabasePublicClient();

  // Use generated column when available; ilike is case-insensitive.
  let query = supabase
    .from("restaurants_with_rating")
    .select("*")
    .eq("is_active", true)
    .ilike("display_city", cityLabel);

  if (cuisine) query = query.contains("cuisine_types", [cuisine]);
  if (price && Number.isFinite(Number(price))) query = query.eq("price_range", Number(price));

  const { data } = await query
    .order("avg_rating", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(48);

  const restaurants = (data ?? []) as any[];
  if (!restaurants.length) notFound();

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
            description={
              <>
                Discover authentic African cuisine in {cityLabel}. Book tables at Nigerian, Ethiopian, Ghanaian, and more.
              </>
            }
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
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            <FilterLink href={buildCityHref({ city: citySlug })} active={!cuisine && !price} aria-label="All">
              All
            </FilterLink>
            {["Nigerian", "Ethiopian", "Ghanaian", "Jamaican"].map((c) => (
              <FilterLink
                key={c}
                href={buildCityHref({ city: citySlug, cuisine: c, price })}
                active={cuisine === c}
                aria-label={`Cuisine ${c}`}
              >
                {c}
              </FilterLink>
            ))}
            <FilterLink
              href={buildCityHref({ city: citySlug, cuisine, price: 2 })}
              active={price === "2"}
              aria-label="Price 2"
            >
              $$
            </FilterLink>
            <FilterLink
              href={buildCityHref({ city: citySlug, cuisine, price: 3 })}
              active={price === "3"}
              aria-label="Price 3"
            >
              $$$
            </FilterLink>
          </div>

          {/* Restaurant list */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} href={`/restaurants/${encodeURIComponent(r.slug)}`} />
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}

