import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hashInviteToken } from "@/lib/auth/invite-token";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function PartnerInvitePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = (searchParams.token ?? "").trim();
  if (!token) redirect("/join-as-restaurant");

  const tokenHash = hashInviteToken(token);
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: application } = await supabaseAdmin
    .from("partner_applications")
    .select("id,business_name,cuisine_type,contact_name,email,phone,status,owner_invite_token_expires_at,owner_invite_token_used_at")
    .eq("owner_invite_token_hash", tokenHash)
    .maybeSingle();

  const expired =
    application?.owner_invite_token_expires_at
      ? new Date(application.owner_invite_token_expires_at).getTime() < Date.now()
      : true;
  const used = Boolean(application?.owner_invite_token_used_at);
  const valid = application && !expired && !used && (application.status === "invited" || application.status === "approved");

  if (!valid) {
    return (
      <Container className="py-12 md:py-16">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Invite link unavailable</CardTitle>
              <CardDescription>This onboarding link is invalid, expired, or already used.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild>
                <Link href="/join-as-restaurant">Apply to partner</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Back to home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  const prefill = new URLSearchParams({
    from: "partner_application",
    applicationId: application.id,
    token,
    name: application.business_name,
    email: application.email,
    contactName: application.contact_name,
    phone: application.phone,
    cuisine: application.cuisine_type,
  }).toString();

  return (
    <Container className="py-12 md:py-16">
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to AfriTable</CardTitle>
            <CardDescription>Your partner application was approved. Create your owner account to finish onboarding.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-md border bg-muted/40 p-4 text-sm">
              <div className="font-medium">{application.business_name}</div>
              <div className="mt-1 text-muted-foreground">{application.cuisine_type}</div>
              <div className="mt-2">
                <Badge variant="secondary">Approved partner</Badge>
              </div>
            </div>
            <Button asChild>
              <Link href={`/restaurant-signup?${prefill}`}>Continue to owner signup</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
