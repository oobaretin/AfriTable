import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getRestaurantByIdFromJSON } from "@/lib/restaurant-json-loader-server";
import { buildQueueSummary, buildTableRequestAssist } from "@/lib/admin/table-request-assist";
import { TableRequestAssistPanel } from "@/components/admin/TableRequestAssistPanel";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = {
  title: "Table requests",
};

type TableRequestStatus = "pending" | "forwarded" | "cancelled";

type TableRequest = {
  id: string;
  restaurant_slug: string;
  restaurant_name: string;
  restaurant_id: string | null;
  preferred_date: string | null;
  time_preference: string;
  party_size: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  special_requests: string | null;
  notify_when_live: boolean;
  status: TableRequestStatus;
  created_at: string;
};

const TIME_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  flexible: "Flexible",
};

const STATUS_FILTERS = ["all", "pending", "forwarded", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function referenceCode(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function labelForStatus(status: TableRequestStatus) {
  const map = {
    pending: { label: "Awaiting your call", variant: "destructive" as const },
    forwarded: { label: "Done — you called", variant: "default" as const },
    cancelled: { label: "Cancelled", variant: "outline" as const },
  };
  return map[status];
}

function formatPreferredVisit(request: TableRequest): string {
  const dateLabel = request.preferred_date
    ? format(parseISO(request.preferred_date), "MMM d, yyyy")
    : "Date TBD";
  const timeLabel = TIME_LABELS[request.time_preference] ?? request.time_preference;
  return `${dateLabel} · ${timeLabel} · ${request.party_size} guests`;
}

type RestaurantContact = {
  phone: string | null;
  website: string | null;
  instagram: string | null;
};

async function loadRestaurantContacts(
  requests: TableRequest[],
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
): Promise<Map<string, RestaurantContact>> {
  const contacts = new Map<string, RestaurantContact>();

  for (const request of requests) {
    if (contacts.has(request.restaurant_slug)) continue;
    const json = getRestaurantByIdFromJSON(request.restaurant_slug);
    contacts.set(request.restaurant_slug, {
      phone: json?.phone?.trim() || null,
      website: json?.website?.trim() || null,
      instagram: json?.social?.instagram?.trim() || null,
    });
  }

  const dbIds = [...new Set(requests.map((r) => r.restaurant_id).filter(Boolean))] as string[];
  if (dbIds.length) {
    const { data: rows } = await supabaseAdmin.from("restaurants").select("id,slug,phone,website").in("id", dbIds);
    for (const row of rows ?? []) {
      const slug = row.slug;
      if (!slug) continue;
      const existing = contacts.get(slug) ?? { phone: null, website: null, instagram: null };
      contacts.set(slug, {
        phone: existing.phone || row.phone?.trim() || null,
        website: existing.website || row.website?.trim() || null,
        instagram: existing.instagram,
      });
    }
  }

  return contacts;
}

export default async function AdminTableRequestsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  if (!auth.user) redirect("/login?redirectTo=/admin/table-requests");
  const { data: profile } = await supabaseSSR.from("profiles").select("role").eq("id", auth.user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  const statusFilter: StatusFilter =
    searchParams.status === "all"
      ? "all"
      : STATUS_FILTERS.includes(searchParams.status as StatusFilter)
        ? (searchParams.status as StatusFilter)
        : "pending";

  const supabaseAdmin = createSupabaseAdminClient();
  let query = supabaseAdmin
    .from("table_requests")
    .select(
      "id,restaurant_slug,restaurant_name,restaurant_id,preferred_date,time_preference,party_size,guest_name,guest_email,guest_phone,special_requests,notify_when_live,status,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[admin/table-requests] query failed:", error);
  }

  const requests = (data ?? []) as TableRequest[];
  const restaurantContacts = await loadRestaurantContacts(requests, supabaseAdmin);

  const { count: pendingCount } = await supabaseAdmin
    .from("table_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const pendingForSummary =
    statusFilter === "pending"
      ? [...requests].reverse()
      : (
          await supabaseAdmin
            .from("table_requests")
            .select("restaurant_name,preferred_date,time_preference,party_size,created_at")
            .eq("status", "pending")
            .order("created_at", { ascending: true })
            .limit(50)
        ).data ?? [];

  const queueSummary = buildQueueSummary(
    pendingForSummary.map((r) => ({
      restaurantName: r.restaurant_name,
      preferredDate: r.preferred_date,
      timePreference: r.time_preference,
      partySize: r.party_size,
      createdAt: r.created_at,
    })),
  );

  return (
    <Container className="py-10 md:py-14">
      <PageHeader
        title="Table requests"
        description="AfriTable does not call restaurants for you. Call them, then mark the request done."
        right={
          <Button asChild variant="outline">
            <Link href="/admin">Admin home</Link>
          </Button>
        }
      />

      <Card className="mt-4 border-amber-200 bg-amber-50/80">
        <CardContent className="py-4 text-sm text-amber-950">
          <p className="font-medium">Your workflow</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-amber-900/90">
            <li>
              <strong>Call restaurant</strong> with the guest&apos;s preferred date, time window, and party size.
            </li>
            <li>
              <strong>Only after the call</strong>, click <strong>I called — mark done</strong>.
            </li>
            <li>New requests start as <strong>Awaiting your call</strong> — not auto-sent to anyone.</li>
          </ol>
        </CardContent>
      </Card>

      {queueSummary ? (
        <Card className="mt-4 border-blue-200 bg-blue-50/60">
          <CardContent className="py-3 text-sm text-blue-950">{queueSummary}</CardContent>
        </Card>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <Button key={s} asChild variant={s === statusFilter ? "default" : "outline"} size="sm">
            <Link
              href={
                s === "pending"
                  ? "/admin/table-requests"
                  : s === "all"
                    ? "/admin/table-requests?status=all"
                    : `/admin/table-requests?status=${s}`
              }
            >
              {s === "all"
                ? "All"
                : s === "pending"
                  ? "Awaiting call"
                  : s === "forwarded"
                    ? "Done"
                    : "Cancelled"}
            </Link>
          </Button>
        ))}
        {typeof pendingCount === "number" && pendingCount > 0 ? (
          <Badge variant="destructive">{pendingCount} awaiting call</Badge>
        ) : null}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">
            {requests.length} request{requests.length === 1 ? "" : "s"}
            {statusFilter !== "all" ? ` (${statusFilter})` : ""}
          </CardTitle>
          <CardDescription>Newest first · showing up to 200 rows</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {requests.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Preferred visit</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const statusMeta = labelForStatus(request.status);
                  const contact = restaurantContacts.get(request.restaurant_slug);
                  const restaurantPhone = contact?.phone ?? null;
                  const restaurantWebsite = contact?.website ?? null;
                  const assist = buildTableRequestAssist({
                    referenceCode: referenceCode(request.id),
                    restaurantName: request.restaurant_name,
                    guestName: request.guest_name,
                    guestEmail: request.guest_email,
                    guestPhone: request.guest_phone,
                    preferredDate: request.preferred_date,
                    timePreference: request.time_preference,
                    partySize: request.party_size,
                    specialRequests: request.special_requests,
                    phone: restaurantPhone,
                    website: restaurantWebsite,
                    instagram: contact?.instagram ?? null,
                  });
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="whitespace-nowrap align-top">
                        <div className="font-medium">{format(new Date(request.created_at), "MMM d, yyyy")}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(request.created_at), "h:mm a")}
                        </div>
                        <div className="mt-1 font-mono text-xs text-muted-foreground">{referenceCode(request.id)}</div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="font-medium">{request.restaurant_name}</div>
                        <div className="text-xs text-muted-foreground">{request.restaurant_slug}</div>
                        {restaurantPhone ? (
                          <div className="mt-1 text-xs">
                            <a className="font-medium text-primary hover:underline" href={`tel:${restaurantPhone}`}>
                              {restaurantPhone}
                            </a>
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-muted-foreground">No phone on file</div>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <div>{formatPreferredVisit(request)}</div>
                        {request.special_requests ? (
                          <div className="mt-1 max-w-xs text-xs text-muted-foreground line-clamp-2">
                            {request.special_requests}
                          </div>
                        ) : null}
                        {request.notify_when_live ? (
                          <Badge variant="outline" className="mt-2 text-xs">
                            Notify when live
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="font-medium">{request.guest_name}</div>
                        <div className="text-xs">
                          <a className="text-primary hover:underline" href={`mailto:${request.guest_email}`}>
                            {request.guest_email}
                          </a>
                        </div>
                        <div className="text-xs">
                          <a className="text-primary hover:underline" href={`tel:${request.guest_phone}`}>
                            {request.guest_phone}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <div className="flex flex-col items-end gap-2">
                          <TableRequestAssistPanel
                            restaurantName={request.restaurant_name}
                            guestEmail={request.guest_email}
                            assist={assist}
                          />
                          {restaurantPhone ? (
                            <Button asChild size="sm">
                              <a href={`tel:${restaurantPhone}`}>Call restaurant</a>
                            </Button>
                          ) : null}
                          {restaurantWebsite ? (
                            <Button asChild size="sm" variant="outline">
                              <a href={restaurantWebsite} target="_blank" rel="noreferrer">
                                Website
                              </a>
                            </Button>
                          ) : null}
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/restaurants/${encodeURIComponent(request.restaurant_slug)}`} target="_blank">
                              View listing
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost">
                            <a href={`mailto:${request.guest_email}`}>Email guest</a>
                          </Button>
                          {request.status === "pending" ? (
                            <>
                              <form action={`/admin/table-requests/${request.id}/forward`} method="post">
                                <Button type="submit" size="sm" variant="secondary">
                                  I called — mark done
                                </Button>
                              </form>
                              <form action={`/admin/table-requests/${request.id}/cancel`} method="post">
                                <Button type="submit" size="sm" variant="outline">
                                  Cancel
                                </Button>
                              </form>
                            </>
                          ) : request.status === "forwarded" ? (
                            <form action={`/admin/table-requests/${request.id}/reopen`} method="post">
                              <Button type="submit" size="sm" variant="outline">
                                Reopen (still need to call)
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No table requests{statusFilter !== "all" ? ` with status “${statusFilter}”` : ""} yet.
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
