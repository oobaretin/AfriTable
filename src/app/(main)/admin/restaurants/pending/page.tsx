import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PendingRestaurant = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  phone: string | null;
  website: string | null;
  address: any;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

function addressLine(a: any): string {
  if (!a || typeof a !== "object") return "—";
  return [a.street, a.city, a.state, a.zip].filter(Boolean).join(", ") || "—";
}

export default async function PendingRestaurantsPage() {
  // Enforce admin in the page as a defense-in-depth (middleware should also handle).
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  const user = auth.user;
  if (!user) redirect("/login?redirectTo=/admin/restaurants/pending");

  const { data: profile } = await supabaseSSR.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  const supabaseAdmin = createSupabaseAdminClient();

  // Try to query with is_claimed, but fallback if column doesn't exist
  let query = supabaseAdmin
    .from("restaurants")
    .select("id,owner_id,name,slug,phone,website,address,description,is_active,created_at")
    .eq("is_active", false)
    .order("created_at", { ascending: false });

  const { data: restaurants, error } = await query;

  // If error is about missing column, retry without is_claimed filter
  let pending: PendingRestaurant[];
  if (error && error.code === "42703" && error.message?.includes("is_claimed")) {
    const { data: retryData } = await supabaseAdmin
      .from("restaurants")
      .select("id,owner_id,name,slug,phone,website,address,description,is_active,created_at")
      .eq("is_active", false)
      .order("created_at", { ascending: false });
    pending = (retryData ?? []) as PendingRestaurant[];
  } else {
    // Filter by is_claimed if column exists and query succeeded
    pending = (restaurants ?? []).filter((r: any) => r.is_claimed !== false) as PendingRestaurant[];
  }

  // Owner email is not stored in profiles; fetch from auth.users via Admin API.
  const ownerIds = Array.from(new Set(pending.map((r) => r.owner_id)));
  const ownerEmailById = new Map<string, string>();
  const ownerNameById = new Map<string, string>();

  // Best-effort: get names from profiles, emails from auth.
  if (ownerIds.length) {
    const { data: owners } = await supabaseAdmin.from("profiles").select("id,full_name").in("id", ownerIds);
    for (const o of owners ?? []) {
      ownerNameById.set((o as any).id, (o as any).full_name ?? "—");
    }

    await Promise.all(
      ownerIds.map(async (id) => {
        const res = await supabaseAdmin.auth.admin.getUserById(id);
        const email = res.data?.user?.email ?? "";
        if (email) ownerEmailById.set(id, email);
      }),
    );
  }

  return (
    <Container className="py-10 md:py-14">
      <PageHeader
        title="Pending restaurant approvals"
        description="Review imported restaurant listings before activating them publicly."
        right={
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />

      <div className="mt-6 grid gap-4">
        {pending.length ? (
          pending.map((r) => (
            <Card key={r.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="truncate">{r.name}</CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate">{addressLine(r.address)}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>Slug: {r.slug}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="secondary">Pending</Badge>
                    <span className="text-muted-foreground">
                      Submitted {format(new Date(r.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>

                <div className="text-right text-sm text-muted-foreground">
                  <div className="font-medium text-foreground">{ownerNameById.get(r.owner_id) ?? "—"}</div>
                  <div className="truncate">{ownerEmailById.get(r.owner_id) ?? "—"}</div>
                </div>
              </CardHeader>

              <CardContent className="grid gap-4">
                {r.description ? <p className="text-sm text-muted-foreground">{r.description}</p> : null}

                <div className="grid gap-2 text-sm">
                  {r.phone ? (
                    <div>
                      <span className="text-muted-foreground">Phone:</span> <span className="font-medium">{r.phone}</span>
                    </div>
                  ) : null}
                  {r.website ? (
                    <div>
                      <span className="text-muted-foreground">Website:</span>{" "}
                      <a className="font-medium text-primary hover:underline" href={r.website} target="_blank" rel="noreferrer">
                        {r.website}
                      </a>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <form action={`/admin/restaurants/${r.id}/approve`} method="post">
                    <Button type="submit">Approve &amp; Activate</Button>
                  </form>

                  <Button asChild variant="outline">
                    <Link href={`/admin/restaurants/${r.id}/edit`}>Edit</Link>
                  </Button>

                  <form action={`/admin/restaurants/${r.id}/send-welcome`} method="post">
                    <Button type="submit" variant="secondary">
                      Send welcome email
                    </Button>
                  </form>

                  <form action={`/admin/restaurants/${r.id}/delete`} method="post">
                    <Button type="submit" variant="destructive">
                      Delete
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No pending restaurants</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              All imported restaurants are either active or none have been imported yet.
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  );
}

