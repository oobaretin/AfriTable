"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Apple, Instagram, Smartphone, Twitter, Youtube } from "lucide-react";
import FooterExpandedLists from "@/components/layout/FooterExpandedLists";
import NewsletterSignup from "@/components/layout/NewsletterSignup";
import { Button } from "@/components/ui/button";

export default function Footer() {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <footer className="border-t bg-brand-dark text-white relative z-[90]">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="h-32 bg-muted/20 animate-pulse rounded" />
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t bg-brand-dark text-white relative z-[90]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2 relative z-[90] pointer-events-auto" prefetch={true}>
              <Image
                src="/logo.png"
                alt="AfriTable"
                width={320}
                height={80}
                className="h-16 w-auto object-contain md:h-[68px]"
              />
              <span className="sr-only">AfriTable</span>
            </Link>
            <p className="mt-3 text-sm text-slate-300">
              Discover and reserve authentic African &amp; Caribbean dining experiences across America.
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

            <div className="mt-6 grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">Get the app</div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-2 bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
                  <Apple className="h-4 w-4" />
                  App Store
                </Button>
                <Button variant="outline" size="sm" className="gap-2 bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
                  <Smartphone className="h-4 w-4" />
                  Google Play
                </Button>
              </div>
              <div className="text-xs text-slate-400">Coming soon • join the newsletter for launch updates.</div>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid gap-6 sm:grid-cols-2 md:col-span-8 md:grid-cols-4">
            <div className="text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">Discover</div>
              <div className="mt-2 grid gap-1.5 leading-6">
              <Link className="text-slate-400 hover:text-white hover:underline underline-offset-4 relative z-10 pointer-events-auto" href="/restaurants" prefetch={true}>
                Find restaurants
              </Link>
              <Link className="text-slate-400 hover:text-white hover:underline underline-offset-4 relative z-10 pointer-events-auto" href="/restaurants?city=Houston%2C%20TX" prefetch={true}>
                Houston
              </Link>
              <Link className="text-slate-400 hover:text-white hover:underline underline-offset-4 relative z-10 pointer-events-auto" href="/restaurants?city=Atlanta%2C%20GA" prefetch={true}>
                Atlanta
              </Link>
              <Link className="text-slate-400 hover:text-white hover:underline underline-offset-4 relative z-10 pointer-events-auto" href="/restaurants?city=New%20York%2C%20NY" prefetch={true}>
                New York City
              </Link>
              <Link className="text-slate-400 hover:text-white hover:underline underline-offset-4 relative z-10 pointer-events-auto" href="/restaurants?cuisine=Nigerian" prefetch={true}>
                Nigerian cuisine
              </Link>
              <Link className="text-slate-400 hover:text-white hover:underline underline-offset-4 relative z-10 pointer-events-auto" href="/restaurants?cuisine=Jamaican" prefetch={true}>
                Jamaican cuisine
              </Link>
              </div>
            </div>

            <div className="text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">For restaurants</div>
              <div className="mt-2 grid gap-1.5 leading-6">
              <Link className="text-slate-400 hover:text-white hover:underline underline-offset-4" href="/restaurant-signup" prefetch={true}>
                Join AfriTable
              </Link>
              <Link className="text-slate-400 hover:text-white hover:underline underline-offset-4" href="/dashboard" prefetch={true}>
                Owner dashboard
              </Link>
              <Link className="text-slate-400 hover:text-white hover:underline underline-offset-4" href="/about" prefetch={true}>
                Why AfriTable
              </Link>
              </div>
            </div>

            <div className="text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">Company</div>
              <div className="mt-2 grid gap-1.5 leading-6">
              <Link className="text-slate-400 hover:text-white hover:underline underline-offset-4 relative z-[90] pointer-events-auto" href="/about" prefetch={true}>
                About
              </Link>
              <a className="text-slate-400 hover:text-white hover:underline underline-offset-4 relative z-[90] pointer-events-auto" href="mailto:support@afritable.com">
                Contact support
              </a>
              <a className="text-slate-400 hover:text-white hover:underline underline-offset-4 relative z-[90] pointer-events-auto" href="mailto:partners@afritable.com">
                Partnerships
              </a>
              </div>
            </div>

            <div className="text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">Legal</div>
              <div className="mt-2 grid gap-1.5 leading-6">
              <Link className="text-slate-400 hover:text-white hover:underline underline-offset-4" href="/terms" prefetch={true}>
                Terms
              </Link>
              <Link className="text-slate-400 hover:text-white hover:underline underline-offset-4" href="/privacy" prefetch={true}>
                Privacy
              </Link>
              <Link className="text-slate-400 hover:text-white hover:underline underline-offset-4" href="/cookies" prefetch={true}>
                Cookies
              </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-10">
          <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <FooterExpandedLists />
            </div>
          </div>
          <div className="md:col-span-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
              <NewsletterSignup />
            </div>
          </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-800 pt-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} AfriTable. All rights reserved.</div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link className="hover:text-white hover:underline underline-offset-4 relative z-[90] pointer-events-auto" href="/terms" prefetch={true}>
              Terms
            </Link>
            <Link className="hover:text-white hover:underline underline-offset-4 relative z-[90] pointer-events-auto" href="/privacy" prefetch={true}>
              Privacy
            </Link>
            <Link className="hover:text-white hover:underline underline-offset-4 relative z-[90] pointer-events-auto" href="/cookies" prefetch={true}>
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

