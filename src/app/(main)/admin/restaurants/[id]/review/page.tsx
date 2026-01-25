import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { PhotoUploader } from "@/components/admin/PhotoUploader";
import { Checklist } from "@/components/admin/Checklist";
import { RestaurantDetails } from "@/components/admin/RestaurantDetails";
import { ApprovalActions } from "@/components/admin/ApprovalActions";

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
      <PhotoUploader restaurantId={(restaurant as any).id} initialImages={images} />

      {/* Approval actions */}
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold">Approval actions</h2>
        <ApprovalActions restaurantId={(restaurant as any).id} canApprove={allVerified} />
        {!allVerified ? <div className="text-xs text-muted-foreground">Complete the checklist to enable approval.</div> : null}
      </div>
    </div>
  );
}

