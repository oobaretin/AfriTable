"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RestaurantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("[RestaurantPage] Error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Error loading restaurant</h1>
      <p className="text-muted-foreground">
        {error.message || "Something went wrong while loading this restaurant page."}
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/restaurants">Browse Restaurants</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
      {process.env.NODE_ENV === "development" && (
        <details className="mt-4 w-full">
          <summary className="cursor-pointer text-sm text-muted-foreground">Error details</summary>
          <pre className="mt-2 overflow-auto rounded bg-muted p-4 text-xs">
            {error.stack || JSON.stringify(error, null, 2)}
          </pre>
        </details>
      )}
    </main>
  );
}
