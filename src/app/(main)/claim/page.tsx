import "server-only";

import crypto from "crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export default async function ClaimViaTokenPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = (searchParams.token ?? "").trim();
  if (!token) redirect("/restaurant-signup");

  const tokenHash = hashToken(token);

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: submission } = await supabaseAdmin
    .from("restaurant_submissions")
    .select("id,name,city,state,status,owner_invite_token_expires_at,owner_invite_token_used_at")
    .eq("owner_invite_token_hash", tokenHash)
    .maybeSingle();

  const expired =
    submission?.owner_invite_token_expires_at
      ? new Date(submission.owner_invite_token_expires_at).getTime() < Date.now()
      : true;
  const used = Boolean(submission?.owner_invite_token_used_at);

  if (!submission || expired || used) {
    return (
      <Container className="py-12 md:py-16">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Claim link unavailable</CardTitle>
              <CardDescription>This claim link is invalid, expired, or already used.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild>
                <Link href="/restaurant-signup">Create an owner account</Link>
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const prefill = new URLSearchParams({
    from: "submission_invite",
    submissionId: submission.id,
    name: submission.name,
    city: submission.city,
    state: submission.state,
    token,
  }).toString();

  return (
    <Container className="py-12 md:py-16">
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Claim your restaurant</CardTitle>
            <CardDescription>Finish creating your owner account to manage your listing.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-md border bg-muted/40 p-4 text-sm">
              <div className="font-medium">{submission.name}</div>
              <div className="mt-1 text-muted-foreground">
                {submission.city}, {submission.state}
              </div>
              <div className="mt-2">
                <Badge variant="secondary">{submission.status}</Badge>
              </div>
            </div>

            <Button asChild>
              <a href={`${appUrl}/restaurant-signup?${prefill}`}>Continue to owner signup</a>
            </Button>
            <div className="text-center text-xs text-muted-foreground">
              If you didn’t request this, you can safely ignore it.
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

