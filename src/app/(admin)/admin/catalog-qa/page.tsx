import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATALOG_QA_LABELS, getCatalogQaReport, type CatalogQaIssue } from "@/lib/catalog-qa";

export const metadata = {
  title: "Catalog QA",
};

function issueVariant(issue: CatalogQaIssue): "destructive" | "secondary" | "outline" {
  if (issue === "placeholder_image" || issue === "missing_website") return "destructive";
  if (issue === "templated_about") return "secondary";
  return "outline";
}

export default async function AdminCatalogQaPage() {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?redirectTo=/admin/catalog-qa");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", auth.user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  const report = getCatalogQaReport();

  return (
    <Container className="py-10 md:py-14">
      <PageHeader
        title="Catalog QA"
        description="Listings in data/restaurants.json that need photos, websites, or richer copy."
        right={
          <Button asChild variant="outline">
            <Link href="/admin">Back to admin</Link>
          </Button>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Catalog total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.total}</div>
            <p className="text-xs text-muted-foreground">{report.clean} with no flagged issues</p>
          </CardContent>
        </Card>
        {(
          Object.entries(report.issueCounts) as Array<[CatalogQaIssue, number]>
        ).map(([issue, count]) => (
          <Card key={issue}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{CATALOG_QA_LABELS[issue]}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Listings needing attention</CardTitle>
          <CardDescription>
            {report.needsAttention} restaurants flagged · open a listing to verify on the public site
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Restaurant</th>
                <th className="pb-3 pr-4 font-medium">City</th>
                <th className="pb-3 pr-4 font-medium">Issues</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.id} className="border-b border-border/60 align-top">
                  <td className="py-3 pr-4 font-medium">{row.name}</td>
                  <td className="py-3 pr-4 capitalize text-muted-foreground">{row.city}</td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-1.5">
                      {row.issues.map((issue) => (
                        <Badge key={issue} variant={issueVariant(issue)}>
                          {CATALOG_QA_LABELS[issue]}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/restaurants/${encodeURIComponent(row.id)}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">All catalog entries pass current QA checks.</p>
          ) : null}
        </CardContent>
      </Card>
    </Container>
  );
}
