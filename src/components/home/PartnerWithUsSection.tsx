"use client";

import Link from "next/link";

const pillars = [
  {
    title: "Nationwide discovery",
    body: "Your kitchen appears alongside vetted peers in a directory built for diaspora diners—not buried in generic search.",
  },
  {
    title: "Reservations that fit you",
    body: "Table capacity, party size, and service style tuned for how African & Caribbean restaurants actually operate.",
  },
] as const;

export function PartnerWithUsSection() {
  return (
    <section
      className="relative py-20 px-6 md:py-24 bg-brand-dark overflow-hidden rounded-[3rem] mx-4 my-20"
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

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/join-as-restaurant"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-brand-ochre to-amber-600 px-8 py-4 text-center text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-brand-ochre/20 transition hover:shadow-brand-ochre/30"
              >
                Join as a partner
              </Link>
              <Link
                href="/submit-restaurant"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-center text-sm font-bold uppercase tracking-widest text-white transition hover:bg-white/10"
              >
                Suggest a listing
              </Link>
            </div>
            <p className="mt-6 text-xs text-slate-500">
              Already on the map?{" "}
              <a href="mailto:therealtasteofafrica@gmail.com" className="font-semibold text-slate-300 underline-offset-4 hover:underline">
                Contact the team
              </a>{" "}
              for onboarding or press.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-1">
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
      </div>
    </section>
  );
}
