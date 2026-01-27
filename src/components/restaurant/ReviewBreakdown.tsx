"use client";

import * as React from "react";

type ReviewBreakdownProps = {
  rating: number | null;
  totalReviews: number;
  histogram: number[]; // [5-star count, 4-star count, 3-star count, 2-star count, 1-star count]
};

export function ReviewBreakdown({ rating, totalReviews, histogram }: ReviewBreakdownProps) {
  // Convert histogram array to stats format (reverse order: 5 to 1)
  const stats = [
    { stars: 5, count: histogram[4] || 0 },
    { stars: 4, count: histogram[3] || 0 },
    { stars: 3, count: histogram[2] || 0 },
    { stars: 2, count: histogram[1] || 0 },
    { stars: 1, count: histogram[0] || 0 },
  ];

  const displayRating = rating ? rating.toFixed(1) : "0.0";
  const displayReviews = totalReviews || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center py-8 border-y border-slate-100 mb-12">
      {/* Big Score */}
      <div className="text-center">
        <div className="text-6xl font-black text-slate-900 mb-2">{displayRating}</div>
        <div className="flex justify-center text-amber-500 mb-2">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
          {displayReviews} {displayReviews === 1 ? "Review" : "Reviews"}
        </p>
      </div>

      {/* Histogram bars */}
      <div className="md:col-span-2 space-y-2">
        {stats.map((stat) => {
          const percentage = displayReviews > 0 ? (stat.count / displayReviews) * 100 : 0;
          return (
            <div key={stat.stars} className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-600 w-4">{stat.stars}</span>
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="text-sm text-slate-400 w-8 text-right">{stat.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
