import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhotoGallery } from "@/components/restaurant/PhotoGallery";
import { FavoriteButton } from "@/components/restaurant/FavoriteButton";
import { ShareButton } from "@/components/restaurant/ShareButton";
import { ReservationWidget } from "@/components/reservation/ReservationWidget";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { generateDefaultContent } from "@/lib/restaurant-content-helpers";

type RestaurantDetail = {
  id: string;
  name: string;
  slug: string;
  cuisine_types: string[];
  price_range: number;
  description: string | null;
  our_story: string | null;
  cultural_roots: string | null;
  special_features: string | null;
  menu: any;
  address: any;
  phone: string | null;
  website: string | null;
  instagram_handle: string | null;
  facebook_url: string | null;
  images: string[];
  hours: any;
  avg_rating: number | null;
  review_count: number;
};

export const revalidate = 3600;

function priceLabel(priceRange: number) {
  return "$".repeat(Math.max(1, Math.min(4, priceRange)));
}

function googleMapsLink(addressString: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressString)}`;
}

function addressToString(address: any): string {
  if (!address) return "";
  // Handle both object format and string format
  if (typeof address === "string") return address;
  const street = address.street ?? "";
  const city = address.city ?? "";
  const state = address.state ?? "";
  const zip = address.zip ?? "";
  const parts = [street, city, state, zip].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "";
}

function normalizeInstagramUrl(handleOrUrl: string | null | undefined): string {
  if (!handleOrUrl || typeof handleOrUrl !== "string") return "#";
  // If it's already a full URL, return it
  if (handleOrUrl.startsWith("http://") || handleOrUrl.startsWith("https://")) {
    return handleOrUrl;
  }
  // Otherwise, construct the Instagram URL from the handle
  const cleanHandle = handleOrUrl.replace(/^@/, "").replace(/^instagram\.com\//, "").replace(/\/$/, "");
  return `https://www.instagram.com/${cleanHandle}/`;
}

type OperatingHour = { day_of_week: number; open_time: string; close_time: string };

function normalizeOperatingHours(input: unknown): OperatingHour[] {
  const list = Array.isArray(input) ? input : [];
  return list
    .map((o: any) => ({
      day_of_week: Number(o?.day_of_week),
      open_time: String(o?.open_time ?? ""),
      close_time: String(o?.close_time ?? ""),
    }))
    .filter(
      (o) =>
        Number.isFinite(o.day_of_week) &&
        o.day_of_week >= 0 &&
        o.day_of_week <= 6 &&
        /^\d{2}:\d{2}$/.test(o.open_time) &&
        /^\d{2}:\d{2}$/.test(o.close_time),
    );
}

function pickOperatingHours(...candidates: OperatingHour[][]): OperatingHour[] {
  for (const c of candidates) {
    if (Array.isArray(c) && c.length) return c;
  }
  return [];
}

function todayHours(operatingHours: any, date = new Date()) {
  const list = normalizeOperatingHours(operatingHours);
  if (!list.length) return { label: "Hours coming soon", openNow: false, hasHours: false };
  const dow = date.getDay();
  const rule = list.find((o: any) => o?.day_of_week === dow);
  if (!rule) return { label: "Closed", openNow: false, hasHours: true };
  const open = String(rule.open_time ?? "");
  const close = String(rule.close_time ?? "");
  const now = format(date, "HH:mm");
  const openNow = open && close ? now >= open && now < close : false;
  return { label: `${open}–${close}`, openNow, hasHours: true };
}

async function getRestaurantBySlug(slug: string): Promise<RestaurantDetail | null> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("restaurants_with_rating")
    .select(
      "id,name,slug,cuisine_types,price_range,description,our_story,cultural_roots,special_features,menu,address,phone,website,instagram_handle,facebook_url,images,hours,avg_rating,review_count",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return (data ?? null) as any;
}

