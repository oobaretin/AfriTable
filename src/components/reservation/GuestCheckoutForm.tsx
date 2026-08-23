"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAvailability } from "@/components/reservation/AvailabilityChecker";
import { isSlotSelectable } from "@/lib/reservation/slot-selection";
import type { ReservationSummary } from "@/components/reservation/NewReservationFlow";

const phoneRegex = /^\+?1?\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

const guestSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().regex(phoneRegex, "Enter a valid US phone number."),
  specialRequests: z.string().max(500, "Max 500 characters.").optional().default(""),
  occasion: z
    .enum(["Birthday", "Anniversary", "Date Night", "Business", "Celebration", "Other", "None"])
    .default("None"),
  smsOptIn: z.boolean().default(false),
  createAccount: z.boolean().default(false),
});

type GuestValues = z.input<typeof guestSchema>;

export type GuestCheckoutFormProps = {
  summary: ReservationSummary;
  restaurantSlug: string;
  date: string;
  time: string;
  party: string;
  onSuccess: (confirmation: { id: string; confirmationCode: string }) => void;
  onBack?: () => void;
  submitLabel?: string;
};

export function GuestCheckoutForm({
  summary,
  restaurantSlug,
  date,
  time,
  party,
  onSuccess,
  onBack,
  submitLabel = "Confirm reservation",
}: GuestCheckoutFormProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
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

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setIsLoggedIn(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,phone")
        .eq("id", data.user.id)
        .maybeSingle();
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

  const availability = useAvailability({
    restaurantId: summary.restaurant.id,
    date,
    partySize: party,
  });

  const slots = availability.data?.slots ?? [];
  const currentSlot = slots.find((s) => s.time === time) ?? null;
  const isTimeAvailable = Boolean(
    currentSlot && currentSlot.status !== "unavailable" && currentSlot.availableTables > 0,
  );
  const selectableSlots = slots.filter(isSlotSelectable);
  const showAvailabilityProblem =
    !availability.isPending && availability.isFetched && Boolean(time) && !isTimeAvailable;

  async function submit(values: GuestValues) {
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

      onSuccess({
        id: data.reservation.id,
        confirmationCode: data.reservation.confirmationCode,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4">
      {showAvailabilityProblem ? (
        <Alert variant="destructive">
          <AlertTitle>
            {availability.isSuccess && slots.length > 0 && selectableSlots.length === 0
              ? "No openings for this party size"
              : `No availability for ${time}`}
          </AlertTitle>
          <AlertDescription>
            {availability.isSuccess && slots.length > 0 && selectableSlots.length === 0
              ? "Try fewer guests, another day, or go back to pick a different time."
              : "That time is no longer available. Go back and choose another slot."}
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
                  <FormLabel>First name</FormLabel>
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
                  <FormLabel>Last name</FormLabel>
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
                <FormLabel>Special requests</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Allergies, dietary restrictions, celebrations, etc."
                    className="min-h-20"
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
                    {["None", "Birthday", "Anniversary", "Date Night", "Business", "Celebration", "Other"].map(
                      (o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.watch("smsOptIn")}
                onChange={(e) => form.setValue("smsOptIn", e.target.checked)}
              />
              SMS reminders
            </label>
            {!isLoggedIn ? (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.watch("createAccount")}
                  onChange={(e) => form.setValue("createAccount", e.target.checked)}
                />
                Create account
              </label>
            ) : null}
          </div>

          {formError ? (
            <Alert variant="destructive">
              <AlertTitle>Couldn&apos;t book your reservation</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            {onBack ? (
              <Button type="button" variant="outline" onClick={onBack} className="sm:flex-1">
                Back
              </Button>
            ) : null}
            <Button type="submit" disabled={submitting || !isTimeAvailable} className="sm:flex-1">
              {submitting ? "Booking…" : submitLabel}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
