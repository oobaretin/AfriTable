import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { PartnerOutreachStatusRow, PartnerOutreachStatusValue } from "@/lib/partner-outreach-types";

export function effectiveOutreachStatus(
  slug: string,
  row: PartnerOutreachStatusRow | undefined,
  claimedSlugs: ReadonlySet<string>,
): PartnerOutreachStatusValue {
  if (claimedSlugs.has(slug)) return "claimed";
  return row?.status ?? "pending";
}

export async function loadPartnerOutreachStatusContext(): Promise<{
  statusBySlug: Map<string, PartnerOutreachStatusRow>;
  claimedSlugs: Set<string>;
}> {
  const supabase = createSupabaseAdminClient();

  const [{ data: statuses }, { data: claimed }] = await Promise.all([
    supabase.from("partner_outreach_status").select("*"),
    supabase.from("restaurants").select("slug").eq("is_active", true).eq("is_claimed", true),
  ]);

  const statusBySlug = new Map<string, PartnerOutreachStatusRow>();
  for (const row of (statuses ?? []) as PartnerOutreachStatusRow[]) {
    statusBySlug.set(row.slug, row);
  }

  const claimedSlugs = new Set(
    (claimed ?? []).map((r) => r.slug).filter((slug): slug is string => Boolean(slug)),
  );

  return { statusBySlug, claimedSlugs };
}

export function countByEffectiveStatus(
  slugs: string[],
  statusBySlug: Map<string, PartnerOutreachStatusRow>,
  claimedSlugs: ReadonlySet<string>,
): Record<PartnerOutreachStatusValue, number> {
  const counts: Record<PartnerOutreachStatusValue, number> = {
    pending: 0,
    sent: 0,
    replied: 0,
    claimed: 0,
    declined: 0,
    skipped: 0,
  };
  for (const slug of slugs) {
    counts[effectiveOutreachStatus(slug, statusBySlug.get(slug), claimedSlugs)] += 1;
  }
  return counts;
}
