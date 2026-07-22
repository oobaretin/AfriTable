import Image from "next/image";
import Link from "next/link";
import { mailto, SITE_CONTACT } from "@/lib/site-contact";

/**
 * Founder story section for the About page.
 */
export function MeetTheFounderSection() {
  return (
    <section className="py-24 px-6 bg-[#000814] relative overflow-hidden" aria-labelledby="meet-the-founder-heading">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
              linear-gradient(30deg, #001d3d 12%, transparent 12.5%, transparent 87%, #001d3d 87.5%, #001d3d),
              linear-gradient(150deg, #001d3d 12%, transparent 12.5%, transparent 87%, #001d3d 87.5%, #001d3d)
            `,
          backgroundSize: "60px 104px",
          backgroundPosition: "0 0, 30px 52px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#000814]/30 to-[#000814] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 id="meet-the-founder-heading" className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
            The Visionary Behind AfriTable
          </h2>
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest">
            Meet the Founder
          </p>
          <div className="h-1 w-16 bg-[#C69C2B] mx-auto mt-4 rounded-full" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 md:p-10 shadow-2xl shadow-black/20 flex flex-col items-center text-center">
          <div className="mb-6 h-40 w-40 md:h-48 md:w-48 flex-shrink-0 overflow-hidden rounded-full bg-black ring-4 ring-[#C69C2B]/30 ring-offset-4 ring-offset-[#000814] shadow-xl">
            <Image
              src="/emblem.png"
              alt="AfriTable Sankofa emblem"
              width={512}
              height={512}
              className="h-full w-full scale-[1.08] object-cover"
            />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Founder &amp; CEO</h3>
          <p className="text-[#C69C2B] text-sm font-semibold mb-6">AfriTable</p>
          <p className="text-slate-300 leading-relaxed max-w-lg mb-8">
            I built AfriTable from a deep love for authentic Jamaican dining and the wider Caribbean and African table.
            There&apos;s nothing like the real thing—jerk that tastes of pimento and smoke, oxtail that falls off the bone,
            and the warmth of food made with generations of tradition. I started this platform so that the diaspora and
            every curious diner can find and book those experiences easily. Our food is a language of love; AfriTable
            is here to make sure it always has a seat at the table.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-[#C69C2B]/20 hover:border-[#C69C2B]/50 transition-colors text-sm font-semibold"
            >
              Contact the team
            </Link>
            <a
              href={mailto(SITE_CONTACT.hello)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-[#C69C2B]/20 hover:border-[#C69C2B]/50 transition-colors text-sm font-semibold"
            >
              {SITE_CONTACT.hello}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
