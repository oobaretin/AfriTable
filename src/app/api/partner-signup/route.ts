import { NextResponse } from "next/server";
import { z } from "zod";

const partnerSignupSchema = z.object({
  businessName: z.string().min(2),
  cuisineType: z.string().min(1),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = partnerSignupSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // TODO: Store in database or send to email service
    // For now, just log and return success
    console.log("[Partner Signup]", {
      businessName: data.businessName,
      cuisineType: data.cuisineType,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      timestamp: new Date().toISOString(),
    });

    // In production, you would:
    // 1. Save to database (e.g., a partner_submissions table)
    // 2. Send notification email to admin team
    // 3. Send confirmation email to the applicant

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("[Partner Signup] Error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to process submission" },
      { status: 500 }
    );
  }
}
