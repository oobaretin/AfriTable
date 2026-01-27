import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerSignupSuccessPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-orange-600"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <CardTitle className="text-2xl">Application Submitted!</CardTitle>
          <CardDescription className="mt-2">
            Thank you for your interest in partnering with AfriTable. Our team will review your application and reach out within 2-3 business days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-slate-50 p-4">
            <h4 className="mb-2 font-semibold">What happens next?</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <span>We&apos;ll review your application</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <span>Our team will contact you via email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <span>We&apos;ll help you set up your restaurant profile</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1 bg-orange-600 hover:bg-orange-700">
              <Link href="/">Return to Home</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/restaurants">Browse Restaurants</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
