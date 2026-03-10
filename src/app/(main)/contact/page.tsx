import { ContactAndMap } from "@/components/home/ContactAndMap";
import { MeetTheFounderSection } from "@/components/home/MeetTheFounderSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with AfriTable. General inquiries, partnerships, and support.",
};

export default function ContactPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb - proper navigation so users don't need browser back */}
      <div className="px-4 sm:px-6 pt-6 pb-2">
        <nav className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
          <a href="/" className="hover:text-slate-900 transition-colors">
            Home
          </a>
          <span aria-hidden>/</span>
          <span className="font-medium text-slate-900">Contact</span>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
            Get in Touch
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Have questions? We&apos;d love to hear from you. Reach out and we&apos;ll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Form and Map */}
      <ContactAndMap />

      {/* Meet the Founder - Dark Blue 3D theme to match Hero */}
      <MeetTheFounderSection />
    </div>
  );
}
