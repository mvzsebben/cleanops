import { NextResponse } from "next/server";
import { bootstrapOwnerData } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  await bootstrapOwnerData({
    ...user,
    user_metadata: {
      ...user.user_metadata,
      full_name: body.fullName ?? user.user_metadata.full_name,
      company_name: body.companyName ?? user.user_metadata.company_name,
      phone: body.phone ?? user.user_metadata.phone,
      timezone: body.timezone ?? user.user_metadata.timezone,
    },
  });

  return NextResponse.json({ ok: true });
}
