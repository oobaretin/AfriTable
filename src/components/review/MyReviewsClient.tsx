"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ReviewRow = {
  id: string;
  restaurant_id: string;
  reservation_id: string;
  overall_rating: number;
  review_text: string | null;
  created_at: string;
  restaurant: { slug: string; name: string; images: string[] } | null;
};

export function MyReviewsClient() {
  const q = useQuery<{ reviews: ReviewRow[] }>({
    queryKey: ["myReviews"],
    queryFn: async () => {
      const res = await fetch("/api/user/reviews");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load reviews");
      return data;
    },
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10 md:py-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Reviews</h1>
          <p className="text-muted-foreground">Your review history and edits (within 30 days).</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/restaurants">Browse restaurants</Link>
        </Button>
      </div>

      {q.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn’t load reviews</AlertTitle>
          <AlertDescription>{String((q.error as any)?.message ?? "")}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4">
        {(q.data?.reviews?.length ?? 0) ? (
          q.data!.reviews.map((r) => <ReviewCard key={r.id} review={r} onChanged={() => void q.refetch()} />)
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No reviews yet</CardTitle>
              <CardDescription>After dining, leave a review to help the community discover great spots.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/restaurants">Discover restaurants</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review, onChanged }: { review: ReviewRow; onChanged: () => void }) {
  const createdLabel = formatDistanceToNowStrict(new Date(review.created_at), { addSuffix: true });
  return (
    <Card>
      <CardHeader className="md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">
            {review.restaurant ? (
              <Link href={`/restaurants/${review.restaurant.slug}`} className="underline underline-offset-4">
                {review.restaurant.name}
              </Link>
            ) : (
              "Restaurant"
            )}
          </CardTitle>
          <CardDescription className="flex flex-wrap gap-2">
            <Badge variant="secondary">{review.overall_rating.toFixed(1)}★</Badge>
            <Badge variant="outline">Reviewed {createdLabel}</Badge>
          </CardDescription>
        </div>
        <div className="mt-3 flex gap-2 md:mt-0">
          <EditReviewDialog review={review} onChanged={onChanged} />
          {review.restaurant ? (
            <Button asChild variant="outline">
              <Link href={`/restaurants/${review.restaurant.slug}`}>View restaurant</Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {review.review_text ? (
          <p className="line-clamp-4">{review.review_text}</p>
        ) : (
          <p className="italic">No written review.</p>
        )}
      </CardContent>
    </Card>
  );
}

function EditReviewDialog({ review, onChanged }: { review: ReviewRow; onChanged: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(String(review.overall_rating));
  const [text, setText] = React.useState(review.review_text ?? "");
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ overall_rating: Number(rating), review_text: text }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || data?.error || "Update failed");
      toast.success("Review updated");
      setOpen(false);
      onChanged();
    } catch (e: any) {
      setErr(e.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit (30 days)</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit review</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <div className="text-sm font-medium">Overall rating</div>
            <Input value={rating} onChange={(e) => setRating(e.target.value)} inputMode="numeric" />
          </div>
          <div className="grid gap-1.5">
            <div className="text-sm font-medium">Review text</div>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-28" />
          </div>
          {err ? (
            <Alert variant="destructive">
              <AlertTitle>Couldn’t update</AlertTitle>
              <AlertDescription>{err}</AlertDescription>
            </Alert>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

