import Link from "next/link";

/** Closing CTA on About — points to Contact instead of duplicating inboxes. */
export function AboutContactCta() {
  return (
    <section className="border-t border-slate-100 bg-white px-6 py-20" aria-labelledby="about-contact-cta-heading">
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="about-contact-cta-heading" className="text-3xl font-black tracking-tight text-slate-900">
          Work with us
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          Interested in partnering, press, or community collaborations? Our team is happy to talk—reach out through
          the contact page and we&apos;ll route you to the right inbox.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-2xl bg-brand-dark px-8 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-slate-800"
          >
            Contact the team
          </Link>
          <Link
            href="/join-as-restaurant"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-8 py-3 text-sm font-bold uppercase tracking-widest text-slate-700 transition hover:border-brand-bronze hover:text-brand-bronze"
          >
            Apply as a restaurant
          </Link>
        </div>
      </div>
    </section>
  );
}
