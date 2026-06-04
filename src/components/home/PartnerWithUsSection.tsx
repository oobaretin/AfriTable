"use client";

import Link from "next/link";
import { mailto, SITE_CONTACT } from "@/lib/site-contact";

const pillars = [
  {
    title: "Nationwide discovery",
    body: "Your kitchen appears alongside vetted peers in a directory built for diaspora diners—not buried in generic search.",
  },
  {
    title: "Reservations that fit you",
    body: "Table capacity, party size, and service style tuned for how African & Caribbean restaurants actually operate.",
  },
  {
    title: "Owner dashboard",
    body: "Once approved, manage today’s bookings, your listing, reviews, and analytics from a single owner workspace.",
  },
] as const;

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

export function PartnerWithUsSection() {
  return (
    <section
      className="relative mx-4 my-20 overflow-hidden rounded-[3rem] bg-brand-dark px-6 py-20 md:py-24"
      aria-labelledby="partner-with-afritable-heading"
    >
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-brand-ochre/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-brand-forest/15 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-ochre/90">
              For restaurants &amp; pop-ups
            </p>
            <h2
              id="partner-with-afritable-heading"
              className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl"
            >
              Partner with{" "}
              <span className="text-brand-forest">AfriTable</span>
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-400 md:text-lg">
              List on the platform built for African and Caribbean dining in the United States. We focus on accurate
              menus, fair discovery, and tools owners can rely on—without placeholder testimonials or made-up metrics.
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

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
              <Link
                href="/submit-restaurant"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-center text-sm font-bold uppercase tracking-widest text-white transition hover:bg-white/10"
              >
                Suggest a listing
              </Link>
            </div>
            <p className="mt-6 text-xs text-slate-500">
              Already approved or have an invite link? Use create owner account above. Questions?{" "}
              <a href={mailto(SITE_CONTACT.partnerships)} className="font-semibold text-slate-300 underline-offset-4 hover:underline">
                Email partnerships
              </a>
              .
            </p>
          </div>

          <ul className="grid gap-4">
            {pillars.map((item) => (
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

        <div className="mt-16 border-t border-white/10 pt-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-ochre/90">Owner dashboard tools</p>
          <h3 className="mt-3 text-2xl font-black text-white md:text-3xl">What you get after onboarding</h3>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ownerTools.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition hover:border-brand-ochre/25"
              >
                <h4 className="text-base font-bold text-white">{item.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