async function getOperatingHours(restaurantId: string, restaurantHours: unknown) {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase
    .from("availability_settings")
    .select("operating_hours")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  const fromSettings = normalizeOperatingHours(data?.operating_hours);
  const fromRestaurant = normalizeOperatingHours(restaurantHours);
  return pickOperatingHours(fromSettings, fromRestaurant);
}

async function getReviews(restaurantId: string) {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase
    .from("reviews")
    .select("id,user_id,overall_rating,food_rating,service_rating,ambiance_rating,review_text,photos,restaurant_response,created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

async function getSimilarRestaurants(restaurantId: string, cuisines: string[]) {
  const supabase = createSupabasePublicClient();
  if (!Array.isArray(cuisines) || cuisines.length === 0) return [];

  const { data } = await supabase
    .from("restaurants_with_rating")
    .select("id,name,slug,cuisine_types,price_range,address,images,avg_rating,review_count,is_active,created_at")
    .eq("is_active", true)
    .neq("id", restaurantId)
    // best-effort: filter in app (json/array contains differs across drivers)
    .order("avg_rating", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as any[];
  const cuisineSet = new Set(cuisines.map((c) => c.toLowerCase()));

  // First, try to find restaurants with any matching cuisine type
  const matching = rows.filter((r) => {
    if (!Array.isArray(r.cuisine_types)) return false;
    return r.cuisine_types.some((c: string) => cuisineSet.has(c.toLowerCase()));
  });

  // If we have enough matches (at least 3), return them
  if (matching.length >= 3) {
    return matching.slice(0, 6);
  }

  // Otherwise, fall back to top-rated restaurants (still excluding the current one)
  return rows.slice(0, 6);
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const restaurant = await getRestaurantBySlug(params.slug);
  if (!restaurant) return {};

  const addr = addressToString(restaurant.address);
  const title = `${restaurant.name} | AfriTable`;
  const description = restaurant.description
    ? `${restaurant.description.slice(0, 160)}${restaurant.description.length > 160 ? "…" : ""}`
    : `Reserve a table at ${restaurant.name}${addr ? ` in ${addr}` : ""}.`;

  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/restaurants/${encodeURIComponent(restaurant.slug)}` },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/restaurants/${encodeURIComponent(restaurant.slug)}`,
      images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: title }],
    },
  };
}

