import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

interface RouteContext {
  params: Promise<{ bookingId: string }>;
}

async function getEditableBooking(bookingId: string, ownerId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("owner_id", ownerId)
    .eq("source", "manual")
    .maybeSingle();

  return { supabase, booking: data };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { bookingId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const editable = await getEditableBooking(bookingId, user.id);

  if (!editable.booking) {
    return NextResponse.json({ error: "Booking not editable" }, { status: 404 });
  }

  const updatePayload: Database["public"]["Tables"]["bookings"]["Update"] = {
    property_id: body.property_id,
    guest_name: body.guest_name,
    guest_count: body.guest_count,
    check_in: body.check_in,
    check_out: body.check_out,
    notes: body.notes,
    status: body.status,
  };

  const { data, error } = await editable.supabase
    .from("bookings")
    .update(updatePayload as never)
    .eq("id", bookingId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ booking: data });
}

export async function DELETE(_: Request, context: RouteContext) {
  const { bookingId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const editable = await getEditableBooking(bookingId, user.id);

  if (!editable.booking) {
    return NextResponse.json({ error: "Booking not editable" }, { status: 404 });
  }

  const { error } = await editable.supabase.from("bookings").delete().eq("id", bookingId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
