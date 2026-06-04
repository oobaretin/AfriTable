"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
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

function publicDinerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? "Diner";
  const first = parts[0];
  const lastInitial = parts[parts.length - 1]?.[0]?.toUpperCase();
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

function HowRanksWork() {
  return (
    <details className="group mx-auto mt-6 max-w-lg text-left">
      <summary className="cursor-pointer list-none text-center text-xs font-bold uppercase tracking-widest text-brand-bronze underline-offset-4 marker:content-none hover:text-brand-dark [&::-webkit-details-marker]:hidden">
        <span className="border-b-2 border-brand-bronze pb-1 group-open:border-brand-dark group-open:text-brand-dark">
          How to climb the ranks
        </span>
      </summary>
      <div className="mt-4 rounded-2xl border border-brand-bronze/10 bg-white/80 px-5 py-4 text-sm leading-relaxed text-slate-600">
        <ol className="list-decimal space-y-2 pl-4">
          <li>Sign in and book at AfriTable restaurants.</li>
          <li>Each unique spot you dine at adds a stamp to your culinary passport.</li>
          <li>Completed visits count toward Bronze (1+), Silver (10+), and Gold (20+) levels.</li>
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          Rankings update from real completed visits—not manual entries or paid placement.
        </p>
      </div>
    </details>
  );
}

function LeaderboardCompact({
  title = "Be the first on the board",
  description = "Dine at diaspora restaurants, collect passport stamps, and claim the top spot as the community grows.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-3xl border border-brand-bronze/10 bg-gradient-to-br from-brand-paper/80 to-white px-6 py-8 text-center shadow-sm md:px-10">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-bronze">Ambassador&apos;s Circle</p>
      <h3 className="mt-3 text-2xl font-black tracking-tight text-brand-dark md:text-3xl">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">{description}</p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/login?redirectTo=/passport"
          className="inline-flex items-center justify-center rounded-2xl bg-brand-dark px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-brand-dark/90"
        >
          Sign in to start your passport
        </Link>
        <Link
          href="/restaurants"
          className="inline-flex items-center justify-center rounded-2xl border border-brand-bronze/20 bg-white px-6 py-3 text-sm font-bold uppercase tracking-wider text-brand-bronze transition hover:border-brand-bronze/40"
        >
          Browse restaurants
        </Link>
      </div>
      <HowRanksWork />
    </div>
  );
}

function LeaderboardLoading() {
  return (
    <section className="bg-white px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Skeleton className="mx-auto h-4 w-40" />
        <Skeleton className="mx-auto mt-4 h-8 w-64" />
        <Skeleton className="mt-8 h-48 w-full rounded-3xl" />
      </div>
    </section>
  );
}

export function Leaderboard() {
  const { data, isLoading, error } = useQuery<LeaderboardResp>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load leaderboard");
      return data as LeaderboardResp;
    },
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const ambassadors = data?.ambassadors ?? [];
  const hasAmbassadors = ambassadors.length > 0;

  if (isLoading) {
    return <LeaderboardLoading />;
  }

  if (error || !hasAmbassadors) {
    return (
      <section className="bg-white px-6 py-12" aria-labelledby="ambassadors-circle-heading">
        <div className="mx-auto max-w-3xl">
          <LeaderboardCompact
            title={error ? "Leaderboard loading soon" : "Be the first on the board"}
            description={
              error
                ? "We couldn't load rankings right now. You can still sign in, collect passport stamps, and browse restaurants."
                : "Dine at diaspora restaurants, collect passport stamps, and claim the top spot as the community grows."
            }
          />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white px-6 py-16 md:py-20" aria-labelledby="ambassadors-circle-heading">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center md:mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-bronze">Community</p>
          <h2
            id="ambassadors-circle-heading"
            className="mt-3 text-3xl font-black tracking-tight text-brand-dark md:text-4xl"
          >
            Ambassador&apos;s <span className="text-brand-ochre">Circle</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 md:text-base">
            Top diners by unique restaurants visited—celebrating people who show up for diaspora kitchens.
          </p>
        </div>

        <div className="rounded-[2rem] border border-brand-bronze/10 bg-brand-paper/40 p-1.5 shadow-sm">
          <div className="overflow-hidden rounded-[1.75rem] bg-white">
            <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 md:px-8">
              <div className="col-span-2">Diner</div>
              <div className="text-center">Stamps</div>
              <div className="text-right">Level</div>
            </div>

            <div className="divide-y divide-slate-50">
              {ambassadors.map((person, i) => (
                <div
                  key={person.id}
                  className="group grid grid-cols-4 items-center px-6 py-5 transition-colors hover:bg-brand-paper/30 md:px-8"
                >
                  <div className="col-span-2 flex items-center gap-3 md:gap-4">
                    <span className="w-4 text-xs font-bold text-brand-bronze/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="relative shrink-0">
                      {person.avatar_url ? (
                        <Image
                          src={person.avatar_url}
                          alt=""
                          width={48}
                          height={48}
                          className="h-11 w-11 rounded-2xl object-cover grayscale transition-all group-hover:grayscale-0 md:h-12 md:w-12"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-bronze/15 text-lg font-black text-brand-bronze md:h-12 md:w-12">
                          {person.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {i === 0 ? (
                        <span className="absolute -right-1 -top-1 text-base" role="img" aria-label="First place">
                          👑
                        </span>
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-brand-dark">
                        {publicDinerName(person.name)}
                      </p>
                      {person.city ? (
                        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-400">
                          {person.city}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="inline-block rounded-full border border-brand-bronze/10 bg-brand-paper px-3 py-1 text-sm font-bold text-brand-dark">
                      {person.stamps}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest ${
                        person.rank === "Gold"
                          ? "text-brand-ochre"
                          : person.rank === "Silver"
                            ? "text-slate-500"
                            : "text-brand-bronze"
                      }`}
                    >
                      {person.rank}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login?redirectTo=/passport"
            className="text-sm font-bold uppercase tracking-widest text-brand-bronze underline-offset-4 hover:text-brand-dark hover:underline"
          >
            View your passport →
          </Link>
        </div>
        <HowRanksWork />
      </div>
    </section>
  );
}
