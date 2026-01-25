"use client";

import * as React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@db/database.types";

export type RestaurantRow = Database["public"]["Tables"]["restaurants"]["Row"] & {
  // optional denormalized fields for UI
  distance_miles?: number | null;
  avg_rating?: number | null;
  review_count?: number | null;
};

function priceLabel(priceRange: number) {
  return "$".repeat(Math.max(1, Math.min(4, priceRange)));
}

export function RestaurantCard({
  restaurant,
  href,
  onQuickReserve,
}: {
  restaurant: RestaurantRow;
  href?: string;
  onQuickReserve?: () => void;
}) {
  const [fav, setFav] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setFav(false);
        return;
      }
      const { data: existing } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("restaurant_id", restaurant.id)
        .maybeSingle();
      setFav(Boolean(existing?.id));
    })();
  }, [restaurant.id]);

  async function toggleFavorite() {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      toast.error("Please sign in to save favorites");
      return;
    }
    try {
      if (fav) {
        const res = await fetch(`/api/favorites/${restaurant.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        setFav(false);
        toast.success("Removed from favorites");
      } else {
        const res = await fetch(`/api/favorites`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ restaurantId: restaurant.id }),
        });
        if (!res.ok) throw new Error();
        setFav(true);
        toast.success("Saved to favorites");
      }
    } catch {
      toast.error("Could not update favorite");
    }
  }
  const city = (restaurant.address as any)?.city as string | undefined;
  const state = (restaurant.address as any)?.state as string | undefined;
  const location = [city, state].filter(Boolean).join(", ");

  const cuisines = (restaurant.cuisine_types ?? []).slice(0, 3);
  const rating = restaurant.avg_rating ?? null;
  const reviewCount = restaurant.review_count ?? null;
  const distance = restaurant.distance_miles ?? null;

  const content = (
    <Card className="h-full overflow-hidden">
      <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-[oklch(0.94_0.05_80)] via-[oklch(0.98_0_0)] to-[oklch(0.92_0.05_145)]">
        {/* placeholder image block */}
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,oklch(0.78_0.18_55),transparent_55%),radial-gradient(circle_at_80%_30%,oklch(0.35_0.06_145),transparent_55%)]" />
        <button
          type="button"
          aria-label="Save"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void toggleFavorite();
          }}
          className="absolute right-3 top-3 rounded-full border bg-background/80 p-2 backdrop-blur"
        >
          <Heart className={fav ? "fill-primary text-primary" : "text-foreground"} size={16} />
        </button>
      </div>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 text-base">{restaurant.name}</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            {priceLabel(restaurant.price_range)}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cuisines.map((c) => (
            <Badge key={c} variant="outline" className="text-xs">
              {c}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="line-clamp-1">{location || "United States"}</span>
        <span className="flex items-center gap-2">
          {rating != null ? (
            <span>
              {rating.toFixed(1)}★{reviewCount != null ? <span className="opacity-70"> ({reviewCount})</span> : null}
            </span>
          ) : (
            <span>New</span>
          )}
          {distance != null ? <span>{distance.toFixed(1)} mi</span> : null}
        </span>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="w-full" onClick={onQuickReserve} type="button">
          Quick Reserve
        </Button>
      </CardFooter>
    </Card>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
}

