"use client";

import * as React from "react";
import Link from "next/link";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buildCalendarLinks, buildICS } from "@/lib/email/calendar";

type ReservationRow = {
  id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: string;
  special_requests: string | null;
  occasion: string | null;
  created_at: string;
  updated_at: string;
  restaurant: {
    id: string;
    slug: string;
    name: string;
    address: any;
    phone: string | null;
    images: string[];
  } | null;
};

type ApiResp = { reservations: ReservationRow[] };

function confirmationCode(id: string) {
  return id.split("-")[0].toUpperCase();
}

function addressToString(address: any) {
  const a: any = address ?? {};
  return [a.street, a.city, a.state, a.zip].filter(Boolean).join(", ");
}

function reservationStart(r: ReservationRow) {
  return new Date(`${r.reservation_date}T${String(r.reservation_time).slice(0, 5)}:00`);
}

export function MyReservationsClient() {
  const q = useQuery<ApiResp>({
    queryKey: ["myReservations"],
    queryFn: async () => {
      const res = await fetch("/api/user/reservations");
      const data = (await res.json()) as ApiResp;
      if (!res.ok) throw new Error((data as any)?.message || "Failed to load reservations");
      return data;
    },
  });

  const now = new Date();
  const all = q.data?.reservations ?? [];

  const upcoming = all
    .filter((r) => ["pending", "confirmed", "seated"].includes(r.status) && isAfter(reservationStart(r), now))
    .sort((a, b) => reservationStart(a).getTime() - reservationStart(b).getTime());

  const past = all
    .filter((r) => ["completed", "no_show"].includes(r.status) || isBefore(reservationStart(r), now))
    .sort((a, b) => reservationStart(b).getTime() - reservationStart(a).getTime());

  const cancelled = all
    .filter((r) => r.status === "cancelled")
    .sort((a, b) => reservationStart(b).getTime() - reservationStart(a).getTime());

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10 md:py-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Reservations</h1>
          <p className="text-muted-foreground">Manage upcoming bookings, reviews, and cancellations.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/restaurants">Browse restaurants</Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6 grid gap-4">
          {renderList({ loading: q.isLoading, emptyLabel: "No upcoming reservations", rows: upcoming })}
        </TabsContent>

        <TabsContent value="past" className="mt-6 grid gap-4">
          {renderList({ loading: q.isLoading, emptyLabel: "No past reservations yet", rows: past, isPast: true })}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6 grid gap-4">
          {renderList({ loading: q.isLoading, emptyLabel: "No cancelled reservations", rows: cancelled, isCancelled: true })}
        </TabsContent>
      </Tabs>

      {q.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn’t load reservations</AlertTitle>
          <AlertDescription>{String((q.error as any)?.message ?? "")}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );

  function renderList(params: {
    loading: boolean;
    emptyLabel: string;
    rows: ReservationRow[];
    isPast?: boolean;
    isCancelled?: boolean;
  }) {
    if (params.loading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Loading…</CardTitle>
          </CardHeader>
        </Card>
      );
    }

    if (!params.rows.length) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{params.emptyLabel}</CardTitle>
            <CardDescription>Ready to discover your next favorite spot?</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/restaurants">Browse Restaurants</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4">
        {params.rows.map((r) => (
          <ReservationCard
            key={r.id}
            reservation={r}
            variant={params.isCancelled ? "cancelled" : params.isPast ? "past" : "upcoming"}
            onChanged={() => void q.refetch()}
          />
        ))}
      </div>
    );
  }
}

