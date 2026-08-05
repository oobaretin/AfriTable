import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PartnerOutreachCard } from "@/components/admin/PartnerOutreachPanel";
import { PartnerOutreachFilters } from "@/components/admin/PartnerOutreachFilters";
import {
  buildPartnerOutreachEmail,
  filterPartnerOutreachCandidates,
  loadPartnerOutreachCandidates,
  loadPartnerOutreachStateCounts,
  paginatePartnerOutreachCandidates,
  PARTNER_OUTREACH_PAGE_SIZE,
} from "@/lib/partner-outreach";
import {
  countByEffectiveStatus,
  effectiveOutreachStatus,
  loadPartnerOutreachStatusContext,
} from "@/lib/partner-outreach-status";
import {
  PARTNER_OUTREACH_STATUS_FILTERS,
  PARTNER_OUTREACH_STATUS_LABELS,
  type PartnerOutreachStatusValue,
} from "@/lib/partner-outreach-types";

export const metadata = {
  title: "Partner outreach",
};

function isStatusFilter(value: string | undefined): value is PartnerOutreachStatusValue | "all" {
  return PARTNER_OUTREACH_STATUS_FILTERS.includes(value as PartnerOutreachStatusValue | "all");
}

function buildOutreachHref(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== "all") {
      sp.set(key, String(value));
    }
  }
  const qs = sp.toString();
  return `/admin/partner-outreach${qs ? `?${qs}` : ""}`;
}

