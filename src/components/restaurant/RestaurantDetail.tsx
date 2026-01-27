"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PhotoGallery } from "@/components/restaurant/PhotoGallery";
import { MapPin, Phone, Globe, Instagram, Facebook, Clock } from "lucide-react";

/**
 * Type definition matching the restaurants.json structure
 */
export type RestaurantDetailData = {
  id: string;
  name: string;
  cuisine: string;
  region: string;
  price_range: string;
  rating: number;
  address: string;
  phone: string;
  website?: string;
  social?: {
    instagram?: string;
    facebook?: string;
  };
  hours: Record<string, string>;
  about: string;
  our_story: string;
  cultural_roots: string;
  menu_highlights?: string[];
  images?: string[];
};

/**
 * Generates a Google Maps link from an address string
 */
function googleMapsLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/**
 * Normalizes Instagram handle/URL to a full Instagram URL
 */
function normalizeInstagramUrl(handleOrUrl: string | undefined): string {
  if (!handleOrUrl) return "#";
  if (handleOrUrl.startsWith("http://") || handleOrUrl.startsWith("https://")) {
    return handleOrUrl;
  }
  const cleanHandle = handleOrUrl.replace(/^@/, "").replace(/^instagram\.com\//, "").replace(/\/$/, "");
  return `https://www.instagram.com/${cleanHandle}/`;
}

/**
 * Formats hours object into a readable string
 */
function formatHours(hours: Record<string, string>): string {
  const entries = Object.entries(hours);
  if (entries.length === 0) return "Hours not available";
  
  return entries
    .map(([days, time]) => {
      const dayLabel = days
        .split("_")
        .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
        .join(" - ");
      return `${dayLabel}: ${time}`;
    })
    .join(" • ");
}

interface RestaurantDetailProps {
  restaurant: RestaurantDetailData;
}

/**
 * Restaurant Detail Component
 * 
 * Displays a comprehensive restaurant detail page with:
 * - Header with photo gallery
 * - Our Story section
 * - Cultural Roots section
 * - Sidebar with Contact & Details including Google Maps link
 */
export function RestaurantDetail({ restaurant }: RestaurantDetailProps) {
  const {
    name,
    cuisine,
    region,
    price_range,
    rating,
    address,
    phone,
    website,
    social,
    hours,
    about,
    our_story,
    cultural_roots,
    menu_highlights,
    images,
  } = restaurant;

  return (
    <div className="w-full">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* Main Content Column */}
        <div className="lg:col-span-8 w-full">
          {/* Photo Gallery Header */}
          <PhotoGallery name={name} images={images} />

          {/* Restaurant Header */}
          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between w-full">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{price_range}</Badge>
                <Badge variant="outline">{cuisine}</Badge>
                <Badge variant="outline">{region}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{address}</span>
                <span>•</span>
                <span className="font-medium text-foreground">
                  {rating.toFixed(1)}★
                </span>
              </div>
            </div>
          </div>

          {/* About Section */}
          {about && (
            <section className="mt-8 w-full">
              <h2 className="text-xl font-semibold tracking-tight mb-4">About</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p className="text-base leading-relaxed whitespace-pre-line">{about}</p>
              </div>
            </section>
          )}

          <Separator className="my-8" />

          {/* Our Story Section */}
          {our_story && (
            <section className="w-full">
              <h2 className="text-xl font-semibold tracking-tight mb-4">Our Story</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p className="text-base leading-relaxed whitespace-pre-line">{our_story}</p>
              </div>
            </section>
          )}

          <Separator className="my-8" />

          {/* Cultural Roots Section */}
          {cultural_roots && (
            <section className="w-full">
              <h2 className="text-xl font-semibold tracking-tight mb-4">Cultural Roots</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p className="text-base leading-relaxed whitespace-pre-line">{cultural_roots}</p>
              </div>
            </section>
          )}

          {/* Menu Highlights */}
          {menu_highlights && menu_highlights.length > 0 && (
            <>
              <Separator className="my-8" />
              <section className="w-full">
                <h2 className="text-xl font-semibold tracking-tight mb-4">Menu Highlights</h2>
                <div className="flex flex-wrap gap-2">
                  {menu_highlights.map((item, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {item}
                    </Badge>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Sidebar - Contact & Details */}
        <div className="lg:col-span-4 lg:sticky lg:top-4 lg:self-start">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Contact & Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Address with Google Maps Link */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">Address</div>
                    <div className="text-sm font-medium break-words">{address}</div>
                    <a
                      href={googleMapsLink(address)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline underline-offset-4 mt-2 inline-block hover:text-primary/80"
                    >
                      Get directions on Google Maps →
                    </a>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Phone */}
              {phone && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-1">Phone</div>
                      <a
                        href={`tel:${phone}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {phone}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Hours */}
              {hours && Object.keys(hours).length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground mb-1">Hours</div>
                        <div className="text-sm font-medium whitespace-pre-line">
                          {formatHours(hours)}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Website & Social Links */}
              {(website || social?.instagram || social?.facebook) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground mb-2">Connect</div>
                    <div className="flex flex-wrap gap-2">
                      {website && (
                        <Button asChild size="sm" variant="outline" className="flex-shrink-0">
                          <a href={website} target="_blank" rel="noreferrer">
                            <Globe className="h-4 w-4 mr-2" />
                            Website
                          </a>
                        </Button>
                      )}
                      {social?.instagram && (
                        <Button asChild size="sm" variant="outline" className="flex-shrink-0">
                          <a href={normalizeInstagramUrl(social.instagram)} target="_blank" rel="noreferrer">
                            <Instagram className="h-4 w-4 mr-2" />
                            Instagram
                          </a>
                        </Button>
                      )}
                      {social?.facebook && (
                        <Button asChild size="sm" variant="outline" className="flex-shrink-0">
                          <a
                            href={social.facebook.startsWith("http") ? social.facebook : `https://www.facebook.com/${social.facebook}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Facebook className="h-4 w-4 mr-2" />
                            Facebook
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
