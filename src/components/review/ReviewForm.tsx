"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = z.object({
  overall_rating: z.number().int().min(1).max(5),
  food_rating: z.number().int().min(1).max(5).optional().nullable(),
  service_rating: z.number().int().min(1).max(5).optional().nullable(),
  ambiance_rating: z.number().int().min(1).max(5).optional().nullable(),
  review_text: z.string().min(50).max(2000),
  recommended_dishes: z.string().max(300).optional().nullable(),
  would_recommend: z.enum(["yes", "no"]).optional().nullable(),
  photos: z.array(z.string().url()).max(5).optional().default([]),
});

type Values = z.input<typeof schema>;

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          className={n <= value ? "text-primary" : "text-muted-foreground"}
          onClick={() => onChange(n)}
          aria-label={`${n} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function ReviewForm(props: {
  reservationId: string;
  restaurant: { name: string; slug: string };
  dateDined: string;
}) {
  const router = useRouter();
  const [uploading, setUploading] = React.useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      overall_rating: 5,
      food_rating: null,
      service_rating: null,
      ambiance_rating: null,
      review_text: "",
      recommended_dishes: "",
      would_recommend: "yes",
      photos: [],
    },
  });

  async function onSubmit(values: Values) {
    const v = schema.parse(values);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reservationId: props.reservationId,
        ...v,
        would_recommend:
          v.would_recommend === "yes" ? true : v.would_recommend === "no" ? false : null,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.message || data?.error || "Could not submit review");
      return;
    }
    toast.success("Review submitted");
    router.replace(`/restaurants/${props.restaurant.slug}`);
    router.refresh();
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const urls: string[] = [];

      for (const file of Array.from(files).slice(0, 5)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `reviews/${props.reservationId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("review-photos").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;
        const { data } = supabase.storage.from("review-photos").getPublicUrl(path);
        urls.push(data.publicUrl);
      }

      const current = form.getValues("photos") ?? [];
      form.setValue("photos", [...current, ...urls].slice(0, 5));
      toast.success("Photos uploaded");
    } catch {
      toast.error(
        "Photo upload failed. Create a Supabase Storage bucket named 'review-photos' and allow public read, authenticated upload.",
      );
    } finally {
      setUploading(false);
    }
  }

  const text = form.watch("review_text");
  const photos = form.watch("photos") ?? [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:py-14">
      <Card>
        <CardHeader>
          <CardTitle>Leave a review</CardTitle>
          <CardDescription>
            <span className="font-medium text-foreground">{props.restaurant.name}</span> •{" "}
            <Badge variant="secondary">{props.dateDined}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <Form {...form}>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="overall_rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall experience *</FormLabel>
                    <FormControl>
                      <Stars value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                {(["food_rating", "service_rating", "ambiance_rating"] as const).map((k) => (
                  <FormField
                    key={k}
                    control={form.control}
                    name={k}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{k.replace("_", " ").replace("rating", "rating")}</FormLabel>
                        <FormControl>
                          <Stars value={field.value ?? 0} onChange={(v) => field.onChange(v)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <FormField
                control={form.control}
                name="review_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Written review</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-40"
                        placeholder="Share details about your experience..."
                        {...field}
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground">{text.length} / 2000</div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-2">
                <div className="text-sm font-medium">Photos (up to 5)</div>
                <Input type="file" multiple accept="image/*" disabled={uploading} onChange={(e) => void uploadFiles(e.target.files)} />
                {photos.length ? (
                  <div className="flex flex-wrap gap-2">
                    {photos.map((u) => (
                      <Badge key={u} variant="outline" className="max-w-[280px] truncate">
                        {u}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Optional. Upload requires a Supabase Storage bucket named <code className="font-mono">review-photos</code>.</div>
                )}
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="recommended_dishes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recommended dishes (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Jollof rice, oxtail stew…"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="would_recommend"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Would you recommend this restaurant?</FormLabel>
                    <FormControl>
                      <Select value={field.value ?? "yes"} onValueChange={field.onChange}>
                        <SelectTrigger className="w-[220px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={form.formState.isSubmitting || uploading}>
                  {form.formState.isSubmitting ? "Submitting…" : "Submit review"}
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/restaurants/${props.restaurant.slug}`}>Back</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

