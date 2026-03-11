import { NextResponse } from "next/server";
import { runIcalSync } from "@/lib/ical/sync";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runIcalSync(user.id);
  return NextResponse.json({ summary });
}
