"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type WriteReviewModalProps = {
  restaurantId?: string;
  restaurantSlug?: string;
  restaurantName?: string;
};

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <svg
            className={`w-6 h-6 transition-colors ${
              star <= value ? "text-amber-500 fill-current" : "text-slate-300"
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function WriteReviewModal({ restaurantSlug, restaurantName }: WriteReviewModalProps) {
  const router = useRouter();
  const reviewCommentId = `${React.useId()}-review-comment`;
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!comment.trim() || comment.length < 10) {
      toast.error("Please write at least 10 characters");
      return;
    }

    setIsSubmitting(true);
    
    // For now, redirect to login or show message
    // In a full implementation, this would submit to the API
    toast.info("Please log in to write a review");
    router.push(`/login?redirectTo=/restaurants/${restaurantSlug}`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white">
          Write a Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience at {restaurantName || "this restaurant"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <Label className="mb-2 block">Your Rating</Label>
            <Stars value={rating} onChange={setRating} />
          </div>
          <div>
            <Label htmlFor={reviewCommentId} className="mb-2 block">
              Your Review
            </Label>
            <Textarea
              id={reviewCommentId}
              placeholder="Tell others about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[120px]"
              maxLength={2000}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {comment.length}/2000 characters
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !comment.trim() || comment.length < 10}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
