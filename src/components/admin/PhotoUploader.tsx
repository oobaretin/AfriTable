"use client";

import * as React from "react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
export function PhotoUploader(props: { restaurantId: string; initialImages: string[] }) {
  const [images, setImages] = React.useState<string[]>(props.initialImages ?? []);
  const [saving, setSaving] = React.useState(false);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const uploadedUrls: string[] = [];
      const list = Array.from(files).slice(0, 10);

      for (const file of list) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `restaurants/${props.restaurantId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("restaurant-photos").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;

        const { data } = supabase.storage.from("restaurant-photos").getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }

      const res = await fetch(`/admin/restaurants/${props.restaurantId}/images`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "add", urls: uploadedUrls }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { images?: string[] };
      setImages(data.images ?? Array.from(new Set([...uploadedUrls, ...images])));
      toast.success("Photos uploaded");
    } catch {
      toast.error(
        "Photo upload failed. Create a Supabase Storage bucket named 'restaurant-photos' with public read and authenticated upload.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-2 font-semibold">Photos</h2>

      <input
        type="file"
        multiple
        accept="image/*"
        disabled={saving}
        onChange={(e) => void uploadFiles(e.target.files)}
      />

      <p className="mt-1 text-sm text-muted-foreground">Upload at least one exterior or interior photo</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Requires a Supabase Storage bucket named <code className="font-mono">restaurant-photos</code>.
      </p>

      {images.length ? (
        <div className="mt-3 text-xs text-muted-foreground">{images.length} photo(s) uploaded</div>
      ) : null}
    </div>
  );
}

