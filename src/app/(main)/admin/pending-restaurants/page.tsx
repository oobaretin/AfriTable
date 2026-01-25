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

export default async function PendingRestaurantsAliasPage() {
  // Admin only (middleware should also handle)
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  const user = auth.user;
  if (!user) redirect("/login?redirectTo=/admin/pending-restaurants");

  const { data: profile } = await supabaseSSR.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: restaurants } = await supabaseAdmin
    .from("restaurants")
    .select("id,owner_id,name,slug,phone,website,address,description,is_active,created_at")
    .eq("is_active", false)
    .order("created_at", { ascending: false });

  const pending = (restaurants ?? []) as PendingRestaurant[];

  return (
    <Container className="py-10 md:py-14">
      <PageHeader
        title="Pending restaurants"
        description="Open a restaurant to review details and approve for public listing."
        right={
          <Button asChild variant="outline">
            <Link href="/admin/restaurants/pending">Old approvals view</Link>
          </Button>
        }
      />

      <div className="mt-6 grid gap-4">
        {pending.length ? (
          pending.map((r) => (
            <Card key={r.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="truncate">{r.name}</CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate">{addressLine(r.address)}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>Slug: {r.slug}</span>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <Badge variant="secondary">Pending</Badge>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Submitted {format(new Date(r.created_at), "MMM d, yyyy")}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={`/admin/restaurants/${r.id}/review`}>Review</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/admin/restaurants/${r.id}/edit`}>Edit</Link>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No pending restaurants</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Nothing to review right now.
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  );
}

