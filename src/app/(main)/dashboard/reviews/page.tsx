import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReviewStudio } from "@/components/dashboard/ReviewStudio";
import { RestaurantOwnerDashboardLayout } from "@/components/dashboard/RestaurantOwnerDashboardLayout";

export default async function ReviewsPage() {
  const supabase = createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) redirect("/login?redirectTo=/dashboard/reviews");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "restaurant_owner") redirect("/");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <RestaurantOwnerDashboardLayout restaurantName={restaurant?.name ?? "Your restaurant"} activeTab="reviews">
      <ReviewStudio />
    </RestaurantOwnerDashboardLayout>
  );
}
