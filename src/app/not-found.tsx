import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">We couldn’t find that page</h1>
      <p className="text-muted-foreground">
        The page may have been moved, renamed, or doesn’t exist. Try going back home or browsing restaurants.
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/restaurants">Browse Restaurants</Link>
        </Button>
      </div>
    </main>
  );
}

