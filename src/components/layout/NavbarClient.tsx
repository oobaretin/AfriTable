"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { signOutAction } from "@/lib/auth/actions";
import { signOut } from "@/lib/auth/utils";

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
  const router = useRouter();
  const role = profile?.role ?? "diner";
  const displayName = profile?.full_name ?? user?.email ?? "AfriTable";

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 relative z-10">
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

          <nav className="hidden items-center gap-4 text-sm md:flex relative z-50">
            <Link 
              href="/" 
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1"
              prefetch={true}
            >
              Home
            </Link>
            <Link 
              href="/restaurants" 
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1"
              prefetch={true}
            >
              Restaurants
            </Link>
            <Link 
              href="/about" 
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1"
              prefetch={true}
            >
              About
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile menu */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="md:hidden" aria-label="Open menu">
                Menu
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>AfriTable</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2">
                <Button asChild variant="ghost" className="justify-start">
                  <Link href="/" prefetch={true}>Home</Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start">
                  <Link href="/restaurants" prefetch={true}>Restaurants</Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start">
                  <Link href="/about" prefetch={true}>About</Link>
                </Button>
                <div className="h-px bg-border my-2" />
                {user ? (
                  <>
                    {role === "restaurant_owner" ? (
                      <Button asChild variant="ghost" className="justify-start">
                        <Link href="/dashboard" prefetch={true}>Dashboard</Link>
                      </Button>
                    ) : (
                      <Button asChild variant="ghost" className="justify-start">
                        <Link href="/reservations" prefetch={true}>My Reservations</Link>
                      </Button>
                    )}
                    <form action={signOutAction}>
                      <Button type="submit" variant="ghost" className="w-full justify-start">
                        Sign out
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <Button asChild variant="ghost" className="justify-start">
                      <Link href="/login" prefetch={true}>Sign in</Link>
                    </Button>
                    <Button asChild className="justify-start">
                      <Link href="/signup" prefetch={true}>Sign up</Link>
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Desktop auth area */}
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
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
                      <Link href="/dashboard" prefetch={true}>Dashboard</Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href="/reservations" prefetch={true}>My Reservations</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile" prefetch={true}>Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action={signOut} className="w-full">
                      <button type="submit" className="w-full text-left">
                        Sign out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link href="/login" prefetch={true}>Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup" prefetch={true}>Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