export default async function RestaurantProfilePage({ params }: { params: { slug: string } }) {
  const restaurant = await getRestaurantBySlug(params.slug);
  if (!restaurant) notFound();

  const [operatingHours, reviews, similar] = await Promise.all([
    getOperatingHours(restaurant.id, restaurant.hours),
    getReviews(restaurant.id),
    getSimilarRestaurants(restaurant.id, restaurant.cuisine_types),
  ]);

  const addrStr = addressToString(restaurant.address);
  const todays = todayHours(operatingHours);

  // Simple histogram (client-friendly)
  const histogram = [0, 0, 0, 0, 0];
  for (const r of reviews) {
    const rating = Math.max(1, Math.min(5, Number((r as any).overall_rating || 0)));
    histogram[rating - 1] += 1;
  }

  const avg = restaurant.avg_rating ?? null;

  // Generate default content if missing
  const defaultContent = generateDefaultContent(
    restaurant.name,
    restaurant.cuisine_types || [],
    restaurant.description,
  );
  const ourStory = restaurant.our_story || defaultContent.our_story;
  const culturalRoots = restaurant.cultural_roots || defaultContent.cultural_roots;
  const specialFeatures = restaurant.special_features || defaultContent.special_features;

  // Build JSON-LD with proper undefined handling
  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: String(restaurant.name || "").replace(/[\u0000-\u001F\u007F-\u009F]/g, ""),
    url: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000") + `/restaurants/${restaurant.slug}`,
    servesCuisine: (restaurant.cuisine_types ?? []).map((c: string) => String(c).replace(/[\u0000-\u001F\u007F-\u009F]/g, "")),
    priceRange: priceLabel(restaurant.price_range),
  };

  if (restaurant.phone) {
    jsonLd.telephone = restaurant.phone;
  }

  if (addrStr && restaurant.address) {
    const addressObj: any = {
      "@type": "PostalAddress",
      addressCountry: "US",
    };
    if (restaurant.address.street) addressObj.streetAddress = String(restaurant.address.street).replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    if (restaurant.address.city) addressObj.addressLocality = String(restaurant.address.city).replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    if (restaurant.address.state) addressObj.addressRegion = String(restaurant.address.state).replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    if (restaurant.address.zip) addressObj.postalCode = String(restaurant.address.zip).replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    jsonLd.address = addressObj;
  }

  if (avg != null) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avg,
      reviewCount: restaurant.review_count ?? 0,
    };
  }

  const reviewList = (reviews ?? []).slice(0, 5).map((r: any) => ({
    "@type": "Review",
    author: { "@type": "Person", name: "Verified Diner" },
    datePublished: r.created_at || new Date().toISOString(),
    reviewBody: String(r.review_text || "").replace(/[\u0000-\u001F\u007F-\u009F]/g, ""),
    reviewRating: { "@type": "Rating", ratingValue: Number(r.overall_rating) || 0, bestRating: 5, worstRating: 1 },
  }));
  if (reviewList.length > 0) {
    jsonLd.review = reviewList;
  }

  const hoursList = (operatingHours ?? [])
    .filter((o: any) => o?.open_time && o?.close_time)
    .map((o: any) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][Number(o.day_of_week) ?? 0],
      opens: o.open_time,
      closes: o.close_time,
    }));
  if (hoursList.length > 0) {
    jsonLd.openingHoursSpecification = hoursList;
  }

  // Safely stringify JSON-LD, removing any circular references or invalid values
  let jsonLdString = "";
  try {
    jsonLdString = JSON.stringify(jsonLd, null, 0);
  } catch (error) {
    console.error("Error stringifying JSON-LD:", error);
    jsonLdString = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: restaurant.name,
    });
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 md:py-14">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          Home
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href="/restaurants" className="text-muted-foreground hover:text-foreground">
          Restaurants
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{restaurant.name}</span>
      </div>

      {/* Main Layout - Single Grid for Proper Alignment */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start w-full">
        {/* Left Column - All Content */}
        <div className="lg:col-span-8 w-full">
          {/* Photo Gallery */}
          <PhotoGallery name={restaurant.name} images={restaurant.images} />

          {/* Restaurant Header */}
          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between w-full">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{restaurant.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{priceLabel(restaurant.price_range)}</Badge>
                {restaurant.cuisine_types?.slice(0, 6).map((c) => (
                  <Badge key={c} variant="outline">
                    {c}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{addrStr || "United States"}</span>
                <span>•</span>
                <span>
                  {avg != null ? (
                    <>
                      <span className="font-medium text-foreground">{avg.toFixed(1)}★</span>{" "}
                      <span>({restaurant.review_count} reviews)</span>
                    </>
                  ) : (
                    <span>New on AfriTable</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <FavoriteButton restaurantId={restaurant.id} />
              <ShareButton title={restaurant.name} />
            </div>
          </div>

          {/* Quick Info Bar - Sticky with Connect Buttons */}
          <div className="mt-6 rounded-xl border bg-background/95 p-3 sm:p-4 backdrop-blur-sm lg:sticky lg:top-4 lg:z-30 lg:self-start lg:h-fit shadow-sm overflow-visible">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {/* Address with Connect below - Always visible */}
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground mb-1">Address</div>
                <div className="text-sm font-medium break-words">{addrStr || "Address coming soon"}</div>
                {addrStr ? (
                  <a className="text-xs text-primary underline underline-offset-4 mt-1 inline-block py-1 min-h-[32px] flex items-center" href={googleMapsLink(addrStr)} target="_blank" rel="noreferrer">
                    Get directions
                  </a>
                ) : null}
                
                {/* Connect - Under Address */}
                <div className="mt-4">
                  <div className="text-xs text-muted-foreground mb-1">Connect</div>
                  <div className="flex flex-wrap items-center gap-2 min-h-[32px]">
                    {restaurant.website ? (
                      <Button asChild size="sm" variant="outline" className="flex-shrink-0 whitespace-nowrap min-h-[36px]">
                        <a href={restaurant.website} target="_blank" rel="noreferrer">
                          Website
                        </a>
                      </Button>
                    ) : null}
                    {restaurant.instagram_handle ? (
                      <Button asChild size="sm" variant="outline" className="flex-shrink-0 whitespace-nowrap min-h-[36px]">
                        <a href={normalizeInstagramUrl(restaurant.instagram_handle)} target="_blank" rel="noreferrer">
                          Instagram
                        </a>
                      </Button>
                    ) : null}
                    {restaurant.facebook_url ? (
                      <Button asChild size="sm" variant="outline" className="flex-shrink-0 whitespace-nowrap min-h-[36px]">
                        <a href={restaurant.facebook_url} target="_blank" rel="noreferrer">
                          Facebook
                        </a>
                      </Button>
                    ) : null}
                    {!restaurant.website && !restaurant.instagram_handle && !restaurant.facebook_url ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : null}
                  </div>
                </div>
              </div>
              
              {/* Phone - Always visible */}
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground mb-1">Phone</div>
                {restaurant.phone ? (
                  <a className="text-sm font-medium whitespace-nowrap py-1 min-h-[32px] flex items-center" href={`tel:${restaurant.phone}`}>
                    {restaurant.phone}
                  </a>
                ) : (
                  <div className="text-sm font-medium text-muted-foreground py-1 min-h-[32px] flex items-center">—</div>
                )}
              </div>
              
              {/* Hours - Always visible */}
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground mb-1">Hours</div>
                <div className="text-sm font-medium break-words sm:whitespace-nowrap py-1 min-h-[32px] flex items-center">
                  {!todays.hasHours ? (
                    <span className="text-muted-foreground">{todays.label}</span>
                  ) : (
                    <>
                      {todays.openNow ? <span className="text-[oklch(0.35_0.06_145)]">Open now</span> : "Closed"}{" "}
                      <span className="text-muted-foreground">({todays.label})</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="mt-8 grid gap-10 w-full">
            {/* About */}
            <section className="w-full">
              <h2 className="text-xl font-semibold tracking-tight mb-4">About</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p className="text-base leading-relaxed">
                  {restaurant.description ||
                    "A vibrant dining experience celebrating African and Caribbean flavors, hospitality, and culture."}
                </p>
              </div>
            </section>

            <Separator />

            {/* Our Story - Always visible */}
            <section className="w-full">
              <h2 className="text-xl font-semibold tracking-tight mb-4">Our Story</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p className="text-base leading-relaxed whitespace-pre-line">{ourStory}</p>
              </div>
            </section>

            <Separator />

            {/* Cultural Roots - Always visible */}
            <section className="w-full">
              <h2 className="text-xl font-semibold tracking-tight mb-4">Cultural Roots</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p className="text-base leading-relaxed whitespace-pre-line">{culturalRoots}</p>
              </div>
            </section>

            <Separator />

            {/* Special Features - Always visible */}
            <section className="w-full">
              <h2 className="text-xl font-semibold tracking-tight mb-4">Special Features</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p className="text-base leading-relaxed whitespace-pre-line">{specialFeatures}</p>
              </div>
            </section>

            <Separator />

            {/* Menu */}
            <section className="w-full">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Menu</h2>
                  <p className="mt-2 text-muted-foreground">
                    {restaurant.menu && typeof restaurant.menu === "object" && Object.keys(restaurant.menu).length > 0
                      ? "Explore our offerings"
                      : "Menu information coming soon"}
                  </p>
                </div>
                {restaurant.menu?.menu_pdf_url ? (
                  <Button asChild variant="outline">
                    <a href={restaurant.menu.menu_pdf_url} target="_blank" rel="noreferrer">
                      Download full menu (PDF)
                    </a>
                  </Button>
                ) : null}
              </div>

              {restaurant.menu && typeof restaurant.menu === "object" && Object.keys(restaurant.menu).filter((k) => k !== "menu_pdf_url").length > 0 ? (
                <Tabs defaultValue={Object.keys(restaurant.menu).filter((k) => k !== "menu_pdf_url")[0] || "mains"} className="mt-4">
                  <TabsList className="flex-wrap">
                    {Object.keys(restaurant.menu)
                      .filter((k) => k !== "menu_pdf_url")
                      .map((category) => (
                        <TabsTrigger key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </TabsTrigger>
                      ))}
                  </TabsList>
                  {Object.entries(restaurant.menu)
                    .filter(([key]) => key !== "menu_pdf_url")
                    .map(([category, items]: [string, any]) => {
                      const itemList = Array.isArray(items) ? items : [];
                      return (
                        <TabsContent key={category} value={category} className="mt-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            {itemList.length > 0 ? (
                              itemList.map((item: any, idx: number) => {
                                const name = typeof item === "string" ? item : item.name || `Item ${idx + 1}`;
                                const description = typeof item === "object" ? item.description || "" : "";
                                const price = typeof item === "object" ? item.price || "" : "";
                                const tags = typeof item === "object" && Array.isArray(item.tags) ? item.tags : [];
                                return (
                                  <Card key={idx}>
                                    <CardHeader>
                                      <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-base">{name}</CardTitle>
                                        {price ? <Badge variant="secondary">{price}</Badge> : null}
                                      </div>
                                      {description ? <CardDescription>{description}</CardDescription> : null}
                                      {tags.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                          {tags.map((tag: string) => (
                                            <Badge key={tag} variant="outline" className="text-xs">
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      ) : null}
                                    </CardHeader>
                                  </Card>
                                );
                              })
                            ) : (
                              <Card>
                                <CardHeader>
                                  <CardDescription>No items in this category yet.</CardDescription>
                                </CardHeader>
                              </Card>
                            )}
                          </div>
                        </TabsContent>
                      );
                    })}
                </Tabs>
              ) : (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base">Menu coming soon</CardTitle>
                    <CardDescription>We&apos;re working on adding our full menu. Check back soon!</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </section>

            <Separator />

            {/* Reviews */}
            <section className="w-full">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Reviews &amp; Ratings</h2>
                  <p className="mt-2 text-muted-foreground">What diners are saying.</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {avg != null ? (
                    <>
                      <span className="font-medium text-foreground">{avg.toFixed(1)}★</span> •{" "}
                      <span>{restaurant.review_count} reviews</span>
                    </>
                  ) : (
                    "No reviews yet"
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-base">Rating breakdown</CardTitle>
                    <CardDescription>5-star histogram</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = histogram[star - 1] ?? 0;
                      const total = Math.max(1, reviews.length);
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={star} className="grid grid-cols-[32px_1fr_40px] items-center gap-3 text-sm">
                          <span className="text-muted-foreground">{star}★</span>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div className="h-2 bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-right text-muted-foreground">{count}</span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <div className="lg:col-span-2 grid gap-4">
                  {reviews.length ? (
                    reviews.slice(0, 8).map((r: any) => (
                      <Card key={r.id}>
                        <CardHeader>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Verified Diner</Badge>
                              <span className="text-sm font-medium">Diner</span>
                              <span className="text-sm text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</span>
                            </div>
                            <span className="text-sm font-medium">{Number(r.overall_rating).toFixed(1)}★</span>
                          </div>
                          {r.review_text ? <CardDescription>{r.review_text}</CardDescription> : null}
                        </CardHeader>
                        {r.restaurant_response ? (
                          <CardContent className="text-sm">
                            <div className="rounded-lg border bg-muted/30 p-3">
                              <div className="text-xs font-medium text-muted-foreground">Restaurant response</div>
                              <div className="mt-1">{r.restaurant_response}</div>
                            </div>
                          </CardContent>
                        ) : null}
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Be the first to review</CardTitle>
                        <CardDescription>After dining, leave a rating and help others discover this spot.</CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                </div>
              </div>
            </section>

            <Separator />

            {/* Location & Details */}
            <section className="w-full">
              <h2 className="text-xl font-semibold tracking-tight mb-4">Location &amp; Details</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Map</CardTitle>
                    <CardDescription>{addrStr || "Address coming soon"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {addrStr ? (
                      <div className="aspect-[16/10] overflow-hidden rounded-lg border">
                        <iframe
                          title="Google Map"
                          className="h-full w-full"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://www.google.com/maps?q=${encodeURIComponent(addrStr)}&output=embed`}
                        />
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">Map will appear once address is set.</div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contact & Details</CardTitle>
                    <CardDescription>Get in touch and plan your visit</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 text-sm">
                    {restaurant.phone ? (
                      <div>
                        <span className="font-medium text-foreground">Phone:</span>{" "}
                        <a href={`tel:${restaurant.phone}`} className="text-primary hover:underline">
                          {restaurant.phone}
                        </a>
                      </div>
                    ) : null}
                    {restaurant.website ? (
                      <div>
                        <span className="font-medium text-foreground">Website:</span>{" "}
                        <a href={restaurant.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          Visit website
                        </a>
                      </div>
                    ) : null}
                    {addrStr ? (
                      <>
                        <div>
                          <span className="font-medium text-foreground">Address:</span>
                          <div className="mt-1 text-muted-foreground">{addrStr}</div>
                        </div>
                        <div>
                          <a className="text-primary underline underline-offset-4" href={googleMapsLink(addrStr)} target="_blank" rel="noreferrer">
                            Get directions on Google Maps →
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">Address information coming soon.</div>
                    )}
                    {operatingHours && operatingHours.length > 0 ? (
                      <div>
                        <span className="font-medium text-foreground">Hours:</span>
                        <div className="mt-2 space-y-1 text-muted-foreground">
                          {[
                            ["Sunday", 0],
                            ["Monday", 1],
                            ["Tuesday", 2],
                            ["Wednesday", 3],
                            ["Thursday", 4],
                            ["Friday", 5],
                            ["Saturday", 6],
                          ].map(([day, dow]) => {
                            const hour = operatingHours.find((h: any) => h.day_of_week === dow);
                            return (
                              <div key={day} className="flex justify-between">
                                <span>{day}:</span>
                                <span>{hour ? `${hour.open_time} - ${hour.close_time}` : "Closed"}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        </div>

        {/* Right Column - Reservation Widget (Sticky on desktop, normal flow on mobile) */}
        <div className="lg:col-span-4 lg:pl-8 w-full lg:sticky lg:top-4 lg:z-40 lg:self-start lg:h-fit">
          <ReservationWidget restaurantId={restaurant.id} restaurantSlug={restaurant.slug} />
        </div>
      </div>

      {/* You might also like - Full width, below main grid */}
      <section className="mt-10 w-full overflow-hidden">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">You might also like</h2>
            <p className="mt-2 text-muted-foreground">Similar cuisine picks, curated for you.</p>
          </div>
          <Button asChild variant="outline" className="flex-shrink-0">
            <Link href="/restaurants">Browse all</Link>
          </Button>
        </div>
        <div className="relative w-full overflow-hidden">
          <div className="flex gap-4 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(similar.length ? similar : []).map((r: any) => (
              <div key={r.id} className="w-[280px] shrink-0 snap-start md:w-[300px]">
                <RestaurantCard restaurant={r} href={`/restaurants/${encodeURIComponent(r.slug)}`} />
              </div>
            ))}
            {!similar.length ? (
              <Card className="w-full shrink-0">
                <CardHeader>
                  <CardTitle className="text-base">More recommendations coming soon</CardTitle>
                  <CardDescription>As we onboard more restaurants, we&apos;ll show great matches here.</CardDescription>
                </CardHeader>
              </Card>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

