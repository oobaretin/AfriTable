"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Handshake,
  Clock,
  Search,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type AdminDashboardLayoutProps = {
  children: React.ReactNode;
  userName: string;
};

const navItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Submissions", href: "/admin/submissions", icon: FileText, exact: false },
  { label: "Partner applications", href: "/admin/partner-applications", icon: Handshake, exact: false },
  { label: "Pending restaurants", href: "/admin/pending-restaurants", icon: Clock, exact: false },
  { label: "Catalog QA", href: "/admin/catalog-qa", icon: Search, exact: false },
];

function isActivePath(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminDashboardLayout({ children, userName }: AdminDashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-brand-paper">
      <aside className="flex w-20 shrink-0 flex-col border-r border-brand-dark/10 bg-brand-dark px-4 py-8 text-white lg:w-64">
        <div className="mb-10 px-2">
          <Link href="/admin" className="block">
            <Image
              src="/logo.png"
              alt="AfriTable"
              width={140}
              height={40}
              className="h-8 w-auto object-contain lg:h-10"
            />
          </Link>
          <p className="mt-3 hidden text-xs font-semibold uppercase tracking-wider text-brand-bronze lg:block">
            Admin
          </p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-bronze text-white shadow-md"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 space-y-2 border-t border-white/10 pt-6">
          <p className="hidden truncate px-3 text-xs text-slate-400 lg:block">{userName}</p>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline">View public site</span>
          </Link>
          <Button
            type="button"
            variant="ghost"
            className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-white"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
