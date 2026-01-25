import { requireAuth } from "@/lib/auth/utils";
import { MyReviewsClient } from "@/components/review/MyReviewsClient";

export default async function ReviewsPage() {
  await requireAuth("/login?redirectTo=/reviews");
  return <MyReviewsClient />;
}

