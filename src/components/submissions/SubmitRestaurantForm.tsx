"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const schema = z.object({
  name: z.string().min(2, "Restaurant name is required.").max(200),
  city: z.string().min(2, "City is required.").max(80),
  state: z.string().min(2, "State is required.").max(40),
  cuisineTypes: z.string().max(500),
  address: z.string().max(300),
  phone: z.string().max(80),
  website: z
    .string()
    .max(2000)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "Enter a valid URL (must start with http:// or https://)."),
  notes: z.string().max(2000),
  submittedByEmail: z.string().email("Enter a valid email.").max(320),
});

type Values = z.infer<typeof schema>;

function parseCuisines(input: string): string[] | null {
  const list = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);
  return list.length ? list : null;
}

export default function SubmitRestaurantForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      city: "",
      state: "",
      cuisineTypes: "",
      address: "",
      phone: "",
      website: "",
      notes: "",
      submittedByEmail: "",
    },
    mode: "onSubmit",
  });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = {
        name: values.name,
        city: values.city,
        state: values.state,
        cuisine_types: parseCuisines(values.cuisineTypes),
        address: values.address || null,
        phone: values.phone || null,
        website: values.website || null,
        notes: values.notes || null,
        submitted_by_email: values.submittedByEmail,
      };

      const res = await fetch("/api/submissions/restaurants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.message || json?.error || "Could not submit restaurant.");
        return;
      }

      setSuccess(true);
      form.reset();
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not submit restaurant.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4">
      {success ? (
        <Alert>
          <AlertTitle>Submitted!</AlertTitle>
          <AlertDescription>
            Thanks — your submission is now <Badge variant="secondary">pending</Badge>. We’ll review it soon.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Submission failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Restaurant name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Lagos Kitchen" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Houston" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. TX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="cuisineTypes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cuisine types</FormLabel>
                <FormControl>
                  <Input placeholder="Comma-separated (e.g. Nigerian, Caribbean)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Street address (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Anything helpful: hours, Instagram link, menu link, etc."
                    className="min-h-[110px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="submittedByEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Submitting..." : "Submit restaurant"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

