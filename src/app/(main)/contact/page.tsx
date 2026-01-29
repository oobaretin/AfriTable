import { ContactAndMap } from "@/components/home/ContactAndMap";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with AfriTable. General inquiries, partnerships, and support.",
};

export default function ContactPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-6 bg-slate-50">
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
    </div>
  );
}
