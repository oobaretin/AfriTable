import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/layout/Navbar";
import { Analytics } from "@vercel/analytics/react";
import Footer from "@/components/layout/Footer";
import CookieConsentBanner from "@/components/layout/CookieConsentBanner";
import { FoundersNote } from "@/components/home/FoundersNote";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const siteName = "AfriTable";
const siteTitle = "AfriTable - Discover & Reserve African & Caribbean Restaurants";
const siteDescription =
  "Book authentic African and Caribbean dining experiences across America. Discover Nigerian, Ethiopian, Ghanaian, Jamaican, and more.";
const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "African restaurants",
    "Caribbean restaurants",
    "restaurant reservations",
    "Nigerian restaurants",
    "Ethiopian restaurants",
    "Ghanaian restaurants",
    "Jamaican restaurants",
    "AfriTable",
  ],
  openGraph: {
    type: "website",
    siteName,
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: siteTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.svg"],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} relative min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <Providers>
          {/* Global background polish */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_55%),radial-gradient(circle_at_80%_0%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_55%),radial-gradient(circle_at_70%_90%,color-mix(in_oklab,var(--secondary)_35%,transparent),transparent_55%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(to_right,color-mix(in_oklab,var(--foreground)_12%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_10%,transparent)_1px,transparent_1px)] [background-size:48px_48px]"
          />
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
          <CookieConsentBanner />
          <FoundersNote />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
