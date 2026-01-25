import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ClaimSubmittedPage() {
  return (
    <Container className="py-12 md:py-16">
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Claim submitted</CardTitle>
            <CardDescription>
              Thanks! We’ve created your pending owner account and marked the restaurant as claimed. Our team will follow up if we
              need more details.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/restaurants">Browse restaurants</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

