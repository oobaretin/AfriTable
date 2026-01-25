import { requireAuth } from "@/lib/auth/utils";
import { FavoritesClient } from "@/components/favorites/FavoritesClient";

export default async function FavoritesPage() {
  await requireAuth("/login?redirectTo=/favorites");
  return <FavoritesClient />;
}

