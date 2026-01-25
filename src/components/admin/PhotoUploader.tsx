"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function PhotoUploader(props: { restaurantId: string; initialImages: string[] }) {
  const [url, setUrl] = React.useState("");
  const [images, setImages] = React.useState<string[]>(props.initialImages ?? []);
  const [saving, setSaving] = React.useState(false);

  async function addUrl() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const res = await fetch(`/admin/restaurants/${props.restaurantId}/images`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "add", url: trimmed }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { images?: string[] };
      setImages(data.images ?? images);
      setUrl("");
    } finally {
      setSaving(false);
    }
  }

  async function removeUrl(u: string) {
    setSaving(true);
    try {
      const res = await fetch(`/admin/restaurants/${props.restaurantId}/images`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "remove", url: u }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { images?: string[] };
      setImages(data.images ?? images.filter((x) => x !== u));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="text-sm font-medium">Photos</div>

      <div className="flex gap-2">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste image URL…" />
        <Button type="button" onClick={() => void addUrl()} disabled={saving}>
          Add
        </Button>
      </div>

      {images.length ? (
        <div className="flex flex-wrap gap-2">
          {images.map((u) => (
            <button key={u} type="button" onClick={() => void removeUrl(u)} disabled={saving} title="Remove">
              <Badge variant="outline" className="max-w-[320px] truncate hover:bg-muted">
                {u}
              </Badge>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">No photos yet.</div>
      )}
    </div>
  );
}

