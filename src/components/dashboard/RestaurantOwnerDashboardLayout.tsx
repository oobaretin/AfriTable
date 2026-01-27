"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type RestaurantOwnerDashboardLayoutProps = {
  children: React.ReactNode;
  restaurantName: string;
  activeTab?: "overview" | "bookings" | "menu" | "reviews" | "settings";
};

export function RestaurantOwnerDashboardLayout({
  children,
  activeTab = "overview",
}: RestaurantOwnerDashboardLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Overview", icon: "📊", href: "/dashboard", tab: "overview" as const },
    { label: "Bookings", icon: "🗓️", href: "/dashboard", tab: "bookings" as const },
    { label: "Menu", icon: "🥘", href: "/dashboard", tab: "menu" as const },
    { label: "Reviews", icon: "⭐", href: "/dashboard/reviews", tab: "reviews" as const },
    { label: "Analytics", icon: "📈", href: "/dashboard/analytics", tab: "analytics" as const },
    { label: "Settings", icon: "⚙️", href: "/dashboard", tab: "settings" as const },
  ];

  return (
    <div className="min-h-screen bg-brand-paper flex">
      {/* Slim Pro Sidebar */}
      <aside className="w-20 lg:w-64 bg-brand-dark flex flex-col items-center lg:items-start py-8 px-4 text-white transition-all">
        <Link href="/" className="mb-12 px-2">
          <Image
            src="/logo.png"
            alt="AfriTable Logo"
            width={120}
            height={40}
            className="h-8 lg:h-10 object-contain"
          />
        </Link>

        <nav className="flex-1 w-full space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || activeTab === item.tab;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-brand-bronze text-white shadow-lg"
                    : "text-slate-400 hover:bg-white/5"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="hidden lg:block font-bold text-sm tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
