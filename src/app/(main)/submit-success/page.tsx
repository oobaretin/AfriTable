import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SubmitSuccessPage() {
  return (
    <Container className="py-12 md:py-16">
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Submission received</CardTitle>
            <CardDescription>Thanks for helping the community — we’ll review this restaurant soon.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild>
              <Link href="/restaurants">Browse restaurants</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/submit-restaurant">Submit another</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

