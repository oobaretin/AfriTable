"use client";

import * as React from "react";
import { RestaurantResults } from "./RestaurantResults";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";

type RestaurantWithDistance = {
  restaurant: JSONRestaurant;
  distance: number | null;
};

type HomepageRestaurantSimpleProps = {
  restaurants: JSONRestaurant[];
};

function extractStateFromAddress(address: string | undefined): string | null {
  if (!address || typeof address !== "string") return null;
  const m = address.match(/,\s*([A-Z]{2})\s+\d{5}/);
  return m ? m[1] : null;
}

/**
 * Homepage spotlight: favor geographic spread so the hero reflects a nationwide directory,
 * not only one metro or only $$$ venues.
 */
export function HomepageRestaurantSimple({ restaurants }: HomepageRestaurantSimpleProps) {
  const spotlight: RestaurantWithDistance[] = React.useMemo(() => {
    if (!restaurants.length) return [];

    const sorted = [...restaurants].sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const out: JSONRestaurant[] = [];
    const usedStates = new Set<string>();
    const usedIds = new Set<string>();

    for (const r of sorted) {
      if (out.length >= 6) break;
      const st = extractStateFromAddress(r.address);
      if (st && !usedStates.has(st)) {
        usedStates.add(st);
        usedIds.add(r.id);
        out.push(r);
      }
    }

    for (const r of sorted) {
      if (out.length >= 6) break;
      if (usedIds.has(r.id)) continue;
      out.push(r);
      usedIds.add(r.id);
    }

    return out.slice(0, 6).map((r) => ({ restaurant: r, distance: null }));
  }, [restaurants]);

  return <RestaurantResults restaurants={spotlight} />;
}
