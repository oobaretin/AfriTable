import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">About AfriTable</h1>
        <p className="text-muted-foreground">
          Discover great restaurants, book tables, and celebrate the best of African hospitality.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Our mission</CardTitle>
          <CardDescription>Make dining out effortless for diners and sustainable for restaurants.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This is a placeholder page — we’ll replace it with real content as the product evolves.
        </CardContent>
      </Card>
    </div>
  );
}

