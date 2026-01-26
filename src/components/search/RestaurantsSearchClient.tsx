"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";

const CUISINES = [
  "Nigerian",
  "Ethiopian",
  "Ghanaian",
  "Senegalese",
  "Somali",
  "Eritrean",
  "South African",
  "Kenyan",
  "Jamaican",
  "Trinidadian",
  "Haitian",
  "Other African",
  "Other Caribbean",
];

export function RestaurantsSearchClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [city, setCity] = React.useState(sp.get("city") ?? "");
  const [zip, setZip] = React.useState(sp.get("zip") ?? "");
  const [selectedCuisines, setSelectedCuisines] = React.useState<string[]>(
    (sp.get("cuisine") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  );
  const [prices, setPrices] = React.useState<number[]>(
    (sp.get("price") ?? "")
      .split(",")
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n)),
  );
  const [minRating, setMinRating] = React.useState(sp.get("minRating") ?? "");
  const [sort, setSort] = React.useState(sp.get("sort") ?? "recommended");
  const [view, setView] = React.useState(sp.get("view") ?? "grid");
  const [page, setPage] = React.useState(Number(sp.get("page") ?? "1") || 1);

  function apply() {
    const params = new URLSearchParams();
    if (city.trim()) params.set("city", city.trim());
    if (zip.trim()) params.set("zip", zip.trim());
    if (selectedCuisines.length) params.set("cuisine", selectedCuisines.join(","));
    if (prices.length) params.set("price", prices.join(","));
    if (minRating) params.set("minRating", minRating);
    if (sort) params.set("sort", sort);
    if (view) params.set("view", view);
    params.set("page", String(page));
    router.push(`/restaurants?${params.toString()}`);
  }

  React.useEffect(() => {
    setPage(Number(sp.get("page") ?? "1") || 1);
  }, [sp]);

  const q = useQuery({
    queryKey: ["restaurantsSearch", city, zip, selectedCuisines.join(","), prices.join(","), minRating, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (city.trim()) params.set("city", city.trim());
      if (zip.trim()) params.set("zip", zip.trim());
      if (selectedCuisines.length) params.set("cuisine", selectedCuisines.join(","));
      if (prices.length) params.set("price", prices.join(","));
      if (minRating) params.set("minRating", minRating);
      if (sort) params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", "20");
      const res = await fetch(`/api/restaurants/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Search failed");
      return data as { total: number; page: number; limit: number; items: any[] };
    },
    placeholderData: keepPreviousData,
  });

  function toggleCuisine(c: string) {
    setSelectedCuisines((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }
  function togglePrice(p: number) {
    setPrices((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  const filters = (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <div className="text-sm font-medium">Location</div>
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (e.g. Atlanta, GA)" />
        <Input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP (e.g. 30303)" />
      </div>

      <div className="grid gap-2">
        <div className="text-sm font-medium">Cuisine</div>
        <div className="grid gap-2">
          {CUISINES.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm">
              <Checkbox checked={selectedCuisines.includes(c)} onCheckedChange={() => toggleCuisine(c)} />
              <span>{c}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="text-sm font-medium">Price</div>
        <div className="grid gap-2">
          {[1, 2, 3, 4].map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm">
              <Checkbox checked={prices.includes(p)} onCheckedChange={() => togglePrice(p)} />
              <span>{"$".repeat(p)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="text-sm font-medium">Rating</div>
        <Select value={minRating || "any"} onValueChange={(v) => setMinRating(v === "any" ? "" : v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="4">4+ stars</SelectItem>
            <SelectItem value="3">3+ stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button
          className="w-full"
          type="button"
          onClick={() => {
            setPage(1);
            apply();
          }}
        >
          Apply filters
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            setCity("");
            setZip("");
            setSelectedCuisines([]);
            setPrices([]);
            setMinRating("");
            setSort("recommended");
            setPage(1);
            router.push("/restaurants");
            toast.message("Filters cleared");
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  );

  return (
    <Container as="div" className="flex min-h-[calc(100vh-5rem)] flex-col gap-6 py-10 md:py-14">
      <div className="-mb-2 flex items-center gap-2 text-sm">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </div>
      <PageHeader
        title="Restaurants"
        description="Search and filter African & Caribbean dining across the US."
        right={
          <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => (setSort(v), setPage(1))}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="rating">Highest rated</SelectItem>
              <SelectItem value="new">Newest</SelectItem>
              <SelectItem value="price_asc">Price (low to high)</SelectItem>
              <SelectItem value="price_desc">Price (high to low)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="list">List</SelectItem>
            </SelectContent>
          </Select>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" className="md:hidden">
                Filters
              </Button>
            </DrawerTrigger>
            <DrawerContent className="p-6">
              <DrawerHeader>
                <DrawerTitle>Filters</DrawerTitle>
              </DrawerHeader>
              {filters}
            </DrawerContent>
          </Drawer>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-12">
        <div className="hidden md:col-span-3 md:block">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filters</CardTitle>
              <CardDescription>Refine your results</CardDescription>
            </CardHeader>
            <CardContent>{filters}</CardContent>
          </Card>
        </div>

        <div className="md:col-span-9">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              {q.isLoading ? "Loading…" : `${q.data?.total ?? 0} restaurants found`}
            </div>
          </div>

          <Separator className="mb-4" />

          {q.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[340px]" />
              ))}
            </div>
          ) : q.data?.items?.length ? (
            <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-4"}>
              {q.data.items.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} href={`/restaurants/${r.slug}`} />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No restaurants found</CardTitle>
                <CardDescription>Try adjusting your filters or broaden your location.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    router.push("/restaurants");
                    toast.message("Showing all restaurants");
                  }}
                >
                  Show all
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => {
                const next = Math.max(1, page - 1);
                setPage(next);
                const params = new URLSearchParams(sp.toString());
                params.set("page", String(next));
                router.push(`/restaurants?${params.toString()}`);
              }}
            >
              Prev
            </Button>
            <div className="text-sm text-muted-foreground">Page {page}</div>
            <Button
              variant="outline"
              disabled={(q.data?.items?.length ?? 0) < 20}
              onClick={() => {
                const next = page + 1;
                setPage(next);
                const params = new URLSearchParams(sp.toString());
                params.set("page", String(next));
                router.push(`/restaurants?${params.toString()}`);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}

