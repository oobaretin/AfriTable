"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@db/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type NavbarClientProps = {
  user: User | null;
  profile: Profile | null;
};

function initials(name?: string | null) {
  if (!name) return "AT";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "AT";
}

function displayNameFrom(user: User | null, profile: Profile | null) {
  return profile?.full_name ?? (typeof user?.user_metadata?.name === "string" ? user.user_metadata.name : null) ?? user?.email ?? "Account";
}

export function NavbarClient({ user: serverUser, profile: serverProfile }: NavbarClientProps) {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(serverUser);
  const [profile, setProfile] = React.useState<Profile | null>(serverProfile);
  const [signingOut, setSigningOut] = React.useState(false);

  React.useEffect(() => {
    setUser(serverUser);
    setProfile(serverProfile);
  }, [serverUser, serverProfile]);

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function syncProfile(activeUser: User) {
      const { data } = await supabase.from("profiles").select("*").eq("id", activeUser.id).maybeSingle();
      if (data) setProfile(data);
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user ?? null;
      if (sessionUser) {
        setUser(sessionUser);
        void syncProfile(sessionUser);
      }

      // #region agent log
      void fetch("/api/auth/session", { cache: "no-store" })
        .then((res) => res.json())
        .then((probe) => {
          fetch("http://127.0.0.1:7668/ingest/f4aec2f7-622b-445a-95fa-99041b9558b2", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "379971" },
            body: JSON.stringify({
              sessionId: "379971",
              runId: "auth-client-callback-v4",
              hypothesisId: "H3",
              location: "NavbarClient:session-sync",
              message: "client session sync",
              data: {
                clientHasUser: Boolean(sessionUser),
                serverAuthenticated: Boolean(probe?.authenticated),
                authCookieCount: probe?.authCookieCount ?? 0,
              },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
        })
        .catch(() => {});
      // #endregion
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) void syncProfile(sessionUser);
      else setProfile(null);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      router.refresh();
      router.push("/");
    } finally {
      setSigningOut(false);
    }
  }

  const role = profile?.role ?? "diner";
  const displayName = displayNameFrom(user, profile);
  const isSignedIn = Boolean(user);

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
            <a href="/" className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1 relative z-50 pointer-events-auto">
              Home
            </a>
            <a href="/restaurants" className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1 relative z-50 pointer-events-auto">
              Restaurants
            </a>
            <a href="/about" className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1 relative z-50 pointer-events-auto">
              About
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2 relative z-50">
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
                {isSignedIn ? (
                  <>
                    <p className="px-3 text-xs text-muted-foreground">{displayName}</p>
                    {role === "restaurant_owner" ? (
                      <a href="/dashboard" className="block px-3 py-2 text-sm hover:bg-accent rounded-md pointer-events-auto cursor-pointer">
                        Dashboard
                      </a>
                    ) : (
                      <a href="/reservations" className="block px-3 py-2 text-sm hover:bg-accent rounded-md pointer-events-auto cursor-pointer">
                        My Reservations
                      </a>
                    )}
                    <a href="/profile" className="block px-3 py-2 text-sm hover:bg-accent rounded-md pointer-events-auto cursor-pointer">
                      Profile
                    </a>
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      disabled={signingOut}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md pointer-events-auto cursor-pointer disabled:opacity-50"
                    >
                      {signingOut ? "Signing out…" : "Sign out"}
                    </button>
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

          <div className="hidden items-center gap-2 md:flex relative z-[100]">
            {isSignedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 pointer-events-auto cursor-pointer relative z-[100]">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]">{initials(profile?.full_name ?? displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="max-w-[160px] truncate">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 pointer-events-auto">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {role === "restaurant_owner" ? (
                    <DropdownMenuItem asChild>
                      <a href="/dashboard" className="pointer-events-auto cursor-pointer">Dashboard</a>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <a href="/reservations" className="pointer-events-auto cursor-pointer">My Reservations</a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <a href="/profile" className="pointer-events-auto cursor-pointer">Profile</a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={signingOut}
                    className="cursor-pointer"
                    onSelect={(event) => {
                      event.preventDefault();
                      void handleSignOut();
                    }}
                  >
                    {signingOut ? "Signing out…" : "Sign out"}
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
