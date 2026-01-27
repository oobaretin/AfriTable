import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/utils";

export async function GET() {
  const user = await requireAuth();
  const supabase = createSupabaseServerClient();

  const { data: stamps, error } = await supabase
    .from("stamps" as any)
    .select("id, event_type, created_at")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching user stamps:", error);
    return NextResponse.json({ error: "query_failed", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ stamps: stamps || [] });
}

export async function POST(request: Request) {
  const user = await requireAuth();
  const supabase = createSupabaseServerClient();

  const json = await request.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: "invalid_payload", message: "Request body is required" }, { status: 400 });
  }

  const { event_type, stamp_description, reservation_id, restaurant_id } = json;

  // For event stamps (like Carnival challenge), we don't need a photo or reservation
  if (event_type) {
    // Check if stamp already exists
    const { data: existing } = await supabase
      .from("stamps" as any)
      .select("id")
      .eq("user_id", user.id)
      .eq("event_type", event_type)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, stamp: existing, message: "Stamp already unlocked" });
    }

    // Create event stamp (without photo_url requirement)
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: stamp, error: insertError } = await supabaseAdmin
      .from("stamps" as any)
      .insert({
        user_id: user.id,
        reservation_id: reservation_id || null,
        restaurant_id: restaurant_id || null,
        photo_url: "", // Empty for event stamps
        review_text: stamp_description || null,
        event_type: event_type,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        {
          error: "database_error",
          message: "Failed to unlock stamp.",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      stamp,
    });
  }

  // Original photo upload logic for regular stamps
  const formData = await request.formData();
  const photo = formData.get("photo") as File | null;
  const reservationId = formData.get("reservationId") as string | null;
  const reviewText = (formData.get("reviewText") as string | null) || "";

  if (!photo || !reservationId) {
    return NextResponse.json({ error: "missing_fields", message: "Photo and reservation ID are required" }, { status: 400 });
  }

  // Verify reservation belongs to user
  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .select("id, restaurant_id, reservation_date")
    .eq("id", reservationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (reservationError || !reservation) {
    return NextResponse.json({ error: "reservation_not_found" }, { status: 404 });
  }

  // Get restaurant info
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug, cuisine_types, address")
    .eq("id", reservation.restaurant_id)
    .maybeSingle();

  if (!restaurant) {
    return NextResponse.json({ error: "restaurant_not_found" }, { status: 404 });
  }

  // Upload photo to Supabase Storage
  const supabaseAdmin = createSupabaseAdminClient();
  const ext = photo.name.split(".").pop() || "jpg";
  const path = `stamps/${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("stamp-photos")
    .upload(path, photo, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json(
      { error: "upload_failed", message: "Failed to upload photo. Please ensure 'stamp-photos' bucket exists." },
      { status: 500 }
    );
  }

  const { data: urlData } = supabaseAdmin.storage.from("stamp-photos").getPublicUrl(path);
  const photoUrl = urlData.publicUrl;

  // Store stamp in database
  const { data: stamp, error: insertError } = await supabaseAdmin
    .from("stamps" as any)
    .insert({
      user_id: user.id,
      reservation_id: reservationId,
      restaurant_id: reservation.restaurant_id,
      photo_url: photoUrl,
      review_text: reviewText || null,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (insertError) {
    console.error("Insert error:", insertError);
    return NextResponse.json(
      {
        error: "database_error",
        message: "Failed to save stamp. Please ensure 'stamps' table exists in Supabase.",
        details: insertError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    stamp: {
      ...stamp,
      restaurant: {
        name: restaurant.name,
        slug: restaurant.slug,
        cuisine: Array.isArray(restaurant.cuisine_types) ? restaurant.cuisine_types[0] : null,
        city: restaurant.address ? extractCity(restaurant.address) : null,
      },
    },
  });
}

function extractCity(address: any): string {
  if (!address) return "";
  if (typeof address === "string") {
    const parts = address.split(",");
    return parts.length > 0 ? parts[parts.length - 2]?.trim() || "" : "";
  }
  if (typeof address === "object" && address !== null) {
    return (address as any).city || "";
  }
  return "";
}
