import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default async function ClaimRestaurantPage({ params }: { params: { slug: string } }) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("id,name,slug,is_active,is_claimed,claimed_by,claimed_at,owner_id,address,phone,website")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!restaurant) redirect("/restaurants");

  const addr = (restaurant as any).address;
  const addressLine = addr ? [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(", ") : "—";

  return (
    <Container className="py-10 md:py-14">
      <PageHeader
        title="Claim your restaurant"
        description="Verify that you own this restaurant to manage bookings, photos, and hours."
        right={
          <Button asChild variant="outline">
            <Link href={`/restaurants/${encodeURIComponent(params.slug)}`}>Back to restaurant</Link>
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span className="truncate">{(restaurant as any).name}</span>
              {(restaurant as any).is_claimed ? <Badge>Claimed</Badge> : <Badge variant="secondary">Unclaimed</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground">
            <div>
              <span className="text-muted-foreground">Address:</span>{" "}
              <span className="text-foreground">{addressLine}</span>
            </div>
            {(restaurant as any).phone ? (
              <div>
                <span className="text-muted-foreground">Phone:</span>{" "}
                <span className="text-foreground">{(restaurant as any).phone}</span>
              </div>
            ) : null}
            {(restaurant as any).website ? (
              <div>
                <span className="text-muted-foreground">Website:</span>{" "}
                <a className="text-primary hover:underline" href={(restaurant as any).website} target="_blank" rel="noreferrer">
                  {(restaurant as any).website}
                </a>
              </div>
            ) : null}
            <div>
              <span className="text-muted-foreground">Status:</span>{" "}
              <span className="text-foreground">{(restaurant as any).is_active ? "Active" : "Pending approval"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submit a claim</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {(restaurant as any).is_claimed ? (
              <>
                <div className="text-sm text-muted-foreground">
                  This listing has already been claimed. If this is your business, contact support to verify ownership.
                </div>
                <Button asChild variant="outline">
                  <a href="mailto:support@afritable.com">Contact support</a>
                </Button>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  Submit your ownership details. Our team will review and reach out if we need more info.
                </div>

                <form action={`/restaurant/${encodeURIComponent(params.slug)}/claim/submit`} method="post" className="grid gap-3">
                  <Input name="full_name" placeholder="Your full name" required />
                  <Input name="email" type="email" placeholder="Business email" required />
                  <Input name="phone" placeholder="Business phone" required />
                  <Textarea
                    name="proof"
                    placeholder="Proof of ownership (website, utility bill, Instagram, etc.)"
                    className="min-h-[110px]"
                  />

                  <Button type="submit" className="w-full">
                    Submit Claim
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

