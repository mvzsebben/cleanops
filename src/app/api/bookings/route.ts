import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", body.property_id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const insertPayload: Database["public"]["Tables"]["bookings"]["Insert"] = {
    property_id: body.property_id,
    owner_id: user.id,
    guest_name: body.guest_name,
    guest_count: body.guest_count,
    check_in: body.check_in,
    check_out: body.check_out,
    notes: body.notes,
    source: "manual",
    status: body.status,
  };

  const { data, error } = await supabase
    .from("bookings")
    .insert(insertPayload as never)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ booking: data });
}
