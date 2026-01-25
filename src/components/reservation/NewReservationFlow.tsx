"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildCalendarLinks, buildICS } from "@/lib/email/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAvailability } from "@/components/reservation/AvailabilityChecker";

// Simple US phone validation (accepts +1, parentheses, spaces, dashes)
const phoneRegex = /^\+?1?\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

const guestSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().regex(phoneRegex, "Enter a valid US phone number."),
  specialRequests: z.string().max(500, "Max 500 characters.").optional().default(""),
  occasion: z.enum(["Birthday", "Anniversary", "Date Night", "Business", "Celebration", "Other", "None"]).default("None"),
  smsOptIn: z.boolean().default(false),
  createAccount: z.boolean().default(false),
});

type GuestValues = z.input<typeof guestSchema>;

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

type Confirmation = {
  id: string;
  confirmationCode: string;
  date: string;
  time: string;
  partySize: number;
  specialRequests?: string | null;
  occasion?: string | null;
};

export function NewReservationFlow({ summary }: { summary: ReservationSummary }) {
  const router = useRouter();
  const params = useSearchParams();

  const restaurantSlug = params.get("restaurant") ?? summary.restaurant.slug;
  const date = params.get("date");
  const time = params.get("time");
  const party = params.get("party");

  const [step, setStep] = React.useState<"guest" | "confirmed">("guest");
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [confirmation, setConfirmation] = React.useState<Confirmation | null>(null);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  const form = useForm<GuestValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      specialRequests: "",
      occasion: "None",
      smsOptIn: false,
      createAccount: false,
    },
    mode: "onSubmit",
  });

  // Prefill from profile if logged in
  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setIsLoggedIn(true);
      const { data: profile } = await supabase.from("profiles").select("full_name,phone").eq("id", data.user.id).maybeSingle();
      const fullName = profile?.full_name ?? "";
      const [firstName = "", ...rest] = fullName.split(" ");
      const lastName = rest.join(" ");
      form.setValue("firstName", firstName || form.getValues("firstName"));
      form.setValue("lastName", lastName || form.getValues("lastName"));
      form.setValue("email", data.user.email ?? form.getValues("email"));
      if (profile?.phone) form.setValue("phone", profile.phone);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dateLabel = date ? format(parseISO(date), "EEE, MMM d, yyyy") : "—";
  const partyLabel = party ?? "—";

  const availability = useAvailability({
    restaurantId: summary.restaurant.id,
    date: date ?? format(new Date(), "yyyy-MM-dd"),
    partySize: party ?? "2",
  });
  const currentSlot = availability.data?.slots?.find((s) => s.time === time) ?? null;
  const isTimeAvailable = Boolean(currentSlot && currentSlot.status !== "unavailable" && currentSlot.availableTables > 0);

  async function submit(values: GuestValues) {
    if (!date || !time || !party) {
      setFormError("Missing reservation details. Please go back and pick a time.");
      return;
    }

    const v = guestSchema.parse(values);
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        restaurantSlug,
        date,
        time,
        partySize: party === "20+" ? "20+" : Number(party),
        guest: {
          firstName: v.firstName,
          lastName: v.lastName,
          email: v.email,
          phone: v.phone,
        },
        specialRequests: v.specialRequests || null,
        occasion: v.occasion,
        smsOptIn: v.smsOptIn,
        createAccount: !isLoggedIn && v.createAccount,
      };

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFormError(data?.message || data?.error || "Could not create reservation.");
        return;
      }

      const conf: Confirmation = {
        id: data.reservation.id,
        confirmationCode: data.reservation.confirmationCode,
        date: data.reservation.reservation_date,
        time: data.reservation.reservation_time,
        partySize: data.reservation.party_size,
        specialRequests: data.reservation.special_requests,
        occasion: data.reservation.occasion,
      };
      setConfirmation(conf);
      setStep("confirmed");
      router.replace(`/reservations/new?restaurant=${encodeURIComponent(restaurantSlug)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&party=${encodeURIComponent(party)}&confirmed=1&id=${encodeURIComponent(conf.id)}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

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

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {step === "guest" ? (
            <Card>
              <CardHeader>
                <CardTitle>Guest details</CardTitle>
                <CardDescription>Tell us who we should expect at the table.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                {!availability.isLoading && !isTimeAvailable ? (
                  <Alert variant="destructive">
                    <AlertTitle>No availability for {time}</AlertTitle>
                    <AlertDescription>
                      This time is no longer available. Please go back and pick a different time.
                    </AlertDescription>
                  </Alert>
                ) : null}
                <Form {...form}>
                  <form className="grid gap-4" onSubmit={form.handleSubmit((v) => void submit(v))}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" autoComplete="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input autoComplete="tel" placeholder="(555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="specialRequests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Requests</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Allergies, dietary restrictions, celebrations, etc."
                              className="min-h-24"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="occasion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Occasion</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["None", "Birthday", "Anniversary", "Date Night", "Business", "Celebration", "Other"].map((o) => (
                                <SelectItem key={o} value={o as any}>
                                  {o}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-wrap gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.watch("smsOptIn")}
                          onChange={(e) => form.setValue("smsOptIn", e.target.checked)}
                        />
                        Send me SMS reminders
                      </label>
                      {!isLoggedIn ? (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.watch("createAccount")}
                            onChange={(e) => form.setValue("createAccount", e.target.checked)}
                          />
                          Create an account to manage reservations
                        </label>
                      ) : null}
                    </div>

                    {formError ? (
                      <Alert variant="destructive">
                        <AlertTitle>Couldn’t book your reservation</AlertTitle>
                        <AlertDescription>{formError}</AlertDescription>
                      </Alert>
                    ) : null}

                    <Button type="submit" disabled={submitting || !isTimeAvailable}>
                      {submitting ? "Booking…" : "Confirm reservation"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Reservation Confirmed!</CardTitle>
                <CardDescription>We emailed your confirmation and calendar invite.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {confirmation ? (
                  <>
                    <div className="rounded-xl border bg-muted/20 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Confirmation</div>
                          <div className="text-lg font-semibold">{confirmation.confirmationCode}</div>
                        </div>
                        <Badge variant="secondary">Confirmed</Badge>
                      </div>
                      <Separator className="my-3" />
                      <div className="grid gap-1 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">{summary.restaurant.name}</span>
                        </div>
                        <div>{summary.restaurant.address}</div>
                        <div>
                          {confirmation.date} • {confirmation.time} • Party of {confirmation.partySize}
                        </div>
                        {confirmation.specialRequests ? (
                          <div>Requests: {confirmation.specialRequests}</div>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                          const start = new Date(`${confirmation.date}T${confirmation.time}:00`);
                          const links = buildCalendarLinks({
                            title: `AfriTable: ${summary.restaurant.name}`,
                            description: `Reservation for ${confirmation.partySize}. Confirmation: ${confirmation.confirmationCode}`,
                            location: summary.restaurant.address,
                            start,
                            durationMinutes: 90,
                          });
                          window.open(links.google, "_blank");
                        }}
                      >
                        Add to Google Calendar
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                          const start = new Date(`${confirmation.date}T${confirmation.time}:00`);
                          const ics = buildICS({
                            uid: confirmation.id,
                            title: `AfriTable: ${summary.restaurant.name}`,
                            description: `Reservation for ${confirmation.partySize}. Confirmation: ${confirmation.confirmationCode}`,
                            location: summary.restaurant.address,
                            start,
                            durationMinutes: 90,
                          });
                          const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `afritable-reservation-${confirmation.confirmationCode}.ics`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        Download .ics (Apple/Outlook)
                      </Button>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button asChild variant="outline">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(summary.restaurant.address)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Get Directions
                        </a>
                      </Button>
                      <Button asChild>
                        <Link href="/">Back to Home</Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading confirmation…</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary sidebar */}
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
                <Badge variant="secondary">Party {partyLabel}</Badge>
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

