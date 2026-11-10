import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

const LOG_FILE = join(process.cwd(), ".cursor", "debug-c696a7.log");

/** Dev-only: append NDJSON debug lines from client instrumentation (same-origin). */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  try {
    const body = await req.json();
    mkdirSync(join(process.cwd(), ".cursor"), { recursive: true });
    appendFileSync(LOG_FILE, `${JSON.stringify(body)}\n`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
