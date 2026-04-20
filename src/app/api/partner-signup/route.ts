import { NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml, sendSiteInboxNotification } from "@/lib/email/site-inbox";

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

    await sendSiteInboxNotification({
      subject: `[AfriTable] Partner application: ${data.businessName}`,
      htmlBody: `<p><strong>Business:</strong> ${escapeHtml(data.businessName)}</p>
<p><strong>Cuisine:</strong> ${escapeHtml(data.cuisineType)}</p>
<p><strong>Contact name:</strong> ${escapeHtml(data.contactName)}</p>
<p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
<p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>`,
      replyTo: data.email,
    });

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
