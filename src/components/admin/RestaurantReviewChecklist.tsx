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

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Verification checklist</CardTitle>
          <div className="mt-1 text-sm text-muted-foreground">
            Confirm key details before approving. (This checklist is currently not persisted.)
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
                onCheckedChange={(v) => setChecked((prev) => ({ ...prev, [i.id]: Boolean(v) }))}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium">{i.label}</div>
                {i.hint ? <div className="text-xs text-muted-foreground">{i.hint}</div> : null}
              </div>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <form action={`/admin/restaurants/${props.restaurantId}/approve`} method="post">
            <Button type="submit" disabled={!allChecked}>
              Approve &amp; Activate
            </Button>
          </form>
          <form action={`/admin/restaurants/${props.restaurantId}/send-welcome`} method="post">
            <Button type="submit" variant="secondary">
              Send welcome email
            </Button>
          </form>
          <Button asChild variant="outline">
            <Link href={`/admin/restaurants/${props.restaurantId}/edit`}>Edit</Link>
          </Button>
          <form action={`/admin/restaurants/${props.restaurantId}/delete`} method="post">
            <Button type="submit" variant="destructive">
              Delete
            </Button>
          </form>
        </div>

        {!allChecked ? (
          <div className="text-xs text-muted-foreground">
            Check all items to enable approval.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

