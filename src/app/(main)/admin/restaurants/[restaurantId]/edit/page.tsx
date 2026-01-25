import "server-only";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminRestaurantEditPage() {
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  const user = auth.user;
  if (!user) redirect("/login?redirectTo=/admin/restaurants/pending");
  const { data: profile } = await supabaseSSR.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  return (
    <Container className="py-10 md:py-14">
      <PageHeader
        title="Edit restaurant (admin)"
        description="Editing is coming next. For now, approve or delete from the pending list."
        right={
          <Button asChild variant="outline">
            <Link href="/admin/restaurants/pending">Back to pending</Link>
          </Button>
        }
      />

      <Card className="mt-6">
        <CardContent className="py-8 text-sm text-muted-foreground">
          This page is a placeholder. If you want full edit functionality, tell me which fields you want editable (hours, photos,
          cuisine tags, address, etc.) and I’ll build the form + save action.
        </CardContent>
      </Card>
    </Container>
  );
}

