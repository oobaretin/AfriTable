"use client";

import * as React from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type Ambassador = {
  id: string;
  name: string;
  stamps: number;
  rank: "Gold" | "Silver" | "Bronze";
  city: string | null;
  avatar_url: string | null;
};

type LeaderboardResp = {
  ambassadors: Ambassador[];
};

export function Leaderboard() {
  const { data, isLoading, error } = useQuery<LeaderboardResp>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load leaderboard");
      return data as LeaderboardResp;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
  });

  const ambassadors = data?.ambassadors || [];

  if (error) {
    return null; // Fail silently - leaderboard is not critical
  }

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-xs font-black text-brand-bronze uppercase tracking-[0.4em] mb-4">Community Excellence</h2>
          <h3 className="text-5xl font-black text-brand-dark tracking-tighter uppercase mb-6">
            Ambassador&apos;s <span className="text-brand-ochre">Circle</span>
          </h3>
          <p className="text-slate-500 max-w-xl mx-auto italic">
            Celebrating the diners who journey furthest to support the diaspora&apos;s culinary artists.
          </p>
        </div>

        <div className="bg-brand-paper rounded-[3rem] p-2 shadow-sm border border-brand-bronze/5">
          <div className="bg-white rounded-[2.8rem] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-4 px-8 py-6 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <div className="col-span-2">Diner</div>
              <div className="text-center">Stamps</div>
              <div className="text-right">Ranking</div>
            </div>

            {/* List Members */}
            {isLoading ? (
              <div className="divide-y divide-slate-50">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-4 px-8 py-6 items-center">
                    <div className="col-span-2 flex items-center gap-4">
                      <Skeleton className="w-4 h-4" />
                      <Skeleton className="h-12 w-12 rounded-2xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="text-center">
                      <Skeleton className="h-6 w-12 mx-auto rounded-full" />
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : ambassadors.length === 0 ? (
              <div className="px-8 py-12 text-center text-slate-400">
                <p className="text-sm italic">No ambassadors yet. Be the first to explore!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {ambassadors.map((person, i) => (
                  <div
                    key={person.id}
                    className="grid grid-cols-4 px-8 py-6 items-center hover:bg-brand-paper/30 transition-colors group"
                  >
                    <div className="col-span-2 flex items-center gap-4">
                      <span className="text-xs font-black text-brand-bronze opacity-50 w-4">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="relative">
                        {person.avatar_url ? (
                          <Image
                            src={person.avatar_url}
                            alt={person.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all shadow-md"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-2xl bg-brand-bronze/20 flex items-center justify-center text-xl font-black text-brand-bronze grayscale group-hover:grayscale-0 transition-all shadow-md">
                            {person.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {i === 0 && (
                          <span className="absolute -top-2 -right-2 text-lg" role="img" aria-label="Crown">
                            👑
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-black text-brand-dark uppercase text-sm tracking-tight">{person.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          {person.city || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="inline-block px-3 py-1 bg-brand-paper rounded-full font-black text-brand-dark text-sm border border-brand-bronze/10">
                        {person.stamps}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${
                          person.rank === "Gold"
                            ? "text-brand-ochre"
                            : person.rank === "Silver"
                              ? "text-slate-500"
                              : "text-brand-bronze"
                        }`}
                      >
                        {person.rank} Level
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 text-center">
          <button className="text-xs font-black text-brand-bronze uppercase tracking-widest border-b-2 border-brand-bronze pb-1 hover:text-brand-dark hover:border-brand-dark transition-all">
            How to climb the ranks
          </button>
        </div>
      </div>
    </section>
  );
}
