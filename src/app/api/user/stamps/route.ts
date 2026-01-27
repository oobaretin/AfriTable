import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/utils";

export async function POST(request: Request) {
  const user = await requireAuth();
  const supabase = createSupabaseServerClient();

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

  // Store stamp in database (using reviews table or creating a stamps table)
  // For now, we'll use a simple approach: store in a JSON column or create stamps table
  // Let's check if stamps table exists, otherwise we'll use reviews table with a flag
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
    // If stamps table doesn't exist, we'll need to create it or use reviews table
    // For now, return error with instructions
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
