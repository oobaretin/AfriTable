"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Review = {
  id: string;
  user_id: string;
  overall_rating: number;
  review_text: string | null;
  restaurant_response: string | null;
  created_at: string;
  user?: {
    full_name: string | null;
  };
};

type ReviewsResp = {
  reviews: Review[];
};

// Simple sentiment analysis based on rating and keywords
function getSentiment(review: Review): "Positive" | "Negative" | "Neutral" {
  if (review.overall_rating >= 4) return "Positive";
  if (review.overall_rating <= 2) return "Negative";
  return "Neutral";
}

// Generate AI response based on tone and review content
function generateAIResponse(
  review: Review,
  tone: "Warm" | "Formal" | "Short",
): string {
  const userName = review.user?.full_name?.split(" ")[0] || "there";
  const rating = review.overall_rating;
  const comment = review.review_text || "";

  if (tone === "Short") {
    if (rating >= 4) {
      return `Hi ${userName}, thank you so much! We're thrilled you enjoyed your visit. See you again soon!`;
    } else {
      return `Hi ${userName}, thank you for your feedback. We're always working to improve and would love to make it right. Please reach out directly.`;
    }
  }

  if (tone === "Formal") {
    if (rating >= 4) {
      return `Dear ${userName},\n\nThank you for taking the time to share your experience. We are delighted to hear that you enjoyed your visit. Your feedback is invaluable to us, and we look forward to welcoming you back.\n\nBest regards,\nThe Team`;
    } else {
      return `Dear ${userName},\n\nThank you for your feedback. We take all reviews seriously and are committed to continuous improvement. We would appreciate the opportunity to discuss your experience further. Please contact us directly so we can address your concerns.\n\nSincerely,\nThe Management`;
    }
  }

  // Warm tone (default)
  if (rating >= 4) {
    return `Hi ${userName}, thank you so much for the kind words! We take huge pride in bringing authentic flavors to our community. ${comment.toLowerCase().includes("slow") || comment.toLowerCase().includes("wait") ? "We hear you on the wait time—we're working on making our service as smooth as our flavors." : ""} See you again soon!`;
  } else {
    return `Hi ${userName}, thank you for your honest feedback. We're always striving to improve, and your input helps us do better. We'd love to make things right—please reach out to us directly so we can discuss how we can improve your next visit.`;
  }
}

