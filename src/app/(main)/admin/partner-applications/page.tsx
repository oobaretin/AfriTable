import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PartnerApplication = {
  id: string;
  business_name: string;
  cuisine_type: string;
  contact_name: string;
  email: string;
  phone: string;
  status: "submitted" | "under_review" | "invited" | "approved" | "rejected";
  invited_at: string | null;
  created_at: string;
};

function labelForStatus(status: PartnerApplication["status"]) {
  const map = {
    submitted: { label: "Submitted", variant: "secondary" as const },
    under_review: { label: "Under review", variant: "default" as const },
    invited: { label: "Invited", variant: "default" as const },
    approved: { label: "Approved", variant: "default" as const },
    rejected: { label: "Rejected", variant: "destructive" as const },
  };
  return map[status];
}

export default async function AdminPartnerApplicationsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  const user = auth.user;
  if (!user) redirect("/login?redirectTo=/admin/partner-applications");
  const { data: profile } = await supabaseSSR.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  const allowed = new Set(["submitted", "under_review", "invited", "approved", "rejected"]);
  const statusFilter = allowed.has(searchParams.status ?? "")
    ? (searchParams.status as PartnerApplication["status"])
    : "submitted";

  const supabaseAdmin = createSupabaseAdminClient();
  const { data } = await supabaseAdmin
    .from("partner_applications")
    .select("id,business_name,cuisine_type,contact_name,email,phone,status,invited_at,created_at")
    .eq("status", statusFilter)
    .order("created_at", { ascending: false })
    .limit(200);

  const applications = (data ?? []) as PartnerApplication[];

  return (
    <Container className="py-10 md:py-14">
      <PageHeader
        title="Partner applications"
        description="Restaurant owners who applied via Join as a partner."
        right={
          <Button asChild variant="outline">
            <Link href="/admin">Admin home</Link>
          </Button>
        }
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {(["submitted", "under_review", "invited", "approved", "rejected"] as const).map((s) => (
          <Button key={s} asChild variant={s === statusFilter ? "default" : "outline"} size="sm">
            <Link href={`/admin/partner-applications?status=${encodeURIComponent(s)}`}>{s.replace("_", " ")}</Link>
          </Button>
        ))}
      </div>

      <div className="mt-6 grid gap-4">
        {applications.length ? (
          applications.map((app) => {
            const meta = labelForStatus(app.status);
            return (
              <Card key={app.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{app.business_name}</CardTitle>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {app.cuisine_type} • {app.contact_name}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {app.email} • {app.phone}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Applied {format(new Date(app.created_at), "MMM d, yyyy")}
                      {app.invited_at ? ` • Invited ${format(new Date(app.invited_at), "MMM d, yyyy")}` : ""}
                    </div>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {app.status === "submitted" || app.status === "under_review" ? (
                    <>
                      <form action={`/admin/partner-applications/${app.id}/review`} method="post">
                        <Button type="submit" variant="outline" size="sm">
                          Mark under review
                        </Button>
                      </form>
                      <form action={`/admin/partner-applications/${app.id}/invite`} method="post">
                        <Button type="submit" size="sm">
                          Send onboarding invite
                        </Button>
                      </form>
                      <form action={`/admin/partner-applications/${app.id}/reject`} method="post">
                        <Button type="submit" variant="destructive" size="sm">
                          Reject
                        </Button>
                      </form>
                    </>
                  ) : null}
                  {app.status === "invited" ? (
                    <form action={`/admin/partner-applications/${app.id}/invite`} method="post">
                      <Button type="submit" variant="outline" size="sm">
                        Resend invite
                      </Button>
                    </form>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No applications in this status.
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  );
}
