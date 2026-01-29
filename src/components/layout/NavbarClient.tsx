"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { signOutAction } from "@/lib/auth/actions";

type NavbarClientProps = {
  user: any;
  profile: any;
};

function initials(name?: string | null) {
  if (!name) return "AT";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "AT";
}

export function NavbarClient({ user, profile }: NavbarClientProps) {
  const role = profile?.role ?? "diner";
  const displayName = profile?.full_name ?? user?.email ?? "AfriTable";

  return (
    <header className="fixed top-0 w-full border-b bg-white z-50">
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-6 relative z-50">
        <div className="flex items-center gap-6 relative z-50">
          <a href="/" className="flex items-center gap-2 relative z-50 pointer-events-auto cursor-pointer">
            <Image
              src="/logo.png"
              alt="AfriTable"
              width={420}
              height={120}
              priority
              className="h-[86px] w-auto object-contain md:h-[92px]"
            />
            <span className="sr-only">AfriTable</span>
          </a>

          <nav className="hidden items-center gap-4 text-sm md:flex relative z-50">
            <a 
              href="/" 
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1 relative z-50 pointer-events-auto"
            >
              Home
            </a>
            <a 
              href="/restaurants" 
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1 relative z-50 pointer-events-auto"
            >
              Restaurants
            </a>
            <a 
              href="/about" 
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1 relative z-50 pointer-events-auto"
            >
              About
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2 relative z-50">
          {/* Mobile menu */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="md:hidden pointer-events-auto cursor-pointer relative z-50" aria-label="Open menu">
                Menu
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>AfriTable</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2">
                <a href="/" className="block px-3 py-2 text-sm hover:bg-accent rounded-md pointer-events-auto cursor-pointer">
                  Home
                </a>
                <a href="/restaurants" className="block px-3 py-2 text-sm hover:bg-accent rounded-md pointer-events-auto cursor-pointer">
                  Restaurants
                </a>
                <a href="/about" className="block px-3 py-2 text-sm hover:bg-accent rounded-md pointer-events-auto cursor-pointer">
                  About
                </a>
                <div className="h-px bg-border my-2" />
                {user ? (
                  <>
                    {role === "restaurant_owner" ? (
                      <a href="/dashboard" className="block px-3 py-2 text-sm hover:bg-accent rounded-md pointer-events-auto cursor-pointer">
                        Dashboard
                      </a>
                    ) : (
                      <a href="/reservations" className="block px-3 py-2 text-sm hover:bg-accent rounded-md pointer-events-auto cursor-pointer">
                        My Reservations
                      </a>
                    )}
                    <form action={signOutAction}>
                      <button type="submit" className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md pointer-events-auto cursor-pointer">
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <a href="/login" className="block px-3 py-2 text-sm hover:bg-accent rounded-md pointer-events-auto cursor-pointer">
                      Sign in
                    </a>
                    <a href="/signup" className="block px-3 py-2 text-sm hover:bg-accent rounded-md pointer-events-auto cursor-pointer">
                      Sign up
                    </a>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Desktop auth area */}
          <div className="hidden items-center gap-2 md:flex relative z-[100]">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 pointer-events-auto cursor-pointer relative z-[100]">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]">{initials(profile?.full_name)}</AvatarFallback>
                    </Avatar>
                    <span className="max-w-[160px] truncate">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 pointer-events-auto">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {role === "restaurant_owner" ? (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" prefetch={false} className="pointer-events-auto cursor-pointer">Dashboard</Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href="/reservations" prefetch={false} className="pointer-events-auto cursor-pointer">My Reservations</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile" prefetch={false} className="pointer-events-auto cursor-pointer">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action={signOutAction} className="w-full pointer-events-auto">
                      <button type="submit" className="w-full text-left pointer-events-auto cursor-pointer">
                        Sign out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <a href="/login" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground pointer-events-auto cursor-pointer relative z-50">
                  Sign in
                </a>
                <a href="/signup" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 pointer-events-auto cursor-pointer relative z-50">
                  Sign up
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
