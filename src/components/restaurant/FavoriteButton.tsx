"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function FavoriteButton({ restaurantId }: { restaurantId: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [isFavorite, setIsFavorite] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setIsFavorite(false);
        return;
      }
      const { data: fav, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("restaurant_id", restaurantId)
        .maybeSingle();
      if (error) {
        setIsFavorite(false);
        return;
      }
      setIsFavorite(Boolean(fav?.id));
    })();
  }, [restaurantId]);

  async function toggle() {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (isFavorite) {
        const res = await fetch(`/api/favorites/${restaurantId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to remove favorite");
        setIsFavorite(false);
        toast.success("Removed from favorites");
      } else {
        const res = await fetch(`/api/favorites`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ restaurantId }),
        });
        if (!res.ok) throw new Error("Failed to save favorite");
        setIsFavorite(true);
        toast.success("Saved to favorites");
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={() => void toggle()} disabled={loading || isFavorite === null} type="button" className="gap-2">
      <Heart className={isFavorite ? "fill-primary text-primary" : ""} size={16} />
      {isFavorite ? "Saved" : "Save"}
    </Button>
  );
}

