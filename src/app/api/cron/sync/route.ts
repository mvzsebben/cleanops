import { NextResponse } from "next/server";
import { runIcalSync } from "@/lib/ical/sync";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runIcalSync();
  return NextResponse.json({ summary });
}
