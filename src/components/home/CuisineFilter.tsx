"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type CuisineFilterProps = {
  selectedCuisines: string[];
  onCuisineToggle: (cuisine: string) => void;
};

const CUISINES = [
  { id: "Nigerian", label: "Nigerian" },
  { id: "Ethiopian", label: "Ethiopian" },
  { id: "Jamaican", label: "Jamaican" },
  { id: "Haitian", label: "Haitian" },
];

export function CuisineFilter({ selectedCuisines, onCuisineToggle }: CuisineFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Filter by cuisine:</span>
      {CUISINES.map((cuisine) => {
        const isSelected = selectedCuisines.includes(cuisine.id);
        return (
          <button
            key={cuisine.id}
            type="button"
            onClick={() => onCuisineToggle(cuisine.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              isSelected
                ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                : "border-border bg-background text-foreground hover:bg-muted",
            )}
          >
            {cuisine.label}
          </button>
        );
      })}
      {selectedCuisines.length > 0 && (
        <button
          type="button"
          onClick={() => {
            selectedCuisines.forEach((c) => onCuisineToggle(c));
          }}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
