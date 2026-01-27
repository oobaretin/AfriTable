"use client";

import * as React from "react";
import { format } from "date-fns";

type ReviewItemProps = {
  name?: string;
  date: string | Date;
  comment: string | null;
  rating: number;
  restaurantResponse?: string | null;
};

export function ReviewItem({ name = "Verified Diner", date, comment, rating, restaurantResponse }: ReviewItemProps) {
  const formattedDate = typeof date === "string" ? format(new Date(date), "MMM d, yyyy") : format(date, "MMM d, yyyy");
  const displayRating = Math.max(1, Math.min(5, Math.round(rating)));

  return (
    <div className="py-8 border-b border-slate-50 last:border-0">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-slate-900">{name}</h4>
          <p className="text-xs text-slate-400">{formattedDate}</p>
        </div>
        <div className="flex text-amber-500">
          {[...Array(displayRating)].map((_, i) => (
            <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>
      {comment && (
        <p className="text-slate-600 leading-relaxed italic mb-4">&quot;{comment}&quot;</p>
      )}
      {restaurantResponse && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Restaurant Response</div>
          <p className="text-sm text-slate-700">{restaurantResponse}</p>
        </div>
      )}
    </div>
  );
}
