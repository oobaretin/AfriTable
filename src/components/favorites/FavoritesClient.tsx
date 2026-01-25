"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { addDays, format } from "date-fns";
import { Select as SSelect, SelectContent as SContent, SelectItem as SItem, SelectTrigger as STrigger, SelectValue as SValue } from "@/components/ui/select";

type FavoriteRow = {
  created_at: string;
  restaurant: any;
};

function times30m() {
  const times: string[] = [];
  for (let h = 7; h <= 22; h++) {
    for (const m of [0, 30]) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return times;
}

const TIMES = times30m();

export function FavoritesClient() {
  const [sort, setSort] = React.useState("recent");

  const q = useQuery<{ favorites: FavoriteRow[] }>({
    queryKey: ["favorites", sort],
    queryFn: async () => {
      const res = await fetch(`/api/user/favorites?sort=${encodeURIComponent(sort)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      return data;
    },
  });

  async function remove(id: string) {
    const res = await fetch(`/api/favorites/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to remove");
      return;
    }
    toast.success("Removed");
    void q.refetch();
  }

  const rows = q.data?.favorites ?? [];

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10 md:py-14">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Favorites</h1>
          <p className="text-muted-foreground">Saved restaurants for quick booking.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently added</SelectItem>
              <SelectItem value="alpha">Alphabetical</SelectItem>
              <SelectItem value="rating">Highest rated</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild variant="outline">
            <Link href="/restaurants">Discover</Link>
          </Button>
        </div>
      </div>

      {!rows.length ? (
        <Card>
          <CardHeader>
            <CardTitle>No favorites yet</CardTitle>
            <CardDescription>Save restaurants to book faster next time.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/restaurants">Discover restaurants</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((f) => (
            <div key={f.restaurant.id} className="relative">
              <RestaurantCard restaurant={f.restaurant} href={`/restaurants/${f.restaurant.slug}`} />
              <div className="mt-2 flex gap-2">
                <QuickReserve restaurantSlug={f.restaurant.slug} />
                <Button variant="outline" onClick={() => void remove(f.restaurant.id)} type="button" className="w-full">
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickReserve({ restaurantSlug }: { restaurantSlug: string }) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [party, setParty] = React.useState("2");
  const [time, setTime] = React.useState("19:00");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full" type="button">
          Quick Reserve
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick reserve</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <div className="text-sm font-medium">Date</div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(d) => d < new Date() || d > addDays(new Date(), 90)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <div className="text-sm font-medium">Party</div>
              <SSelect value={party} onValueChange={setParty}>
                <STrigger>
                  <SValue />
                </STrigger>
                <SContent>
                  {Array.from({ length: 20 }, (_, i) => String(i + 1)).map((n) => (
                    <SItem key={n} value={n}>
                      {n}
                    </SItem>
                  ))}
                  <SItem value="20+">20+</SItem>
                </SContent>
              </SSelect>
            </div>
            <div className="grid gap-1.5">
              <div className="text-sm font-medium">Time</div>
              <SSelect value={time} onValueChange={setTime}>
                <STrigger>
                  <SValue />
                </STrigger>
                <SContent className="max-h-72">
                  {TIMES.map((t) => (
                    <SItem key={t} value={t}>
                      {t}
                    </SItem>
                  ))}
                </SContent>
              </SSelect>
            </div>
          </div>
          <Button asChild>
            <Link
              href={`/reservations/new?restaurant=${encodeURIComponent(restaurantSlug)}&date=${encodeURIComponent(
                date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
              )}&time=${encodeURIComponent(time)}&party=${encodeURIComponent(party)}`}
            >
              Continue
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

