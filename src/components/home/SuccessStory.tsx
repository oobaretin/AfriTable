"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { PLACEHOLDERS } from "@/lib/placeholders";

/** Matches the story quote (“35%”) and a believable diner score for this illustrative block. */
const ILLUSTRATIVE_BOOKING_GROWTH = 35;
const ILLUSTRATIVE_RATING = 4.9;

export function SuccessStory() {
  return (
    <section className="py-24 px-6 bg-brand-dark overflow-hidden rounded-[3rem] mx-4 my-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Visual Side */}
          <div className="relative flex-1">
            <div className="absolute -top-6 -left-6 w-32 h-32 border-t-4 border-l-4 border-brand-ochre rounded-tl-[3rem] opacity-50" />
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl rotate-2 transition-transform hover:rotate-0 duration-500">
              <div className="relative w-full aspect-[600/700]">
                <Image
                  src={PLACEHOLDERS.large}
                  alt="Illustrative photograph representing a restaurant partner (not a specific person)."
                  fill
                  className="object-cover scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ochre/90 mb-1">
                    Illustrative partner story
                  </p>
                  <p className="text-white font-black text-2xl tracking-tighter uppercase">Chef Amara</p>
                  <p className="text-brand-ochre font-bold text-sm uppercase tracking-widest">
                    The Jollof Collective • Houston, TX
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Text Side */}
          <div className="flex-1">
            <p className="text-xs text-slate-500 leading-relaxed mb-4 max-w-xl">
              This section is a <span className="text-slate-300 font-semibold">composite marketing example</span>{" "}
              showing the kind of outcomes partners aim for. It is not a verified testimonial or live metric feed.
            </p>
            <div className="mb-8">
              <span className="text-brand-ochre text-6xl font-serif">&quot;</span>
              <h3 className="text-3xl md:text-4xl font-black text-white leading-tight mb-6">
                AfriTable didn&apos;t just give us a booking system; they gave us a{" "}
                <span className="text-brand-forest">community</span> that actually understands our culture.
              </h3>
              <p className="text-lg text-slate-400 leading-relaxed mb-8">
                &quot;Before joining the AfriTable pilot, we struggled to find a platform that respected the nuance of our
                service. Their team understood that African dining is about more than just a table—it&apos;s an
                experience. In just three months, our weekend bookings increased by 35%.&quot;
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8 mb-10">
              <div>
                <p className="text-3xl font-black text-white">+{ILLUSTRATIVE_BOOKING_GROWTH}%</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Booking growth (example)</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">{ILLUSTRATIVE_RATING}/5</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Diner rating (example)</p>
              </div>
            </div>

            <Link
              href="/join-as-restaurant"
              className="inline-block btn-bronze px-10 py-4 rounded-2xl text-white font-bold tracking-widest uppercase text-sm shadow-xl shadow-brand-ochre/5 hover:shadow-brand-ochre/10 transition-shadow"
            >
              Partner with us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
