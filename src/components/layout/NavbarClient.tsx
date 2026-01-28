"use client";

import * as React from "react";
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
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const role = profile?.role ?? "diner";
  const displayName = profile?.full_name ?? user?.email ?? "AfriTable";

  if (!mounted) {
    return (
      <header className="fixed top-0 w-full border-b bg-white z-50">
        <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-6 relative z-50">
          <div className="flex items-center gap-6 relative z-50">
            <div className="h-[86px] w-[200px] bg-muted animate-pulse rounded" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 w-full border-b bg-white z-50">
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-6 relative z-50">
        <div className="flex items-center gap-6 relative z-50">
          <Link href="/" className="flex items-center gap-2 relative z-50 pointer-events-auto cursor-pointer" prefetch={false}>
            <Image
              src="/logo.png"
              alt="AfriTable"
              width={420}
              height={120}
              priority
              className="h-[86px] w-auto object-contain md:h-[92px]"
            />
            <span className="sr-only">AfriTable</span>
          </Link>

          {mounted && (
            <nav className="hidden items-center gap-4 text-sm md:flex relative z-50">
              <Link 
                href="/" 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1 relative z-50 pointer-events-auto"
                prefetch={false}
              >
                Home
              </Link>
              <Link 
                href="/restaurants" 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1 relative z-50 pointer-events-auto"
                prefetch={false}
              >
                Restaurants
              </Link>
              <Link 
                href="/about" 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1 relative z-50 pointer-events-auto"
                prefetch={false}
              >
                About
              </Link>
            </nav>
          )}
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
              {mounted && (
                <div className="grid gap-2">
                  <Button asChild variant="ghost" className="justify-start pointer-events-auto cursor-pointer relative z-50">
                    <Link href="/" prefetch={false} className="pointer-events-auto">Home</Link>
                  </Button>
                  <Button asChild variant="ghost" className="justify-start pointer-events-auto cursor-pointer relative z-50">
                    <Link href="/restaurants" prefetch={false} className="pointer-events-auto">Restaurants</Link>
                  </Button>
                  <Button asChild variant="ghost" className="justify-start pointer-events-auto cursor-pointer relative z-50">
                    <Link href="/about" prefetch={false} className="pointer-events-auto">About</Link>
                  </Button>
                  <div className="h-px bg-border my-2" />
                  {user ? (
                    <>
                      {role === "restaurant_owner" ? (
                        <Button asChild variant="ghost" className="justify-start pointer-events-auto cursor-pointer relative z-50">
                          <Link href="/dashboard" prefetch={false} className="pointer-events-auto">Dashboard</Link>
                        </Button>
                      ) : (
                        <Button asChild variant="ghost" className="justify-start pointer-events-auto cursor-pointer relative z-50">
                          <Link href="/reservations" prefetch={false} className="pointer-events-auto">My Reservations</Link>
                        </Button>
                      )}
                      <form action={signOutAction}>
                        <Button type="submit" variant="ghost" className="w-full justify-start pointer-events-auto cursor-pointer relative z-50">
                          Sign out
                        </Button>
                      </form>
                    </>
                  ) : (
                    <>
                      <Button asChild variant="ghost" className="justify-start">
                        <Link href="/login" prefetch={false}>Sign in</Link>
                      </Button>
                      <Button asChild className="justify-start">
                        <Link href="/signup" prefetch={false}>Sign up</Link>
                      </Button>
                    </>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Desktop auth area */}
          {mounted && (
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
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {role === "restaurant_owner" ? (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" prefetch={false} className="pointer-events-auto">Dashboard</Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link href="/reservations" prefetch={false} className="pointer-events-auto">My Reservations</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/profile" prefetch={false} className="pointer-events-auto">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <form action={signOutAction} className="w-full">
                        <button type="submit" className="w-full text-left">
                          Sign out
                        </button>
                      </form>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button asChild variant="outline" className="pointer-events-auto cursor-pointer relative z-50">
                    <Link href="/login" prefetch={false} className="pointer-events-auto">Sign in</Link>
                  </Button>
                  <Button asChild className="pointer-events-auto cursor-pointer relative z-50">
                    <Link href="/signup" prefetch={false} className="pointer-events-auto">Sign up</Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
