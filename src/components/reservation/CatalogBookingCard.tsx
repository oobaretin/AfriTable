"use client";

import * as React from "react";
import Link from "next/link";
import { addDays, format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/reservation/Confetti";

type TimePreference = "morning" | "afternoon" | "evening" | "flexible";

const TIME_OPTIONS: { value: TimePreference; label: string; hint: string }[] = [
  { value: "morning", label: "Morning", hint: "Before 12pm" },
  { value: "afternoon", label: "Afternoon", hint: "12pm – 5pm" },
  { value: "evening", label: "Evening", hint: "After 5pm" },
  { value: "flexible", label: "Flexible", hint: "Any time works" },
];

export function CatalogBookingCard({
  restaurantSlug,
  restaurantName,
  phone,
  website,
  googleMapsUrl,
  address,
}: {
  restaurantSlug: string;
  restaurantName: string;
  phone?: string | null;
  website?: string | null;
  googleMapsUrl?: string | null;
  address?: string | null;
}) {
  const [date, setDate] = React.useState<Date | undefined>(addDays(new Date(), 1));
  const [timePreference, setTimePreference] = React.useState<TimePreference>("evening");
  const [partySize, setPartySize] = React.useState(2);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [guestPhone, setGuestPhone] = React.useState("");
  const [specialRequests, setSpecialRequests] = React.useState("");
  const [notifyWhenLive, setNotifyWhenLive] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<{ referenceCode: string } | null>(null);
  const [showConfetti, setShowConfetti] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError("Please choose a preferred date.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/table-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantSlug,
          preferredDate: format(date, "yyyy-MM-dd"),
          timePreference,
          partySize,
          guest: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: guestPhone.trim(),
          },
          specialRequests: specialRequests.trim() || null,
          notifyWhenLive,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message || body?.error || "Could not send your request. Please try again.");
      }

      setShowConfetti(true);
      setSuccess({ referenceCode: body.referenceCode ?? "—" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        {showConfetti && <Confetti />}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
          <div className="py-6 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-orange-600"
                aria-hidden
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="mb-2 text-2xl font-bold text-slate-900">Request received</h3>
            <p className="mb-4 text-slate-600">
              We saved your preferred visit to <strong>{restaurantName}</strong> and emailed you a copy. The restaurant
              may confirm by phone — we don&apos;t manage their reservations yet.
            </p>
            <p className="text-sm text-slate-500">
              Reference: <span className="font-mono font-semibold">{success.referenceCode}</span>
            </p>
            {phone ? (
              <p className="mt-4 text-sm text-slate-600">
                You can also call directly:{" "}
                <a href={`tel:${phone}`} className="font-medium text-orange-600 hover:underline">
                  {phone}
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
      <h3 className="mb-1 text-xl font-bold text-slate-900">Plan your visit</h3>
      <p className="mb-4 text-sm text-slate-500">
        Directory listing — AfriTable doesn&apos;t manage reservations here yet. Call the restaurant, or send us your
        preferred date and we&apos;ll forward your request.
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {phone ? (
          <Button asChild size="sm" variant="outline">
            <a href={`tel:${phone}`}>Call</a>
          </Button>
        ) : null}
        {website ? (
          <Button asChild size="sm" variant="outline">
            <a href={website} target="_blank" rel="noreferrer">
              Website
            </a>
          </Button>
        ) : null}
        {googleMapsUrl ? (
          <Button asChild size="sm" variant="outline">
            <a href={googleMapsUrl} target="_blank" rel="noreferrer">
              Directions
            </a>
          </Button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Guests</Label>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-2">
            <button
              type="button"
              onClick={() => setPartySize(Math.max(1, partySize - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100"
              aria-label="Decrease party size"
            >
              −
            </button>
            <span className="text-lg font-bold text-slate-900">
              {partySize} {partySize === 1 ? "Guest" : "Guests"}
            </span>
            <button
              type="button"
              onClick={() => setPartySize(Math.min(20, partySize + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100"
              aria-label="Increase party size"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <Label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Preferred date</Label>
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="w-full rounded-xl border border-slate-200 p-3 text-left text-sm font-medium transition-all hover:bg-slate-50 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                {date ? format(date, "MMM d, yyyy") : "Select date"}
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[360px]">
              <DialogHeader>
                <DialogTitle>Preferred date</DialogTitle>
              </DialogHeader>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(d) => d < new Date() || d > addDays(new Date(), 90)}
                initialFocus
              />
            </DialogContent>
          </Dialog>
        </div>

        <div>
          <Label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Time preference</Label>
          <div className="grid grid-cols-2 gap-2">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTimePreference(opt.value)}
                className={`rounded-xl border p-3 text-left text-sm transition-all ${
                  timePreference === opt.value
                    ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="font-semibold text-slate-900">{opt.label}</div>
                <div className="text-xs text-slate-500">{opt.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="catalog-first-name">First name</Label>
            <Input id="catalog-first-name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="catalog-last-name">Last name</Label>
            <Input id="catalog-last-name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div>
          <Label htmlFor="catalog-email">Email</Label>
          <Input
            id="catalog-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="catalog-phone">Phone</Label>
          <Input
            id="catalog-phone"
            type="tel"
            required
            autoComplete="tel"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="catalog-notes">Notes (optional)</Label>
          <Textarea
            id="catalog-notes"
            rows={2}
            maxLength={500}
            placeholder="Allergies, occasion, seating preference…"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
          <Checkbox checked={notifyWhenLive} onCheckedChange={(v) => setNotifyWhenLive(v === true)} className="mt-0.5" />
          <span>Email me when live booking opens for this restaurant on AfriTable</span>
        </label>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="btn-bronze w-full rounded-xl px-10 py-4 text-sm font-bold uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Send table request"}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
        <p className="text-sm font-semibold text-slate-800">Own this restaurant?</p>
        <p className="mt-1 text-xs text-slate-500">
          Claim your listing to turn on live booking, manage tables, and receive requests in your dashboard.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="default">
            <Link href={`/restaurant/${encodeURIComponent(restaurantSlug)}/claim`}>Claim listing</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/join-as-restaurant">Partner with AfriTable</Link>
          </Button>
        </div>
      </div>

      {address ? <p className="mt-4 text-center text-xs text-slate-400">{address}</p> : null}

      <p className="mt-3 text-center text-xs text-slate-400">
        AfriTable directory · not a confirmed reservation until the restaurant responds
      </p>
    </div>
  );
}
