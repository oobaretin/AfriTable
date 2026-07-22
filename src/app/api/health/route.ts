import { NextResponse } from "next/server";
import { getNotificationEmailStatus } from "@/lib/email/notification-email-status";

export const dynamic = "force-dynamic";

export function GET() {
  const notifications = getNotificationEmailStatus();

  return NextResponse.json({
    ok: true,
    notifications,
  });
}
