import Link from "next/link";
import Image from "next/image";
import { Apple, Instagram, Smartphone, Twitter, Youtube } from "lucide-react";
import FooterExpandedLists from "@/components/layout/FooterExpandedLists";
import NewsletterSignup from "@/components/layout/NewsletterSignup";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="border-t bg-gradient-to-b from-muted/10 to-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="AfriTable"
                width={320}
                height={80}
                className="h-16 w-auto object-contain md:h-[68px]"
              />
              <span className="sr-only">AfriTable</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Discover and reserve authentic African &amp; Caribbean dining experiences across America.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background/60 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="AfriTable on Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background/60 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="AfriTable on X"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background/60 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="AfriTable on YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-6 grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-foreground/90">Get the app</div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-2 bg-background/60">
                  <Apple className="h-4 w-4" />
                  App Store
                </Button>
                <Button variant="outline" size="sm" className="gap-2 bg-background/60">
                  <Smartphone className="h-4 w-4" />
                  Google Play
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">Coming soon • join the newsletter for launch updates.</div>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid gap-6 sm:grid-cols-2 md:col-span-8 md:grid-cols-4">
            <div className="text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-foreground/90">Discover</div>
              <div className="mt-2 grid gap-1.5 leading-6">
              <Link className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4" href="/restaurants">
                Find restaurants
              </Link>
              <Link className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4" href="/restaurants?city=Houston%2C%20TX">
                Houston
              </Link>
              <Link className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4" href="/restaurants?city=Atlanta%2C%20GA">
                Atlanta
              </Link>
              <Link className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4" href="/restaurants?city=New%20York%2C%20NY">
                New York City
              </Link>
              <Link className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4" href="/restaurants?cuisine=Nigerian">
                Nigerian cuisine
              </Link>
              <Link className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4" href="/restaurants?cuisine=Jamaican">
                Jamaican cuisine
              </Link>
              </div>
            </div>

            <div className="text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-foreground/90">For restaurants</div>
              <div className="mt-2 grid gap-1.5 leading-6">
              <Link className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4" href="/restaurant-signup">
                Join AfriTable
              </Link>
              <Link className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4" href="/dashboard">
                Owner dashboard
              </Link>
              <Link className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4" href="/about">
                Why AfriTable
              </Link>
              </div>
            </div>

            <div className="text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-foreground/90">Company</div>
              <div className="mt-2 grid gap-1.5 leading-6">
              <Link className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4" href="/about">
                About
              </Link>
              <a className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4" href="mailto:support@afritable.com">
                Contact support
              </a>
              <a className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4" href="mailto:partners@afritable.com">
                Partnerships
              </a>
              </div>
            </div>

            <div className="text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-foreground/90">Legal</div>
              <div className="mt-2 grid gap-1.5 leading-6">
              <Link className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4" href="/terms">
                Terms
              </Link>
              <Link className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4" href="/privacy">
                Privacy
              </Link>
              <Link className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4" href="/cookies">
                Cookies
              </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t pt-10">
          <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="rounded-2xl border bg-background/40 p-5">
              <FooterExpandedLists />
            </div>
          </div>
          <div className="md:col-span-5">
            <div className="rounded-2xl border bg-background/60 p-5 shadow-sm">
              <NewsletterSignup />
            </div>
          </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} AfriTable. All rights reserved.</div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link className="hover:text-foreground hover:underline underline-offset-4" href="/terms">
              Terms
            </Link>
            <Link className="hover:text-foreground hover:underline underline-offset-4" href="/privacy">
              Privacy
            </Link>
            <Link className="hover:text-foreground hover:underline underline-offset-4" href="/cookies">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