export default async function AdminPartnerOutreachPage({
  searchParams,
}: {
  searchParams?: {
    state?: string;
    status?: string;
    city?: string;
    q?: string;
    page?: string;
  };
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

  const stateFilter = searchParams?.state?.trim().toUpperCase() || "ALL";
  const statusFilter = isStatusFilter(searchParams?.status?.trim().toLowerCase())
    ? searchParams!.status!.trim().toLowerCase()
    : "all";
  const cityFilter = searchParams?.city?.trim() ?? "";
  const qFilter = searchParams?.q?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(searchParams?.page ?? "1", 10) || 1);

  const senderName =
    profile.full_name ??
    (typeof auth.user.user_metadata?.name === "string" ? auth.user.user_metadata.name : null) ??
    "AfriTable Partnerships";

  const allCandidates = loadPartnerOutreachCandidates();
  const stateCounts = loadPartnerOutreachStateCounts();
  const { statusBySlug, claimedSlugs } = await loadPartnerOutreachStatusContext();

  const locationFiltered = filterPartnerOutreachCandidates(allCandidates, {
    state: stateFilter,
    city: cityFilter,
    q: qFilter,
  });

  const statusFiltered =
    statusFilter === "all"
      ? locationFiltered
      : locationFiltered.filter(
          (c) =>
            effectiveOutreachStatus(c.slug, statusBySlug.get(c.slug), claimedSlugs) === statusFilter,
        );

  const sorted = [...statusFiltered].sort((a, b) => {
    const emailA = buildPartnerOutreachEmail(a, senderName);
    const emailB = buildPartnerOutreachEmail(b, senderName);
    if (emailA.sendOrder !== emailB.sendOrder) return emailA.sendOrder - emailB.sendOrder;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.name.localeCompare(b.name);
  });

  const { items: pageItems, total, pageCount } = paginatePartnerOutreachCandidates(
    sorted,
    page,
    PARTNER_OUTREACH_PAGE_SIZE,
  );

  const filterSlugs = locationFiltered.map((c) => c.slug);
  const statusCounts = countByEffectiveStatus(filterSlugs, statusBySlug, claimedSlugs);
  const nationwideCounts = countByEffectiveStatus(
    allCandidates.map((c) => c.slug),
    statusBySlug,
    claimedSlugs,
  );

  const baseParams = {
    state: stateFilter !== "ALL" ? stateFilter : undefined,
    city: cityFilter || undefined,
    q: qFilter || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  };

  return (
    <Container className="py-10 md:py-14">
      <PageHeader
        title="Partner outreach"
        description={`${allCandidates.length} vetted unclaimed listings nationwide. Regenerate with npm run partner:outreach.`}
        right={
          <Button asChild variant="outline">
            <Link href="/admin">Back to admin</Link>
          </Button>
        }
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant={stateFilter === "ALL" ? "default" : "outline"} size="sm">
          <Link href={buildOutreachHref({ ...baseParams, state: undefined, page: undefined })}>
            All states ({allCandidates.length})
          </Link>
        </Button>
        {stateCounts.slice(0, 14).map(({ state, count }) => (
          <Button key={state} asChild variant={stateFilter === state ? "default" : "outline"} size="sm">
            <Link
              href={buildOutreachHref({
                ...baseParams,
                state,
                page: undefined,
              })}
            >
              {state} ({count})
            </Link>
          </Button>
        ))}
      </div>

      <Suspense fallback={null}>
        <PartnerOutreachFilters city={cityFilter} q={qFilter} />
      </Suspense>

      <div className="mt-4 flex flex-wrap gap-2">
        {PARTNER_OUTREACH_STATUS_FILTERS.map((filter) => {
          const count =
            filter === "all" ? filterSlugs.length : statusCounts[filter as PartnerOutreachStatusValue];
          const label = filter === "all" ? "All statuses" : PARTNER_OUTREACH_STATUS_LABELS[filter];
          return (
            <Button key={filter} asChild variant={filter === statusFilter ? "default" : "outline"} size="sm">
              <Link
                href={buildOutreachHref({
                  ...baseParams,
                  status: filter !== "all" ? filter : undefined,
                  page: undefined,
                })}
              >
                {label} ({count})
              </Link>
            </Button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vetted unclaimed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allCandidates.length}</div>
            <p className="text-xs text-muted-foreground">{stateCounts.length} states</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending outreach</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nationwideCounts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nationwideCounts.sent + nationwideCounts.replied}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Claimed live</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nationwideCounts.claimed}</div>
          </CardContent>
        </Card>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Showing {pageItems.length} of {total} matching
        {stateFilter !== "ALL" ? ` in ${stateFilter}` : " nationwide"}
        {cityFilter ? ` · city “${cityFilter}”` : ""}
        {qFilter ? ` · search “${qFilter}”` : ""}. Emails sign as{" "}
        <span className="font-medium text-foreground">{senderName}</span>.
      </p>

      <div className="mt-6 grid gap-4">
        {pageItems.length ? (
          pageItems.map((candidate, index) => {
            const email = buildPartnerOutreachEmail(candidate, senderName);
            const row = statusBySlug.get(candidate.slug);
            const effectiveStatus = effectiveOutreachStatus(candidate.slug, row, claimedSlugs);
            const sendOrder = (page - 1) * PARTNER_OUTREACH_PAGE_SIZE + index + 1;
            return (
              <PartnerOutreachCard
                key={candidate.slug}
                candidate={candidate}
                email={email}
                sendOrder={sendOrder}
                outreachStatus={effectiveStatus}
                outreachNotes={row?.notes ?? null}
                contactedAt={row?.contacted_at ?? null}
                statusUpdatedAt={row?.updated_at ?? null}
                liveClaimed={claimedSlugs.has(candidate.slug)}
              />
            );
          })
        ) : (
          <p className="rounded-lg border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            No candidates match this filter.{" "}
            <Link href={buildOutreachHref({})} className="underline">
              Reset filters
            </Link>
          </p>
        )}
      </div>

      {pageCount > 1 ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Button asChild variant="outline" size="sm" disabled={page <= 1}>
            <Link
              href={buildOutreachHref({
                ...baseParams,
                page: page - 1,
              })}
              aria-disabled={page <= 1}
              tabIndex={page <= 1 ? -1 : undefined}
            >
              Previous
            </Link>
          </Button>
          <span className="px-2 text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Button asChild variant="outline" size="sm" disabled={page >= pageCount}>
            <Link
              href={buildOutreachHref({
                ...baseParams,
                page: page + 1,
              })}
              aria-disabled={page >= pageCount}
              tabIndex={page >= pageCount ? -1 : undefined}
            >
              Next
            </Link>
          </Button>
        </div>
      ) : null}
    </Container>
  );
}
