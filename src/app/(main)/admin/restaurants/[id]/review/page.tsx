import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoUploader } from "@/components/admin/PhotoUploader";
import { Button } from "@/components/ui/button";
import { Checklist } from "@/components/admin/Checklist";
import { RestaurantDetails } from "@/components/admin/RestaurantDetails";

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

  const images = ((restaurant as any).images ?? []) as string[];
  const verification = ((restaurant as any).verification ?? {}) as Record<string, unknown>;

  const allVerified =
    Boolean(verification.name) &&
    Boolean(verification.address) &&
    Boolean(verification.phone) &&
    Boolean(verification.hours) &&
    Boolean(verification.photos) &&
    Boolean(verification.description);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:py-14 space-y-6">
      <PageHeader
        title={
          <>
            Review: <span className="text-primary">{(restaurant as any).name}</span>
          </>
        }
        description="Verify the listing, add photos, then approve."
        right={
          <Link className="text-sm text-primary hover:underline" href="/admin/pending-restaurants">
            Back
          </Link>
        }
      />

      {/* Checklist */}
      <Checklist restaurantId={(restaurant as any).id} verification={verification as any} />

      {/* RestaurantDetails */}
      <RestaurantDetails restaurant={restaurant} />

      {/* Photo uploader */}
      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoUploader restaurantId={(restaurant as any).id} initialImages={images} />
        </CardContent>
      </Card>

      {/* Approval actions */}
      <Card>
        <CardHeader>
          <CardTitle>Approval actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <form action={`/admin/restaurants/${(restaurant as any).id}/approve`} method="post">
            <Button type="submit" disabled={!allVerified}>
              Approve &amp; Activate
            </Button>
          </form>
          <form action={`/admin/restaurants/${(restaurant as any).id}/send-welcome`} method="post">
            <Button type="submit" variant="secondary">
              Send welcome email
            </Button>
          </form>
          <Button asChild variant="outline">
            <Link href={`/admin/restaurants/${(restaurant as any).id}/edit`}>Edit</Link>
          </Button>
          <form action={`/admin/restaurants/${(restaurant as any).id}/delete`} method="post">
            <Button type="submit" variant="destructive">
              Delete
            </Button>
          </form>
          {!allVerified ? (
            <div className="w-full text-xs text-muted-foreground">Complete the checklist to enable approval.</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

