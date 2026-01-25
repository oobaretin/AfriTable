import "server-only";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { rateLimitOrPass } from "@/lib/security/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const formSchema = z.object({
  name: z.string().min(2).max(200),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(40),
  cuisine_types: z.string().optional().default(""),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  website: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  submitted_by_email: z.string().email().optional().or(z.literal("")).default(""),
});

function parseCuisineTypes(input: string): string[] | null {
  const list = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);
  return list.length ? list : null;
}

export default function SubmitRestaurantPage() {
  async function submitRestaurant(formData: FormData) {
    "use server";

    const h = headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimitOrPass(`submit_restaurant_form:${ip}`);
    if (!rl.ok) redirect(`/submit-restaurant?error=rate_limited`);

    const raw = {
      name: String(formData.get("name") ?? ""),
      city: String(formData.get("city") ?? ""),
      state: String(formData.get("state") ?? ""),
      cuisine_types: String(formData.get("cuisine_types") ?? ""),
      address: String(formData.get("address") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      website: String(formData.get("website") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      submitted_by_email: String(formData.get("submitted_by_email") ?? ""),
    };

    const parsed = formSchema.safeParse(raw);
    if (!parsed.success) redirect(`/submit-restaurant?error=invalid`);

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("restaurant_submissions").insert({
      name: parsed.data.name,
      city: parsed.data.city,
      state: parsed.data.state,
      cuisine_types: parseCuisineTypes(parsed.data.cuisine_types),
      address: parsed.data.address.trim() ? parsed.data.address.trim() : null,
      phone: parsed.data.phone.trim() ? parsed.data.phone.trim() : null,
      website: parsed.data.website.trim() ? parsed.data.website.trim() : null,
      notes: parsed.data.notes.trim() ? parsed.data.notes.trim() : null,
      submitted_by_email: parsed.data.submitted_by_email.trim() ? parsed.data.submitted_by_email.trim() : null,
      status: "pending",
    });

    if (error) redirect(`/submit-restaurant?error=submit_failed`);
    redirect(`/submit-restaurant?submitted=1`);
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-10 md:py-14">
      <h1 className="mb-2 text-2xl font-bold">Submit an African Restaurant</h1>

      <p className="mb-6 text-muted-foreground">Know a great African restaurant? Help the community discover it.</p>

      <form action={submitRestaurant} method="post" className="space-y-4">
        <input name="name" required placeholder="Restaurant name" className="w-full rounded-md border bg-background px-3 py-2" />
        <input name="city" required placeholder="City" className="w-full rounded-md border bg-background px-3 py-2" />
        <input name="state" required placeholder="State" className="w-full rounded-md border bg-background px-3 py-2" />

        <input
          name="cuisine_types"
          placeholder="Cuisine (e.g. Nigerian, Ethiopian)"
          className="w-full rounded-md border bg-background px-3 py-2"
        />

        <input name="address" placeholder="Address (optional)" className="w-full rounded-md border bg-background px-3 py-2" />
        <input name="phone" placeholder="Phone (optional)" className="w-full rounded-md border bg-background px-3 py-2" />
        <input name="website" placeholder="Website or Instagram" className="w-full rounded-md border bg-background px-3 py-2" />

        <textarea
          name="notes"
          placeholder="Anything else we should know?"
          className="min-h-[110px] w-full rounded-md border bg-background px-3 py-2"
        />

        <input
          name="submitted_by_email"
          type="email"
          placeholder="Your email (optional)"
          className="w-full rounded-md border bg-background px-3 py-2"
        />

        <button type="submit" className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground">
          Submit Restaurant
        </button>
      </form>
    </div>
  );
}

