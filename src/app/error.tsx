"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground">
        Please try again. If the issue continues, go back home and retry your last action.
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button onClick={() => reset()}>Try Again</Button>
        <Button variant="outline" asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
      {process.env.NODE_ENV !== "production" ? (
        <pre className="mt-6 w-full overflow-auto rounded-lg border bg-muted/30 p-4 text-xs">
          {error.message}
          {error.digest ? `\nDigest: ${error.digest}` : ""}
        </pre>
      ) : null}
    </main>
  );
}

