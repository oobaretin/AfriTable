"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ShareStamp } from "@/components/dashboard/ShareStamp";
import { Skeleton } from "@/components/ui/skeleton";

export function CommunityFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ["community-stamps"],
    queryFn: async () => {
      const res = await fetch("/api/stamps?limit=6");
      if (!res.ok) throw new Error("Failed to fetch stamps");
      return res.json() as Promise<{ stamps: any[] }>;
    },
  });

  const stamps = data?.stamps || [];

  if (isLoading) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-brand-dark mb-8 text-center">Community Feed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[400px] rounded-[2.5rem]" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (stamps.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-6 bg-brand-paper">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-brand-dark mb-2">Community Feed</h2>
          <p className="text-slate-600">See what our diners are sharing from their culinary journeys</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stamps.map((stamp) => (
            <ShareStamp
              key={stamp.id}
              restaurant={{
                name: stamp.restaurant?.name || "Restaurant",
                cuisine: stamp.restaurant?.cuisine || "",
                city: stamp.restaurant?.city || "",
                rating: stamp.restaurant?.rating || undefined,
                slug: stamp.restaurant?.slug || undefined,
              }}
              mealImage={stamp.photoUrl}
              reviewText={stamp.reviewText || undefined}
              userName={stamp.userName}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
