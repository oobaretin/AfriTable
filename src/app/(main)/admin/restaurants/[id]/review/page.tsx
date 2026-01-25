import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RestaurantReviewChecklist } from "@/components/admin/RestaurantReviewChecklist";

function addressLine(a: any): string {
  if (!a || typeof a !== "object") return "—";
  return [a.street, a.city, a.state, a.zip].filter(Boolean).join(", ") || "—";
}

export default async function AdminRestaurantReviewPage({ params }: { params: { id: string } }) {
  // Admin only (middleware should also handle)
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  const user = auth.user;
  if (!user) redirect("/login?redirectTo=/admin/pending-restaurants");
  const { data: profile } = await supabaseSSR.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select(
      "id,owner_id,name,slug,cuisine_types,price_range,phone,website,instagram_handle,facebook_url,address,description,images,hours,is_active,created_at,external_avg_rating,external_review_count,verification",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!restaurant) redirect("/admin/pending-restaurants");

  const owner = await supabaseAdmin.auth.admin.getUserById((restaurant as any).owner_id);
  const ownerEmail = owner.data?.user?.email ?? "—";

  const cuisines = ((restaurant as any).cuisine_types ?? []) as string[];
  const images = ((restaurant as any).images ?? []) as string[];
  const addr = (restaurant as any).address;
  const city = addr?.city ?? null;
  const verification = ((restaurant as any).verification ?? {}) as Record<string, unknown>;

  const items = [
    {
      id: "name",
      label: "Name looks correct",
      initialChecked: typeof verification.name === "boolean" ? (verification.name as boolean) : Boolean((restaurant as any).name),
    },
    {
      id: "address",
      label: "Address is complete",
      initialChecked:
        typeof verification.address === "boolean"
          ? (verification.address as boolean)
          : Boolean(addr?.street && addr?.city && addr?.state),
    },
    {
      id: "phone",
      label: "Phone number present",
      initialChecked: typeof verification.phone === "boolean" ? (verification.phone as boolean) : Boolean((restaurant as any).phone),
    },
    {
      id: "hours",
      label: "Operating hours set",
      initialChecked:
        typeof verification.hours === "boolean"
          ? (verification.hours as boolean)
          : Array.isArray((restaurant as any).hours) && (restaurant as any).hours.length > 0,
    },
    {
      id: "photos",
      label: "At least one photo provided",
      initialChecked: typeof verification.photos === "boolean" ? (verification.photos as boolean) : images.length > 0,
    },
    {
      id: "description",
      label: "Description looks good",
      initialChecked:
        typeof verification.description === "boolean"
          ? (verification.description as boolean)
          : Boolean((restaurant as any).description),
    },
  ];

  return (
    <Container className="py-10 md:py-14">
      <PageHeader
        title="Review restaurant"
        description="Verify listing details before approving."
        right={
          <Link className="text-sm text-primary hover:underline" href="/admin/pending-restaurants">
            Back to pending list
          </Link>
        }
      />

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <span>{(restaurant as any).name}</span>
              {(restaurant as any).is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Pending</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div className="grid gap-1">
              <div className="text-muted-foreground">Slug</div>
              <div className="font-medium">{(restaurant as any).slug}</div>
            </div>

            <div className="grid gap-1">
              <div className="text-muted-foreground">Location</div>
              <div className="font-medium">{addressLine(addr)}</div>
            </div>

            <div className="grid gap-1">
              <div className="text-muted-foreground">Owner email</div>
              <div className="font-medium">{ownerEmail}</div>
            </div>

            <div className="grid gap-1">
              <div className="text-muted-foreground">Cuisine</div>
              <div className="font-medium">{cuisines.length ? cuisines.join(" • ") : "—"}</div>
            </div>

            <div className="grid gap-1">
              <div className="text-muted-foreground">Price range</div>
              <div className="font-medium">{"$".repeat(Math.max(1, Math.min(4, (restaurant as any).price_range ?? 1)))}</div>
            </div>

            <div className="grid gap-1">
              <div className="text-muted-foreground">External rating</div>
              <div className="font-medium">
                {(restaurant as any).external_avg_rating != null
                  ? `${Number((restaurant as any).external_avg_rating).toFixed(1)}★ (${(restaurant as any).external_review_count ?? 0})`
                  : "—"}
              </div>
            </div>

            {(restaurant as any).description ? (
              <div className="grid gap-1">
                <div className="text-muted-foreground">Description</div>
                <div className="text-muted-foreground">{(restaurant as any).description}</div>
              </div>
            ) : null}

            <div className="grid gap-1">
              <div className="text-muted-foreground">Quick links</div>
              <div className="flex flex-wrap gap-3">
                <Link className="text-primary hover:underline" href={`/city/${encodeURIComponent(String(city ?? "city"))}`}>
                  City page
                </Link>
                <Link className="text-primary hover:underline" href={`/restaurants/${encodeURIComponent((restaurant as any).slug)}`}>
                  Restaurant page
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <RestaurantReviewChecklist restaurantId={(restaurant as any).id} restaurantSlug={(restaurant as any).slug} items={items} />
      </div>
    </Container>
  );
}

