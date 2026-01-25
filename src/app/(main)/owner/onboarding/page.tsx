import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ClaimedRestaurant = {
  id: string;
  name: string;
  slug: string;
  is_claimed: boolean;
  claimed_at: string | null;
  is_active: boolean;
  created_at: string;
};

function stepBadge(done: boolean) {
  return done ? <Badge>Done</Badge> : <Badge variant="secondary">To do</Badge>;
}

export default async function OwnerOnboardingPage() {
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  const user = auth.user;
  if (!user) redirect("/login?redirectTo=/owner/onboarding");

  const { data: profile } = await supabaseSSR
    .from("profiles")
    .select("role,has_reset_password,full_name")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role;
  if (!role || (role !== "pending_owner" && role !== "restaurant_owner" && role !== "admin")) redirect("/");

  // Use admin client to look up the claimed listing (inactive listings are hidden by RLS).
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: claimed } = await supabaseAdmin
    .from("restaurants")
    .select("id,name,slug,is_claimed,claimed_at,is_active,created_at")
    .eq("claimed_by", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const restaurant = (claimed ?? null) as ClaimedRestaurant | null;

  const hasPassword = Boolean(profile?.has_reset_password);
  const isClaimed = Boolean(restaurant?.is_claimed);
  const isApproved = Boolean(restaurant?.is_active);

  return (
    <Container className="py-10 md:py-14">
      <PageHeader
        title="Owner onboarding"
        description="Complete these steps to manage your restaurant on AfriTable."
        right={
          role === "restaurant_owner" ? (
            <Button asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/">Back home</Link>
            </Button>
          )
        }
      />

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>1) Set your password</span>
              {stepBadge(hasPassword)}
            </CardTitle>
            <CardDescription>Secure your account so you can sign in anytime.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <div>
              Account: <span className="font-medium text-foreground">{profile?.full_name ?? user.email ?? user.id}</span>
            </div>
            {!hasPassword ? (
              <>
                <div>Use the password setup link emailed to you after claiming.</div>
                <Button asChild>
                  <Link href="/reset-password">Set password</Link>
                </Button>
              </>
            ) : (
              <div>You’ve set your password.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>2) Claim status</span>
              {stepBadge(isClaimed)}
            </CardTitle>
            <CardDescription>We connect your account to your restaurant listing.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            {restaurant ? (
              <>
                <div className="rounded-md border bg-muted/40 p-3">
                  <div className="font-medium text-foreground">{restaurant.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Slug: {restaurant.slug}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={restaurant.is_claimed ? "default" : "secondary"}>
                      {restaurant.is_claimed ? "Claimed" : "Unclaimed"}
                    </Badge>
                    <Badge variant={restaurant.is_active ? "default" : "secondary"}>
                      {restaurant.is_active ? "Active" : "Pending approval"}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {restaurant.claimed_at ? `Claimed ${format(new Date(restaurant.claimed_at), "MMM d, yyyy")}` : null}
                  </div>
                </div>
                <Button asChild variant="outline">
                  <Link href={`/restaurants/${encodeURIComponent(restaurant.slug)}`}>View listing</Link>
                </Button>
              </>
            ) : (
              <>
                <div>No claimed restaurant found for this account yet.</div>
                <Button asChild variant="outline">
                  <Link href="/admin/submissions">Contact support/admin</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>3) Approval</span>
              {stepBadge(isApproved && role === "restaurant_owner")}
            </CardTitle>
            <CardDescription>Admin verifies the listing before it goes live.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            {restaurant ? (
              isApproved ? (
                <>
                  <div>Your restaurant is approved and live.</div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild>
                      <Link href="/dashboard">Open dashboard</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/restaurants/${encodeURIComponent(restaurant.slug)}`}>View public page</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div>
                  Your listing is pending approval. Once approved, you’ll get access to the owner dashboard.
                </div>
              )
            ) : (
              <div>Approve step will appear once a listing is connected to your account.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

