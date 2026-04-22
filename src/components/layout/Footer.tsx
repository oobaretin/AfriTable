"use client";

import Image from "next/image";
import { Instagram, Twitter, Youtube } from "lucide-react";
import NewsletterSignup from "@/components/layout/NewsletterSignup";
import { mailto, SITE_CONTACT } from "@/lib/site-contact";

export default function Footer() {
  return (
    <footer className="border-t bg-brand-dark text-white relative z-[90] pointer-events-auto">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-14">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-4">
            <a href="/" className="inline-flex items-center gap-2 relative z-[90] pointer-events-auto">
              <Image
                src="/logo.png"
                alt="AfriTable"
                width={320}
                height={80}
                className="h-14 w-auto object-contain md:h-16"
              />
              <span className="sr-only">AfriTable</span>
            </a>
            <p className="mt-3 text-sm text-slate-300">
              Discover and reserve African &amp; Caribbean dining across the United States.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800/60 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="AfriTable on Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800/60 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="AfriTable on X"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800/60 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="AfriTable on YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>

            <p className="mt-6 text-xs text-slate-500">
              Mobile apps are not live yet.{" "}
              <a
                href="#footer-newsletter"
                className="font-semibold text-amber-400/90 underline-offset-4 hover:text-amber-300 hover:underline"
              >
                Get launch updates
              </a>
              .
            </p>
          </div>

          {/* Link columns — three clusters; legal lives in the bottom bar only */}
          <div className="grid gap-8 sm:grid-cols-2 md:col-span-8 md:grid-cols-3 md:gap-6">
            <div className="text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">Discover</div>
              <div className="mt-2 grid gap-1.5 leading-6">
                <a className="text-slate-400 hover:text-white hover:underline underline-offset-4 block" href="/restaurants">
                  Explore the directory
                </a>
                <a className="text-slate-400 hover:text-white hover:underline underline-offset-4 block" href="/submit-restaurant">
                  Suggest a restaurant
                </a>
              </div>
            </div>

            <div className="text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">For restaurants</div>
              <div className="mt-2 grid gap-1.5 leading-6">
                <a className="text-slate-400 hover:text-white hover:underline underline-offset-4 block" href="/restaurant-signup">
                  Join AfriTable
                </a>
                <a className="text-slate-400 hover:text-white hover:underline underline-offset-4 block" href="/dashboard">
                  Owner dashboard
                </a>
                <a className="text-slate-400 hover:text-white hover:underline underline-offset-4 block" href="/about">
                  Why AfriTable
                </a>
              </div>
            </div>

            <div className="text-sm sm:col-span-2 md:col-span-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">Company</div>
              <div className="mt-2 grid gap-1.5 leading-6">
                <a className="text-slate-400 hover:text-white hover:underline underline-offset-4 block" href="/about">
                  About
                </a>
                <a className="text-slate-400 hover:text-white hover:underline underline-offset-4 block" href={mailto(SITE_CONTACT.support)}>
                  Contact support
                </a>
                <a className="text-slate-400 hover:text-white hover:underline underline-offset-4 block" href={mailto(SITE_CONTACT.partners)}>
                  Partnerships
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-10">
          <div className="mx-auto max-w-lg" id="footer-newsletter">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
              <NewsletterSignup />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-800 pt-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} AfriTable. All rights reserved.</div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a className="hover:text-white hover:underline underline-offset-4" href="/terms">
              Terms
            </a>
            <a className="hover:text-white hover:underline underline-offset-4" href="/privacy">
              Privacy
            </a>
            <a className="hover:text-white hover:underline underline-offset-4" href="/cookies">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
