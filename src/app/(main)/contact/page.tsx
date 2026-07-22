import { ContactSection } from "@/components/contact/ContactSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Reach AfriTable by email—general inquiries, partnerships, support, sales, and privacy requests.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 pb-2 pt-6 sm:px-6">
        <nav className="mx-auto flex max-w-7xl items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
          <a href="/" className="transition-colors hover:text-slate-900">
            Home
          </a>
          <span aria-hidden>/</span>
          <span className="font-medium text-slate-900">Contact</span>
        </nav>
      </div>

      <section className="bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-black tracking-tight text-slate-900 md:text-6xl">Get in Touch</h1>
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-slate-600">
            Use the inboxes below for direct email. For our story, mission, and team, visit{" "}
            <a href="/about" className="font-semibold text-brand-bronze underline-offset-4 hover:underline">
              About AfriTable
            </a>
            .
          </p>
        </div>
      </section>

      <ContactSection />
    </div>
  );
}
