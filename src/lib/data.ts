import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CLIENT_SEED, DEFAULT_TIMEZONE } from "@/lib/constants";
import type { Database } from "@/lib/supabase/types";
import type { BookingRecord, ClientWithProperties, ProfileRecord, SyncLogRecord } from "@/types/app";

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return data.user;
}

export async function bootstrapOwnerData(user: {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; company_name?: string; phone?: string; timezone?: string };
}) {
  const admin = createSupabaseAdminClient();
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    const profilePayload: Database["public"]["Tables"]["profiles"]["Insert"] = {
      id: user.id,
      email: user.email ?? "",
      full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "CleanOps Owner",
      company_name: user.user_metadata?.company_name ?? "CleanOps",
      phone: user.user_metadata?.phone ?? null,
      timezone: user.user_metadata?.timezone ?? DEFAULT_TIMEZONE,
      subscription_tier: "growth",
      onboarding_completed: true,
    };

    await admin.from("profiles").insert(profilePayload as never);
  }

  const { count } = await admin
    .from("clients")
    .select("*", { head: true, count: "exact" })
    .eq("owner_id", user.id);

  if ((count ?? 0) > 0) {
    return;
  }

  for (const clientSeed of CLIENT_SEED) {
    const { data: client, error: clientError } = await admin
      .from("clients")
      .insert({
        owner_id: user.id,
        name: clientSeed.name,
        colour: clientSeed.colour,
        data_source: clientSeed.data_source,
        notification_preference: clientSeed.notification_preference,
      } as never)
      .select("*")
      .single();

    if (clientError || !client) {
      throw clientError ?? new Error("Failed to seed client");
    }

    const savedClient = client as unknown as { id: string };

    const properties = clientSeed.properties.map((property) => ({
      client_id: savedClient.id,
      owner_id: user.id,
      name: property.name,
      type: property.type,
      bedrooms: property.type === "airbnb" ? 2 : 1,
      bathrooms: 1,
      default_clean_duration_minutes: property.type === "airbnb" ? 180 : 120,
      default_clean_price: property.type === "airbnb" ? 180 : 120,
      check_in_time: "15:00",
      check_out_time: "10:00",
      has_laundry_service: false,
    }));

    await admin.from("properties").insert(properties as never);
  }
}

export async function getProfile(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data as ProfileRecord | null;
}

export async function getClientsWithProperties(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("clients")
    .select("*, properties(*)")
    .eq("owner_id", userId)
    .order("name", { ascending: true })
    .order("name", { foreignTable: "properties", ascending: true });

  return ((data ?? []) as unknown as ClientWithProperties[]).map((client) => ({
    ...client,
    properties: (client.properties ?? []).sort((left, right) => left.name.localeCompare(right.name)),
  }));
}

export async function getBookings(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("owner_id", userId)
    .order("check_out", { ascending: true });

  return (data ?? []) as BookingRecord[];
}

export async function getLatestSyncLogs(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_id", userId);

  const typedProperties = (properties ?? []) as Array<{ id: string }>;
  const propertyIds = typedProperties.map((property) => property.id);
  if (propertyIds.length === 0) return {};

  const { data: logs } = await supabase
    .from("ical_sync_log")
    .select("*")
    .in("property_id", propertyIds)
    .order("synced_at", { ascending: false });

  const typedLogs = (logs ?? []) as SyncLogRecord[];

  return typedLogs.reduce<Record<string, SyncLogRecord>>((accumulator, log) => {
    if (!log.property_id || accumulator[log.property_id]) return accumulator;
    accumulator[log.property_id] = log;
    return accumulator;
  }, {});
}

export async function getDashboardData(userId: string) {
  const [profile, clients, bookings, latestLogs] = await Promise.all([
    getProfile(userId),
    getClientsWithProperties(userId),
    getBookings(userId),
    getLatestSyncLogs(userId),
  ]);

  return {
    profile,
    clients: clients.map((client) => ({
      ...client,
      properties: client.properties.map((property) => ({
        ...property,
        latestSyncLog: latestLogs[property.id] ?? null,
      })),
    })),
    bookings,
  };
}
