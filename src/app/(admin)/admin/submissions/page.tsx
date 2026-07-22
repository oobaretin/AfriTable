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

type Submission = {
  id: string;
  name: string;
  city: string;
  state: string;
  cuisine_types: string[] | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  submitted_by_email: string | null;
  owner_invited: boolean;
  owner_invited_at: string | null;
  owner_email: string | null;
  status: "submitted" | "under_review" | "owner_invited" | "verified" | "approved" | "rejected";
  created_at: string;
};

type SubmissionEvent = {
  submission_id: string;
  event: string;
  created_at: string;
};

function labelForEvent(event: string): string {
  const map: Record<string, string> = {
    submitted: "Submitted",
    under_review: "Under review",
    owner_invited: "Owner invited",
    verified: "Verified",
    approved: "Approved",
    rejected: "Rejected",
  };
  return map[event] ?? event;
}

function labelForStatus(status: Submission["status"]) {
  if (status === "submitted") return { label: "Submitted", variant: "secondary" as const };
  if (status === "under_review") return { label: "Under review", variant: "default" as const };
  if (status === "owner_invited") return { label: "Owner invited", variant: "default" as const };
  if (status === "verified") return { label: "Verified", variant: "default" as const };
  if (status === "approved") return { label: "Approved", variant: "default" as const };
  return { label: "Rejected", variant: "destructive" as const };
}

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  // Admin only (middleware should also handle)
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  const user = auth.user;
  if (!user) redirect("/login?redirectTo=/admin/submissions");
  const { data: profile } = await supabaseSSR.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  const statusFromQuery = (searchParams.status ?? "submitted") as Submission["status"];
  const allowed = new Set(["submitted", "under_review", "owner_invited", "verified", "approved", "rejected"]);
  const statusFilter = allowed.has(statusFromQuery) ? statusFromQuery : "submitted";

  const supabaseAdmin = createSupabaseAdminClient();
  const { data } = await supabaseAdmin
    .from("restaurant_submissions")
    .select(
      "id,name,city,state,cuisine_types,address,phone,website,notes,submitted_by_email,owner_invited,owner_invited_at,owner_email,status,created_at",
    )
    .eq("status", statusFilter)
    .order("created_at", { ascending: false })
    .limit(200);

  const submissions = (data ?? []) as Submission[];

  const eventsBySubmissionId = new Map<string, SubmissionEvent[]>();
  if (submissions.length) {
    const ids = submissions.map((s) => s.id);
    const { data: events } = await supabaseAdmin
      .from("submission_events")
      .select("submission_id,event,created_at")
      .in("submission_id", ids)
      .order("created_at", { ascending: true });

    for (const e of (events ?? []) as any[]) {
      const sid = String(e.submission_id);
      const arr = eventsBySubmissionId.get(sid) ?? [];
      arr.push({ submission_id: sid, event: String(e.event), created_at: String(e.created_at) });
      eventsBySubmissionId.set(sid, arr);
    }
  }

  return (
    <Container className="py-10 md:py-14">
      <PageHeader
        title="Community submissions"
        description="Restaurants submitted by the community for admin review."
        right={
          <Button asChild variant="outline">
            <Link href="/admin/pending-restaurants">Pending approvals</Link>
          </Button>
        }
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {(["submitted", "under_review", "owner_invited", "verified", "approved", "rejected"] as const).map((s) => (
          <Button key={s} asChild variant={s === statusFilter ? "default" : "outline"} size="sm">
            <Link href={`/admin/submissions?status=${encodeURIComponent(s)}`}>{s}</Link>
          </Button>
        ))}
      </div>

      <div className="mt-6 grid gap-4">
        {submissions.length ? (
          submissions.map((sub) => {
            const meta = labelForStatus(sub.status);
            return (
              <Card key={sub.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{sub.name}</CardTitle>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {sub.city}, {sub.state}
                      </span>
                      {sub.cuisine_types?.length ? (
                        <>
                          <span className="text-muted-foreground/50">•</span>
                          <span className="truncate">{sub.cuisine_types.join(", ")}</span>
                        </>
                      ) : null}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Submitted {format(new Date(sub.created_at), "MMM d, yyyy")}
                      {sub.submitted_by_email ? ` • ${sub.submitted_by_email}` : ""}
                    </div>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  {sub.address ? (
                    <div>
                      <span className="text-muted-foreground">Address:</span> <span className="font-medium">{sub.address}</span>
                    </div>
                  ) : null}
                  {sub.phone ? (
                    <div>
                      <span className="text-muted-foreground">Phone:</span> <span className="font-medium">{sub.phone}</span>
                    </div>
                  ) : null}
                  {sub.website ? (
                    <div>
                      <span className="text-muted-foreground">Website:</span>{" "}
                      <a className="font-medium text-primary hover:underline" href={sub.website} target="_blank" rel="noreferrer">
                        {sub.website}
                      </a>
                    </div>
                  ) : null}
                  {sub.notes ? <div className="text-muted-foreground">{sub.notes}</div> : null}

                  {sub.status === "submitted" ? (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <form action={`/admin/submissions/${sub.id}/invite-owner`} method="post">
                        <Button type="submit" variant="secondary" disabled={sub.owner_invited}>
                          {sub.owner_invited ? "Owner Invited" : "Invite Owner"}
                        </Button>
                      </form>
                      <form action={`/admin/submissions/restaurants/${sub.id}/convert`} method="post">
                        <Button type="submit">Convert to draft listing</Button>
                      </form>
                      <form action={`/admin/submissions/restaurants/${sub.id}/reject`} method="post">
                        <Button type="submit" variant="destructive">
                          Reject
                        </Button>
                      </form>
                    </div>
                  ) : sub.status === "under_review" || sub.status === "owner_invited" ? (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <form action={`/admin/submissions/restaurants/${sub.id}/verify`} method="post">
                        <Button type="submit">Mark verified</Button>
                      </form>
                      <form action={`/admin/submissions/restaurants/${sub.id}/reject`} method="post">
                        <Button type="submit" variant="destructive">
                          Reject
                        </Button>
                      </form>
                    </div>
                  ) : sub.status === "verified" ? (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <form action={`/admin/submissions/restaurants/${sub.id}/approve`} method="post">
                        <Button type="submit">Approve</Button>
                      </form>
                      <form action={`/admin/submissions/restaurants/${sub.id}/reject`} method="post">
                        <Button type="submit" variant="destructive">
                          Reject
                        </Button>
                      </form>
                    </div>
                  ) : null}

                  {/* Timeline */}
                  {eventsBySubmissionId.get(sub.id)?.length ? (
                    <div className="pt-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Submission timeline</div>
                      <div className="mt-2 grid gap-1 text-sm">
                        {eventsBySubmissionId.get(sub.id)!.slice(-10).map((e, idx) => (
                          <div key={`${e.event}-${e.created_at}-${idx}`} className="flex items-center justify-between gap-4">
                            <span>• {labelForEvent(e.event)}</span>
                            <span className="text-muted-foreground">{format(new Date(e.created_at), "MMM d, yyyy")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No submissions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Nothing in this status right now.</CardContent>
          </Card>
        )}
      </div>
    </Container>
  );
}

