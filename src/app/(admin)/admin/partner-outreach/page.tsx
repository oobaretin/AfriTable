import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { PartnerOutreachCard } from "@/components/admin/PartnerOutreachPanel";
import {
  buildPartnerOutreachEmail,
  getPartnerOutreachByMetro,
  listPartnerOutreachMetros,
  metroLabel,
} from "@/lib/partner-outreach";

export const metadata = {
  title: "Partner outreach",
};

const DEFAULT_METRO = "houston";

export default async function AdminPartnerOutreachPage({
  searchParams,
}: {
  searchParams?: { metro?: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?redirectTo=/admin/partner-outreach");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  const metros = listPartnerOutreachMetros();
  const metroParam = searchParams?.metro?.trim().toLowerCase();
  const metro = metros.includes(metroParam ?? "") ? metroParam! : DEFAULT_METRO;

  const senderName =
    profile.full_name ??
    (typeof auth.user.user_metadata?.name === "string" ? auth.user.user_metadata.name : null) ??
    "AfriTable Partnerships";

  const candidates = getPartnerOutreachByMetro(metro).sort((a, b) => {
    const emailA = buildPartnerOutreachEmail(a, senderName);
    const emailB = buildPartnerOutreachEmail(b, senderName);
    if (emailA.sendOrder !== emailB.sendOrder) return emailA.sendOrder - emailB.sendOrder;
    return b.rating - a.rating;
  });

  return (
    <Container className="py-10 md:py-14">
      <PageHeader
        title="Partner outreach"
        description="Send-ready claim invites for vetted, unclaimed listings. Regenerate candidates with npm run partner:outreach."
        right={
          <Button asChild variant="outline">
            <Link href="/admin">Back to admin</Link>
          </Button>
        }
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {metros.map((m) => (
          <Button key={m} asChild variant={m === metro ? "default" : "outline"} size="sm">
            <Link href={`/admin/partner-outreach?metro=${encodeURIComponent(m)}`}>{metroLabel(m)}</Link>
          </Button>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {candidates.length} candidate{candidates.length === 1 ? "" : "s"} in {metroLabel(metro)}. Emails sign as{" "}
        <span className="font-medium text-foreground">{senderName}</span>.
      </p>

      <div className="mt-6 grid gap-4">
        {candidates.length ? (
          candidates.map((candidate, index) => {
            const email = buildPartnerOutreachEmail(candidate, senderName);
            const sendOrder = email.sendOrder < 99 ? email.sendOrder : index + 1;
            return (
              <PartnerOutreachCard
                key={candidate.slug}
                candidate={candidate}
                email={email}
                sendOrder={sendOrder}
              />
            );
          })
        ) : (
          <p className="rounded-lg border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            No candidates for this metro. Run <code className="text-xs">npm run partner:outreach</code> to refresh.
          </p>
        )}
      </div>
    </Container>
  );
}
