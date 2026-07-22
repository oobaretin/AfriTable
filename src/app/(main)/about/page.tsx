import Image from "next/image";
import { AboutContactCta } from "@/components/about/AboutContactCta";
import { MetroUpdatesSignup } from "@/components/about/MetroUpdatesSignup";
import { MeetTheFounderSection } from "@/components/home/MeetTheFounderSection";
import { getCatalogStats } from "@/lib/catalog-stats";
import { loadRestaurantsFromJSON } from "@/lib/restaurant-json-loader-server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn why AfriTable exists—to put African and Caribbean dining at the center of discovery and reservation nationwide.",
};

export default function AboutPage() {
  const { restaurantCount, metroCount } = getCatalogStats(loadRestaurantsFromJSON());

  return (
    <div className="bg-white">
      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-black tracking-tight text-slate-900 md:text-6xl">
            Our mission is to put <span className="text-orange-600">Culture</span> back at the center of the table.
          </h1>
          <p className="text-xl leading-relaxed text-slate-600">
            AfriTable was born from a simple observation: African and Caribbean culinary excellence is world-class,
            but the platforms to discover it were missing.
          </p>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 md:grid-cols-2">
          <div className="rotate-2 overflow-hidden rounded-3xl shadow-2xl transition-transform duration-500 hover:rotate-0">
            <Image
              src="/images/about-community-dining.png"
              alt="Four guests sharing a meal in a warm Jamaican and African themed dining room—jerk chicken, rice and peas, plantains, stews, and island sodas on the table—the kind of night out AfriTable helps people discover and reserve."
              width={1024}
              height={558}
              className="aspect-[1024/558] w-full object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div>
            <h2 className="mb-6 text-3xl font-bold text-slate-900">More Than Just a Reservation</h2>
            <p className="mb-6 text-lg leading-relaxed text-slate-600">
              We started AfriTable because we were tired of &quot;hidden gems&quot; remaining hidden. We saw brilliant
              chefs, vibrant flavors, and generations of tradition being overlooked by mainstream booking apps.
            </p>
            <p className="mb-8 text-lg leading-relaxed text-slate-600">
              AfriTable isn&apos;t just a software company. We are a digital home for the diaspora. We are the bridge
              between the diner craving the smoky jollof of Lagos or the jerk chicken of Kingston, and the hardworking
              restaurant owners who cook them.
            </p>

            <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-8">
              <div>
                <h4 className="text-3xl font-black text-orange-600">{metroCount}+</h4>
                <p className="text-sm font-bold uppercase text-slate-500">Metros in our directory</p>
              </div>
              <div>
                <h4 className="text-3xl font-black text-orange-600">{restaurantCount}+</h4>
                <p className="text-sm font-bold uppercase text-slate-500">Vetted listings</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">Counts reflect our live catalog and grow as we onboard partners.</p>
          </div>
        </div>
      </section>

      <section className="mx-4 mb-20 rounded-[40px] bg-slate-900 px-6 py-24 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-black">Our Values</h2>
            <div className="mx-auto h-1 w-20 bg-orange-600" />
          </div>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <div className="mb-4 text-4xl">🥘</div>
              <h3 className="mb-3 text-xl font-bold">Authenticity First</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                We don&apos;t do &quot;fusion&quot; for the sake of trends. we celebrate the raw, real, and ancestral
                flavors that define our regions.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <div className="mb-4 text-4xl">🤝</div>
              <h3 className="mb-3 text-xl font-bold">Community Growth</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                When a restaurant joins AfriTable, they aren&apos;t just a client—they are a partner. We invest in
                their digital growth.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <div className="mb-4 text-4xl">🌍</div>
              <h3 className="mb-3 text-xl font-bold">Cultural Pride</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                Every reservation is an act of supporting the diaspora economy and preserving culinary heritage.
              </p>
            </div>
          </div>
        </div>
      </section>

      <MetroUpdatesSignup />
      <MeetTheFounderSection />
      <AboutContactCta />
    </div>
  );
}
