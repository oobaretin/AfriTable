"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  created_at: string;
  default_party_size: number | null;
  favorite_cuisines: string[];
  dietary_restrictions: string[];
  email_prefs: Record<string, any>;
  sms_opt_in: boolean;
  no_show_count: number;
};

const CUISINES = [
  "Nigerian",
  "Ethiopian",
  "Ghanaian",
  "Senegalese",
  "Somali",
  "Eritrean",
  "South African",
  "Kenyan",
  "Jamaican",
  "Trinidadian",
  "Haitian",
  "Other African",
  "Other Caribbean",
];

const DIETARY = ["Vegan", "Vegetarian", "Halal", "Gluten-free"];

function initials(name?: string | null) {
  if (!name) return "AT";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "AT";
}

export function ProfileClient() {
  const q = useQuery<{ profile: Profile | null; email: string | null }>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load profile");
      return data;
    },
  });

  const profile = q.data?.profile ?? null;
  const email = q.data?.email ?? null;

  const [saving, setSaving] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [city, setCity] = React.useState("");
  const [defaultParty, setDefaultParty] = React.useState("2");
  const [favCuisines, setFavCuisines] = React.useState<string[]>([]);
  const [dietary, setDietary] = React.useState<string[]>([]);
  const [smsOptIn, setSmsOptIn] = React.useState(false);
  const [emailConfirm, setEmailConfirm] = React.useState(true);
  const [emailReminder, setEmailReminder] = React.useState(true);
  const [emailReview, setEmailReview] = React.useState(true);
  const [emailPromo, setEmailPromo] = React.useState(false);

  React.useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setCity(profile.city ?? "");
    setDefaultParty(String(profile.default_party_size ?? 2));
    setFavCuisines(profile.favorite_cuisines ?? []);
    setDietary(profile.dietary_restrictions ?? []);
    setSmsOptIn(Boolean(profile.sms_opt_in));
    const prefs = profile.email_prefs ?? {};
    setEmailConfirm(prefs.confirmations !== false);
    setEmailReminder(prefs.reminders !== false);
    setEmailReview(prefs.review_requests !== false);
    setEmailPromo(prefs.promotions === true);
  }, [profile]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          phone: phone || null,
          city: city || null,
          default_party_size: Number(defaultParty),
          favorite_cuisines: favCuisines,
          dietary_restrictions: dietary,
          sms_opt_in: smsOptIn,
          email_prefs: {
            confirmations: emailConfirm,
            reminders: emailReminder,
            review_requests: emailReview,
            promotions: emailPromo,
          },
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || data?.error || "Save failed");
      toast.success("Profile updated");
      void q.refetch();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function toggle(list: string[], value: string, set: (v: string[]) => void) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10 md:py-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Account details and preferences.</p>
        </div>
      </div>

      {q.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Card>
          <CardHeader className="md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{initials(profile?.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">{profile?.full_name ?? "Your profile"}</CardTitle>
                <CardDescription>
                  {email ? (
                    <>
                      {email} <Badge variant="secondary">Verified</Badge>
                    </>
                  ) : null}
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1.5">
                <div className="text-sm font-medium">Full name</div>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <div className="text-sm font-medium">Phone</div>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
              </div>
              <div className="grid gap-1.5">
                <div className="text-sm font-medium">City</div>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Atlanta, GA" />
              </div>
              <div className="grid gap-1.5">
                <div className="text-sm font-medium">Default party size</div>
                <Select value={defaultParty} onValueChange={setDefaultParty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 20 }, (_, i) => String(i + 1)).map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <div className="text-sm font-medium">Favorite cuisines</div>
                <div className="flex flex-wrap gap-2">
                  {CUISINES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-sm ${favCuisines.includes(c) ? "bg-primary text-primary-foreground" : "bg-background"}`}
                      onClick={() => toggle(favCuisines, c, setFavCuisines)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <div className="text-sm font-medium">Dietary restrictions</div>
                <div className="flex flex-wrap gap-2">
                  {DIETARY.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-sm ${dietary.includes(d) ? "bg-primary text-primary-foreground" : "bg-background"}`}
                      onClick={() => toggle(dietary, d, setDietary)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <div className="text-sm font-medium">Notifications</div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-medium">Reservation confirmations</div>
                    <div className="text-xs text-muted-foreground">Emails for bookings and changes</div>
                  </div>
                  <Switch checked={emailConfirm} onCheckedChange={setEmailConfirm} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-medium">Reminders</div>
                    <div className="text-xs text-muted-foreground">24 hours before your reservation</div>
                  </div>
                  <Switch checked={emailReminder} onCheckedChange={setEmailReminder} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-medium">Review requests</div>
                    <div className="text-xs text-muted-foreground">After you dine</div>
                  </div>
                  <Switch checked={emailReview} onCheckedChange={setEmailReview} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-medium">Promotions</div>
                    <div className="text-xs text-muted-foreground">New restaurants and offers</div>
                  </div>
                  <Switch checked={emailPromo} onCheckedChange={setEmailPromo} />
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-sm font-medium">SMS opt-in</div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-medium">SMS reminders</div>
                    <div className="text-xs text-muted-foreground">Optional (feature can be wired later)</div>
                  </div>
                  <Switch checked={smsOptIn} onCheckedChange={setSmsOptIn} />
                </div>

                <Card className="mt-2">
                  <CardHeader>
                    <CardTitle className="text-base">Quick stats</CardTitle>
                    <CardDescription>Account snapshot</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <div>Member since: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</div>
                    <div>No-shows: {profile?.no_show_count ?? 0}</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            <div className="grid gap-2">
              <div className="text-sm font-medium">Account actions</div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled title="Wire password reset later">
                  Change password
                </Button>
                <Button variant="destructive" disabled title="Wire delete account later">
                  Delete account
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Avatar upload will be wired via Supabase Storage (bucket: <code className="font-mono">avatars</code>).
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