export function ReviewStudio() {
  const [activeReviewIndex, setActiveReviewIndex] = React.useState(0);
  const [selectedTone, setSelectedTone] = React.useState<"Warm" | "Formal" | "Short">("Warm");
  const [responseText, setResponseText] = React.useState("");
  const [isPosting, setIsPosting] = React.useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<ReviewsResp>({
    queryKey: ["ownerReviews"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/reviews");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load reviews");
      return data as ReviewsResp;
    },
    refetchInterval: 60_000, // Refetch every minute
  });

  const reviews = data?.reviews ?? [];

  // Update response text when review or tone changes
  React.useEffect(() => {
    if (reviews.length > 0 && activeReviewIndex < reviews.length) {
      const activeReview = reviews[activeReviewIndex];
      const generated = generateAIResponse(activeReview, selectedTone);
      setResponseText(generated);
    }
  }, [activeReviewIndex, selectedTone, reviews]);

  async function postResponse(reviewId: string) {
    if (!responseText.trim()) {
      toast.error("Please enter a response");
      return;
    }

    setIsPosting(true);
    try {
      const res = await fetch(`/api/dashboard/reviews/${reviewId}/response`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response: responseText }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to post response");
      }
      toast.success("Response posted successfully");
      // Refetch reviews
      await queryClient.invalidateQueries({ queryKey: ["ownerReviews"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post response");
    } finally {
      setIsPosting(false);
    }
  }

  async function reportReview(reviewId: string) {
    try {
      const res = await fetch(`/api/dashboard/reviews/${reviewId}/report`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to report review");
      }
      toast.success("Review reported to management");
      // Refetch reviews
      await queryClient.invalidateQueries({ queryKey: ["ownerReviews"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to report review");
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-10">
        <Skeleton className="h-12 w-64 mb-10" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-3xl" />
            ))}
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-96 rounded-[2.5rem]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-10">
        <Alert variant="destructive">
          <AlertDescription>Failed to load reviews. Please refresh the page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-10">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Guest Feedback</h1>
          <p className="text-brand-bronze font-bold text-sm">Nurture your community and protect your reputation.</p>
        </header>
        <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100">
          <p className="text-slate-500">No reviews yet. Reviews will appear here once diners start leaving feedback.</p>
        </div>
      </div>
    );
  }

  const activeReview = reviews[activeReviewIndex];
  const sentiment = getSentiment(activeReview);
  const userName = activeReview.user?.full_name || "Guest";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Guest Feedback</h1>
        <p className="text-brand-bronze font-bold text-sm">Nurture your community and protect your reputation.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Review Feed */}
        <div className="lg:col-span-1 space-y-4">
          {reviews.map((rev, i) => {
            const revSentiment = getSentiment(rev);
            const revUserName = rev.user?.full_name || "Guest";
            return (
              <div
                key={rev.id}
                onClick={() => setActiveReviewIndex(i)}
                className={`p-5 rounded-3xl cursor-pointer transition-all border-2 ${
                  activeReviewIndex === i
                    ? "bg-white border-brand-bronze shadow-md"
                    : "bg-slate-50 border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-black text-brand-dark">{revUserName}</span>
                  <span className="text-xs font-bold text-brand-ochre">
                    {"★".repeat(rev.overall_rating)}
                    {"☆".repeat(5 - rev.overall_rating)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 italic mb-2">
                  &quot;{rev.review_text || "No comment"}&quot;
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-black text-slate-400">
                    {formatDistanceToNow(new Date(rev.created_at), { addSuffix: true })}
                  </span>
                  {rev.restaurant_response && (
                    <span className="text-[10px] font-bold text-brand-forest">✓ Replied</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: AI Response Studio */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-brand-dark p-8 text-white">
              <div className="flex justify-between items-center mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                    sentiment === "Positive"
                      ? "bg-brand-forest/20 text-brand-forest border-brand-forest/30"
                      : sentiment === "Negative"
                        ? "bg-brand-mutedRed/20 text-brand-mutedRed border-brand-mutedRed/30"
                        : "bg-brand-ochre/20 text-brand-ochre border-brand-ochre/30"
                  }`}
                >
                  {sentiment} Sentiment
                </span>
                <button
                  onClick={() => reportReview(activeReview.id)}
                  className="text-xs font-bold text-brand-mutedRed hover:underline"
                >
                  Report to Management
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-brand-bronze/20 flex items-center justify-center font-bold text-brand-ochre">
                  {userInitials}
                </div>
                <div>
                  <p className="font-bold">{userName}</p>
                  <p className="text-xs text-slate-400">
                    {"★".repeat(activeReview.overall_rating)} •{" "}
                    {formatDistanceToNow(new Date(activeReview.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <p className="text-lg leading-relaxed italic text-slate-200">
                &quot;{activeReview.review_text || "No comment provided"}&quot;
              </p>
            </div>

            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-black text-brand-dark uppercase tracking-widest text-xs">AI Smart Draft</h4>
                <div className="flex gap-2">
                  {(["Warm", "Formal", "Short"] as const).map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setSelectedTone(tone)}
                      className={`px-3 py-1 text-[10px] font-black rounded-lg border transition-colors ${
                        selectedTone === tone
                          ? "bg-brand-paper border-brand-bronze text-brand-bronze"
                          : "border-slate-200 hover:bg-brand-paper"
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Generated Textarea */}
              <div className="relative group">
                <div className="absolute -top-3 left-6 px-2 bg-white text-[10px] font-black text-brand-bronze z-10">
                  ✨ SUGGESTED RESPONSE
                </div>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full h-40 p-6 rounded-2xl bg-brand-paper border border-brand-bronze/10 text-slate-700 leading-relaxed focus:ring-2 focus:ring-brand-bronze outline-none transition-all"
                  placeholder="Your response will appear here..."
                />
              </div>

              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => {
                    const generated = generateAIResponse(activeReview, selectedTone);
                    setResponseText(generated);
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-brand-mutedRed transition-colors"
                >
                  Regenerate Draft
                </button>
                <Button
                  onClick={() => postResponse(activeReview.id)}
                  disabled={isPosting || !responseText.trim() || !!activeReview.restaurant_response}
                  className="btn-bronze px-8 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  {isPosting ? "Posting..." : activeReview.restaurant_response ? "Already Replied" : "Post Response"}
                </Button>
              </div>

              {activeReview.restaurant_response && (
                <div className="mt-6 p-4 rounded-xl bg-brand-paper border border-brand-forest/20">
                  <p className="text-xs font-black text-brand-forest uppercase mb-2">Current Response</p>
                  <p className="text-sm text-slate-700 italic">&quot;{activeReview.restaurant_response}&quot;</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
