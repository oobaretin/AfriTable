import "server-only";

import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitOrPass(`submit_restaurant_form:${ip}`);
  if (!rl.ok) return NextResponse.redirect(new URL("/submit-restaurant?error=rate_limited", request.url));

  const form = await request.formData();
  const raw = {
    name: String(form.get("name") ?? ""),
    city: String(form.get("city") ?? ""),
    state: String(form.get("state") ?? ""),
    cuisine_types: String(form.get("cuisine_types") ?? ""),
    address: String(form.get("address") ?? ""),
    phone: String(form.get("phone") ?? ""),
    website: String(form.get("website") ?? ""),
    notes: String(form.get("notes") ?? ""),
    submitted_by_email: String(form.get("submitted_by_email") ?? ""),
  };

  const parsed = formSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.redirect(new URL("/submit-restaurant?error=invalid", request.url));

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

  if (error) return NextResponse.redirect(new URL("/submit-restaurant?error=submit_failed", request.url));
  return NextResponse.redirect(new URL("/submit-success", request.url));
}