function ReservationCard({
  reservation,
  variant,
  onChanged,
}: {
  reservation: ReservationRow;
  variant: "upcoming" | "past" | "cancelled";
  onChanged: () => void;
}) {
  const r = reservation;
  const restaurant = r.restaurant;
  const addrStr = addressToString(restaurant?.address);
  const time = String(r.reservation_time).slice(0, 5);
  const start = reservationStart(r);

  return (
    <Card>
      <CardHeader className="space-y-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">
            {restaurant ? (
              <Link className="underline underline-offset-4" href={`/restaurants/${restaurant.slug}`}>
                {restaurant.name}
              </Link>
            ) : (
              "Restaurant"
            )}
          </CardTitle>
          <CardDescription className="flex flex-wrap gap-2">
            <Badge variant="secondary">{format(parseISO(r.reservation_date), "EEE, MMM d, yyyy")}</Badge>
            <Badge variant="secondary">{time}</Badge>
            <Badge variant="secondary">Party {r.party_size}</Badge>
            <Badge variant="outline">Confirmation {confirmationCode(r.id)}</Badge>
            <Badge variant="outline">{r.status.replace("_", " ")}</Badge>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="text-sm text-muted-foreground">
          {addrStr ? (
            <>
              <div>{addrStr}</div>
              {restaurant?.phone ? (
                <a className="underline underline-offset-4" href={`tel:${restaurant.phone}`}>
                  {restaurant.phone}
                </a>
              ) : null}
            </>
          ) : null}
        </div>

        <Separator />

        <div className="flex flex-wrap gap-2">
          {variant === "upcoming" ? (
            <>
              <ModifyReservationDialog reservation={r} restaurantSlug={restaurant?.slug ?? ""} onDone={onChanged} />
              <CancelReservationDialog reservation={r} onDone={onChanged} />
            </>
          ) : null}

          {variant === "past" ? (
            <>
              <Button asChild variant="outline">
                <Link href={`/reviews/new/${r.id}`}>Leave Review</Link>
              </Button>
              {restaurant ? (
                <Button asChild variant="outline">
                  <Link href={`/restaurants/${restaurant.slug}`}>Book Again</Link>
                </Button>
              ) : null}
            </>
          ) : null}

          {variant === "cancelled" && restaurant ? (
            <Button asChild variant="outline">
              <Link href={`/restaurants/${restaurant.slug}`}>Book Again</Link>
            </Button>
          ) : null}

          {restaurant && addrStr ? (
            <Button asChild variant="outline">
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addrStr)}`} target="_blank" rel="noreferrer">
                Get Directions
              </a>
            </Button>
          ) : null}

          <Button
            variant="outline"
            type="button"
            onClick={() => {
              const links = buildCalendarLinks({
                title: `AfriTable: ${restaurant?.name ?? "Reservation"}`,
                description: `Reservation for ${r.party_size}. Confirmation: ${confirmationCode(r.id)}`,
                location: addrStr || "United States",
                start,
                durationMinutes: 90,
              });
              window.open(links.google, "_blank");
            }}
          >
            Add to Calendar
          </Button>

          <Button
            variant="outline"
            type="button"
            onClick={() => {
              const ics = buildICS({
                uid: r.id,
                title: `AfriTable: ${restaurant?.name ?? "Reservation"}`,
                description: `Reservation for ${r.party_size}. Confirmation: ${confirmationCode(r.id)}`,
                location: addrStr || "United States",
                start,
                durationMinutes: 90,
              });
              const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `afritable-reservation-${confirmationCode(r.id)}.ics`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            }}
          >
            Download .ics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ModifyReservationDialog({
  reservation,
  restaurantSlug,
  onDone,
}: {
  reservation: ReservationRow;
  restaurantSlug: string;
  onDone: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState(reservation.reservation_date);
  const [time, setTime] = React.useState(String(reservation.reservation_time).slice(0, 5));
  const [party, setParty] = React.useState(String(reservation.party_size));
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/modify`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, time, partySize: party === "20+" ? "20+" : Number(party) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || data?.error || "Modify failed");
      toast.success("Reservation updated");
      setOpen(false);
      onDone();
    } catch (e: any) {
      setErr(e.message || "Modify failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Modify</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modify reservation</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <div className="text-sm font-medium">Date</div>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <div className="text-sm font-medium">Time</div>
            <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="HH:mm" />
          </div>
          <div className="grid gap-1.5">
            <div className="text-sm font-medium">Party size</div>
            <Select value={party} onValueChange={setParty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 20 }, (_, i) => String(i + 1)).map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
                <SelectItem value="20+">20+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {err ? (
            <Alert variant="destructive">
              <AlertTitle>Couldn’t modify</AlertTitle>
              <AlertDescription>{err}</AlertDescription>
            </Alert>
          ) : null}
          <p className="text-xs text-muted-foreground">Free modifications up to 2 hours before your reservation.</p>
          <Button onClick={() => void save()} disabled={saving || !restaurantSlug}>
            {saving ? "Saving…" : "Confirm changes"}
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelReservationDialog({ reservation, onDone }: { reservation: ReservationRow; onDone: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function cancel() {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/cancel`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || data?.error || "Cancel failed");
      toast.success("Reservation cancelled");
      setOpen(false);
      onDone();
    } catch (e: any) {
      setErr(e.message || "Cancel failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Cancel</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel reservation?</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 text-sm">
          <p className="text-muted-foreground">Free cancellation up to 2 hours before.</p>
          {err ? (
            <Alert variant="destructive">
              <AlertTitle>Couldn’t cancel</AlertTitle>
              <AlertDescription>{err}</AlertDescription>
            </Alert>
          ) : null}
          <Button onClick={() => void cancel()} disabled={saving}>
            {saving ? "Cancelling…" : "Yes, cancel"}
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Keep reservation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

