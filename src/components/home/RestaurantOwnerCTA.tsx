"use client";

import Link from "next/link";
import { mailto, SITE_CONTACT } from "@/lib/site-contact";

const ownerTools = [
  {
    title: "Reservations",
    body: "See today’s bookings, party sizes, and guest notes in one dashboard—built for how your floor actually runs.",
  },
  {
    title: "Reviews",
    body: "Track diner feedback and keep your listing credible as your reputation grows on AfriTable.",
  },
  {
    title: "Analytics",
    body: "Understand booking patterns over time so you can staff and plan service with confidence.",
  },
  {
    title: "Your listing",
    body: "Update hours, photos, and menu details so diaspora diners find accurate information before they arrive.",
  },
] as const;

export function RestaurantOwnerCTA() {
  return (
    <section
      className="relative overflow-hidden rounded-3xl bg-brand-dark py-20 px-8"
      aria-labelledby="owner-tools-heading"
    >
      <div className="pointer-events-none absolute top-0 right-0 h-72 w-72 -translate-y-1/2 translate-x-1/4 rounded-full bg-brand-ochre/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 translate-y-1/2 -translate-x-1/4 rounded-full bg-brand-forest/15 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-ochre/90">For restaurant owners</p>
            <h2
              id="owner-tools-heading"
              className="mt-4 text-3xl font-black leading-tight tracking-tight text-white md:text-4xl lg:text-5xl"
            >
              Tools to run your{" "}
              <span className="text-brand-forest">AfriTable</span> listing
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400 md:text-lg">
              Once your restaurant is onboarded, you get a dedicated owner dashboard—not a generic listing page.
              Manage reservations, keep your profile accurate, and grow with a platform built for African and
              Caribbean dining in the United States.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "Live reservation view for today’s service",
                "Listing controls for hours, photos, and details",
                "Review and analytics pages as you scale",
                "Human onboarding—we review every partner application",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-ochre/20 text-brand-ochre">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/join-as-restaurant"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-brand-ochre to-amber-600 px-8 py-4 text-center text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-brand-ochre/20 transition hover:shadow-brand-ochre/30"
              >
                Apply to partner
              </Link>
              <Link
                href="/restaurant-signup"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-center text-sm font-bold uppercase tracking-widest text-white transition hover:bg-white/10"
              >
                Create owner account
              </Link>
            </div>
            <p className="mt-6 text-xs text-slate-500">
              Know a spot we should add?{" "}
              <Link href="/submit-restaurant" className="font-semibold text-slate-300 underline-offset-4 hover:underline">
                Suggest a listing
              </Link>
              . Questions?{" "}
              <a href={mailto(SITE_CONTACT.partnerships)} className="font-semibold text-slate-300 underline-offset-4 hover:underline">
                Email partnerships
              </a>
              .
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ownerTools.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition hover:border-brand-ochre/25"
              >
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
