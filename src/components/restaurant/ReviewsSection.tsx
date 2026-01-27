"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReviewBreakdown } from "./ReviewBreakdown";
import { ReviewItem } from "./ReviewItem";

type Review = {
  id: string;
  user_id: string;
  overall_rating: number;
  review_text: string | null;
  restaurant_response: string | null;
  created_at: string;
};

type ReviewsSectionProps = {
  rating: number | null;
  totalReviews: number;
  histogram: number[];
  reviews: Review[];
};

export function ReviewsSection({ rating, totalReviews, histogram, reviews }: ReviewsSectionProps) {
  return (
    <section className="w-full">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Reviews &amp; Ratings</h2>
          <p className="mt-2 text-muted-foreground">What diners are saying.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {rating != null ? (
            <>
              <span className="font-medium text-foreground">{rating.toFixed(1)}★</span> •{" "}
              <span>{totalReviews} reviews</span>
            </>
          ) : (
            "No reviews yet"
          )}
        </div>
      </div>

      {totalReviews === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Be the first to review</CardTitle>
            <CardDescription>After dining, leave a rating and help others discover this spot.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          {/* Review Breakdown */}
          <ReviewBreakdown rating={rating} totalReviews={totalReviews} histogram={histogram} />

          {/* Reviews List */}
          <div>
            {reviews.slice(0, 8).map((review) => (
              <ReviewItem
                key={review.id}
                name="Verified Diner"
                date={review.created_at}
                comment={review.review_text}
                rating={Number(review.overall_rating) || 0}
                restaurantResponse={review.restaurant_response}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
