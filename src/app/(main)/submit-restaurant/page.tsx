import { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SubmitRestaurantForm from "@/components/submissions/SubmitRestaurantForm";

export const metadata: Metadata = {
  title: "Submit a Restaurant - AfriTable",
  description: "Know a great African or Caribbean restaurant? Submit it for review and we’ll add it to AfriTable.",
};

export default function SubmitRestaurantPage() {
  return (
    <Container className="py-10 md:py-14">
      <PageHeader
        title="Submit a restaurant"
        description="Help us discover great African & Caribbean spots. Submit a listing and our team will review it."
      />

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Restaurant details</CardTitle>
            <CardDescription>Provide as much info as you can — it helps us verify faster.</CardDescription>
          </CardHeader>
          <CardContent>
            <SubmitRestaurantForm />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
            <CardDescription>Our review process</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">1) Submitted</span> — We log your submission as pending.
            </div>
            <div>
              <span className="font-medium text-foreground">2) Verified</span> — An admin checks name, contact info, hours, photos.
            </div>
            <div>
              <span className="font-medium text-foreground">3) Activated or claimed</span> — We activate it publicly, or invite the owner to
              claim and manage it.
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

