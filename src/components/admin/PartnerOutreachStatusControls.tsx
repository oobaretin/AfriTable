"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PARTNER_OUTREACH_STATUS_LABELS,
  type PartnerOutreachStatusRow,
  type PartnerOutreachStatusValue,
} from "@/lib/partner-outreach-types";

function statusBadgeVariant(
  status: PartnerOutreachStatusValue,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "claimed":
    case "replied":
      return "default";
    case "sent":
      return "secondary";
    case "declined":
      return "destructive";
    default:
      return "outline";
  }
}

type PartnerOutreachStatusControlsProps = {
  slug: string;
  status: PartnerOutreachStatusValue;
  notes: string | null;
  contactedAt: string | null;
  updatedAt: string | null;
  liveClaimed: boolean;
};

export function PartnerOutreachStatusBadge({ status }: { status: PartnerOutreachStatusValue }) {
  return <Badge variant={statusBadgeVariant(status)}>{PARTNER_OUTREACH_STATUS_LABELS[status]}</Badge>;
}

export function PartnerOutreachStatusControls({
  slug,
  status: initialStatus,
  notes: initialNotes,
  contactedAt,
  updatedAt,
  liveClaimed,
}: PartnerOutreachStatusControlsProps) {
  const router = useRouter();
  const [status, setStatus] = React.useState<PartnerOutreachStatusValue>(initialStatus);
  const [notes, setNotes] = React.useState(initialNotes ?? "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setStatus(initialStatus);
    setNotes(initialNotes ?? "");
  }, [initialStatus, initialNotes]);

  const save = async (nextStatus: PartnerOutreachStatusValue, nextNotes?: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/admin/partner-outreach/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          status: nextStatus,
          notes: nextNotes ?? notes,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Could not save status");
      }
      setStatus(nextStatus);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <PartnerOutreachStatusBadge status={status} />
          {liveClaimed ? (
            <span className="text-xs text-muted-foreground">Live partner in Supabase</span>
          ) : null}
        </div>
        {!liveClaimed ? (
          <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => void save("sent")}>
            Mark sent
          </Button>
        ) : null}
      </div>

      {contactedAt ? (
        <p className="text-xs text-muted-foreground">
          First contacted {format(parseISO(contactedAt), "MMM d, yyyy")}
          {updatedAt ? ` · Updated ${format(parseISO(updatedAt), "MMM d, yyyy")}` : ""}
        </p>
      ) : updatedAt ? (
        <p className="text-xs text-muted-foreground">Updated {format(parseISO(updatedAt), "MMM d, yyyy")}</p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-[180px_1fr] sm:items-start">
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as PartnerOutreachStatusValue)}
          disabled={saving || liveClaimed}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PARTNER_OUTREACH_STATUS_LABELS) as PartnerOutreachStatusValue[]).map((value) => (
              <SelectItem key={value} value={value}>
                {PARTNER_OUTREACH_STATUS_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (reply summary, best contact, next step…)"
          rows={2}
          disabled={saving}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={saving || liveClaimed} onClick={() => void save(status)}>
          {saving ? "Saving…" : "Save status"}
        </Button>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export type { PartnerOutreachStatusRow };
