"use client";

import * as React from "react";

type VerificationKey = "name" | "address" | "phone" | "hours" | "photos" | "description";

const ITEMS: Array<[VerificationKey, string]> = [
  ["name", "Restaurant name looks correct"],
  ["address", "Address & city are correct"],
  ["phone", "Phone number works"],
  ["hours", "Hours verified"],
  ["photos", "At least 1 photo uploaded"],
  ["description", "Description is accurate"],
];

export function Checklist(props: {
  restaurantId: string;
  verification?: Partial<Record<VerificationKey, boolean>> | null;
}) {
  const [state, setState] = React.useState<Partial<Record<VerificationKey, boolean>>>(() => props.verification ?? {});
  const [savingKey, setSavingKey] = React.useState<VerificationKey | null>(null);

  async function persist(key: VerificationKey, value: boolean) {
    setSavingKey(key);
    try {
      const res = await fetch(`/admin/restaurants/${props.restaurantId}/verification`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      <h2 className="mb-3 font-semibold">Verification Checklist</h2>

      <ul className="space-y-2">
        {ITEMS.map(([key, label]) => (
          <li key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(state[key])}
              onChange={(e) => {
                const next = e.target.checked;
                setState((prev) => ({ ...prev, [key]: next }));
                void persist(key, next);
              }}
            />
            <span className="text-sm">
              {label}
              {savingKey === key ? <span className="ml-2 text-xs text-muted-foreground">(saving…)</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

