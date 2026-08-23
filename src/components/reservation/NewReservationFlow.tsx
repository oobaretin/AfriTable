"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GuestCheckoutForm } from "@/components/reservation/GuestCheckoutForm";
import { useAvailability } from "@/components/reservation/AvailabilityChecker";
import { pickNearestSelectableSlot } from "@/lib/reservation/slot-selection";

export type ReservationSummary = {
  restaurant: {
    id: string;
    slug: string;
    name: string;
    address: string;
    phone: string | null;
    image: string | null;
  };
};

export function NewReservationFlow({ summary }: { summary: ReservationSummary }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const restaurantSlug = params.get("restaurant") ?? summary.restaurant.slug;
  const date = params.get("date");
  const time = params.get("time");
  const party = params.get("party");

  const availability = useAvailability({
    restaurantId: summary.restaurant.id,
    date: date ?? format(new Date(), "yyyy-MM-dd"),
    partySize: party ?? "2",
  });

  React.useEffect(() => {
    if (!date || !time || !availability.isSuccess || availability.isError) return;
    const slotList = availability.data?.slots ?? [];
    if (!slotList.length) return;
    const replacement = pickNearestSelectableSlot(time, slotList);
    if (!replacement || replacement.time === time) return;
    const next = new URLSearchParams(params.toString());
    next.set("time", replacement.time);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [date, time, availability.isSuccess, availability.isError, availability.data, pathname, router, params]);

  if (!date || !time || !party) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-14">
        <Card>
          <CardHeader>
            <CardTitle>Missing reservation details</CardTitle>
            <CardDescription>
              Please go back to the restaurant page and pick a date, time, and party size.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/restaurants/${encodeURIComponent(summary.restaurant.slug)}`}>Back to restaurant</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dateLabel = format(parseISO(date), "EEE, MMM d, yyyy");

  function handleSuccess(confirmation: { id: string; confirmationCode: string }) {
    const successParams = new URLSearchParams({
      restaurant: restaurantSlug,
      date: date!,
      time: time!,
      party: party!,
      code: confirmation.confirmationCode,
      id: confirmation.id,
    });
    router.push(`/reservation-success?${successParams.toString()}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Guest details</CardTitle>
              <CardDescription>Tell us who we should expect at the table.</CardDescription>
            </CardHeader>
            <CardContent>
              <GuestCheckoutForm
                summary={summary}
                restaurantSlug={restaurantSlug}
                date={date}
                time={time}
                party={party}
                onSuccess={handleSuccess}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle className="text-base">Your reservation</CardTitle>
              <CardDescription>Review details before confirming.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="text-sm">
                <div className="font-medium">{summary.restaurant.name}</div>
                <div className="text-muted-foreground">{summary.restaurant.address}</div>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{dateLabel}</Badge>
                <Badge variant="secondary">{time}</Badge>
                <Badge variant="secondary">Party {party}</Badge>
              </div>
              <Button asChild variant="outline">
                <Link href={`/restaurants/${encodeURIComponent(summary.restaurant.slug)}`}>Change</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
