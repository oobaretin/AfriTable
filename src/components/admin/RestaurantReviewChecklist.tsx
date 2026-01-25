"use client";

import * as React from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChecklistItem = {
  id: string;
  label: string;
  hint?: string;
  initialChecked: boolean;
};

export function RestaurantReviewChecklist(props: {
  restaurantId: string;
  restaurantSlug: string;
  items: ChecklistItem[];
}) {
  const [checked, setChecked] = React.useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const i of props.items) map[i.id] = Boolean(i.initialChecked);
    return map;
  });

  const allChecked = props.items.every((i) => checked[i.id]);

  const [saving, setSaving] = React.useState<string | null>(null);

  async function persist(key: string, value: boolean) {
    setSaving(key);
    try {
      const res = await fetch(`/admin/restaurants/${props.restaurantId}/verification`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error();
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Verification checklist</CardTitle>
          <div className="mt-1 text-sm text-muted-foreground">
            Confirm key details before approving. Changes are saved automatically.
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/restaurants/${encodeURIComponent(props.restaurantSlug)}`} target="_blank">
            Preview public page
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="grid gap-3">
          {props.items.map((i) => (
            <label key={i.id} className="flex items-start gap-3">
              <Checkbox
                checked={checked[i.id]}
                onCheckedChange={(v) => {
                  const next = Boolean(v);
                  setChecked((prev) => ({ ...prev, [i.id]: next }));
                  void persist(i.id, next);
                }}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {i.label}
                  {saving === i.id ? <span className="ml-2 text-xs text-muted-foreground">(saving…)</span> : null}
                </div>
                {i.hint ? <div className="text-xs text-muted-foreground">{i.hint}</div> : null}
              </div>
            </label>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          {allChecked ? "All items verified." : "Complete all items before approval."}
        </div>
      </CardContent>
    </Card>
  );
}

