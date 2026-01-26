import "server-only";

import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  UtensilsCrossed,
  AlertCircle,
} from "lucide-react";

async function getAdminStats() {
  const supabase = createSupabaseAdminClient();

  // Total restaurants
  const { count: totalRestaurants } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true });

  // Active restaurants
  const { count: activeRestaurants } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Pending restaurants (claimed but not active)
  const { count: pendingRestaurants } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("is_claimed", true)
    .eq("is_active", false);

  // Restaurant submissions
  const { count: totalSubmissions } = await supabase
    .from("restaurant_submissions")
    .select("*", { count: "exact", head: true });

  // Pending submissions
  const { count: pendingSubmissions } = await supabase
    .from("restaurant_submissions")
    .select("*", { count: "exact", head: true })
    .in("status", ["submitted", "under_review"]);

  // Total users
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Restaurant owners
  const { count: restaurantOwners } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "restaurant_owner");

  return {
    totalRestaurants: totalRestaurants || 0,
    activeRestaurants: activeRestaurants || 0,
    pendingRestaurants: pendingRestaurants || 0,
    totalSubmissions: totalSubmissions || 0,
    pendingSubmissions: pendingSubmissions || 0,
    totalUsers: totalUsers || 0,
    restaurantOwners: restaurantOwners || 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const quickActions = [
    {
      title: "Pending Restaurants",
      description: "Review claimed restaurants awaiting activation",
      href: "/admin/pending-restaurants",
      icon: Clock,
      count: stats.pendingRestaurants,
      badge: stats.pendingRestaurants > 0 ? "warning" : "default",
    },
    {
      title: "Restaurant Submissions",
      description: "Review community-submitted restaurants",
      href: "/admin/submissions",
      icon: FileText,
      count: stats.pendingSubmissions,
      badge: stats.pendingSubmissions > 0 ? "warning" : "default",
    },
  ];

  const statsCards = [
    {
      title: "Total Restaurants",
      value: stats.totalRestaurants,
      description: `${stats.activeRestaurants} active`,
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Pending Review",
      value: stats.pendingRestaurants + stats.pendingSubmissions,
      description: "Awaiting approval",
      icon: AlertCircle,
      color: "text-amber-600",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      description: `${stats.restaurantOwners} restaurant owners`,
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Active Listings",
      value: stats.activeRestaurants,
      description: "Live on platform",
      icon: CheckCircle2,
      color: "text-emerald-600",
    },
  ];

  return (
    <Container>
      <PageHeader
        title="Admin Dashboard"
        description="Manage restaurants, submissions, and platform settings"
      />

      {/* Stats Overview */}
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.href} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{action.title}</CardTitle>
                        <CardDescription className="mt-1">{action.description}</CardDescription>
                      </div>
                    </div>
                    {action.count > 0 && (
                      <Badge variant={action.badge === "warning" ? "destructive" : "secondary"}>
                        {action.count}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={action.href}>
                      {action.count > 0 ? `Review ${action.count} ${action.count === 1 ? "item" : "items"}` : "View All"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Additional Links */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">All Admin Sections</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/pending-restaurants"
            className="group rounded-lg border p-4 transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              <div>
                <div className="font-medium">Pending Restaurants</div>
                <div className="text-sm text-muted-foreground">Claimed, awaiting activation</div>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/submissions"
            className="group rounded-lg border p-4 transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              <div>
                <div className="font-medium">Restaurant Submissions</div>
                <div className="text-sm text-muted-foreground">Community submissions</div>
              </div>
            </div>
          </Link>

          <div className="rounded-lg border p-4 opacity-50">
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">All Restaurants</div>
                <div className="text-sm text-muted-foreground">Coming soon</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <Card className="mt-8 border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4" />
            Admin Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            • Review restaurant submissions and verify information before approval
          </p>
          <p className="text-muted-foreground">
            • Activate pending restaurants after verifying ownership claims
          </p>
          <p className="text-muted-foreground">
            • Ensure all restaurants meet quality standards before going live
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
