import Link from "next/link";
import { ContactEmailList } from "@/components/contact/ContactEmailList";
import { SITE_CONTACT, mailto } from "@/lib/site-contact";

/** Contact page body — inboxes and routing guidance only. */
export function ContactSection() {
  return (
    <section className="bg-white px-6 py-16 md:py-24" aria-labelledby="contact-inboxes-heading">
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="contact-inboxes-heading" className="text-3xl font-black tracking-tight text-slate-900">
            Email the right team
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Pick the inbox that best matches your question. We aim to reply within 2–3 business days.
          </p>
        </div>

        <div className="mt-14">
          <ContactEmailList layout="grid" />
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Restaurant owners</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Ready to list or already approved? Start with our partner application or owner sign-in—not general
              support.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm font-semibold">
              <Link href="/join-as-restaurant" className="text-brand-bronze underline-offset-4 hover:underline">
                Apply to partner
              </Link>
              <Link href="/login?redirectTo=/dashboard" className="text-brand-bronze underline-offset-4 hover:underline">
                Owner sign in
              </Link>
              <a href={mailto(SITE_CONTACT.partnerships)} className="text-brand-bronze underline-offset-4 hover:underline">
                {SITE_CONTACT.partnerships}
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Diners &amp; general help</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Questions about reservations, listings, or your account? Support can help—or use hello for anything
              that doesn&apos;t fit another inbox.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm font-semibold">
              <a href={mailto(SITE_CONTACT.support)} className="text-brand-bronze underline-offset-4 hover:underline">
                {SITE_CONTACT.support}
              </a>
              <a href={mailto(SITE_CONTACT.hello)} className="text-brand-bronze underline-offset-4 hover:underline">
                {SITE_CONTACT.hello}
              </a>
              <Link href="/restaurants" className="text-brand-bronze underline-offset-4 hover:underline">
                Browse the directory
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
