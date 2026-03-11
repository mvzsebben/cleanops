import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchAndParseIcalFeed, type ParsedIcalEvent } from "@/lib/ical/parser";

export async function runIcalSync(ownerId?: string) {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("properties")
    .select("id, owner_id, name, ical_url")
    .not("ical_url", "is", null)
    .eq("is_active", true);

  if (ownerId) {
    query = query.eq("owner_id", ownerId);
  }

  const { data: properties, error } = await query;
  if (error) throw error;

  const summary = [];
  const typedProperties = (properties ?? []) as Array<{
    id: string;
    owner_id: string | null;
    name: string;
    ical_url: string | null;
  }>;

  for (const property of typedProperties) {
    const propertyId = property.id;
    const feedUrl = property.ical_url;

    if (!feedUrl || !property.owner_id) {
      continue;
    }

    try {
      const parsedEvents = (await fetchAndParseIcalFeed(feedUrl)) as ParsedIcalEvent[];
      const externalUids = parsedEvents.map((event) => event.externalUid);

      const { data: existingBookings } = await admin
        .from("bookings")
        .select("id, external_uid")
        .eq("property_id", propertyId)
        .in("external_uid", externalUids);

      const typedBookings = (existingBookings ?? []) as Array<{ id: string; external_uid: string | null }>;
      const existingLookup = new Map(typedBookings.map((booking) => [booking.external_uid, booking.id]));

      let created = 0;
      let updated = 0;

      for (const event of parsedEvents) {
        const exists = existingLookup.has(event.externalUid);

        await admin.from("bookings").upsert(
          {
            property_id: propertyId,
            owner_id: property.owner_id,
            external_uid: event.externalUid,
            guest_name: event.guestName,
            check_in: event.checkIn,
            check_out: event.checkOut,
            status: event.status,
            source: "synced",
            notes: event.notes,
          } as never,
          { onConflict: "property_id,external_uid" },
        );

        if (exists) updated += 1;
        else created += 1;
      }

      await admin.from("ical_sync_log").insert({
        property_id: propertyId,
        status: "success",
        events_found: parsedEvents.length,
        events_created: created,
        events_updated: updated,
      } as never);

      summary.push({
        propertyId,
        propertyName: property.name,
        status: "success",
        eventsFound: parsedEvents.length,
        eventsCreated: created,
        eventsUpdated: updated,
      });
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : "Unknown sync error";

      await admin.from("ical_sync_log").insert({
        property_id: propertyId,
        status: "error",
        error_message: message,
      } as never);

      summary.push({
        propertyId,
        propertyName: property.name,
        status: "error",
        errorMessage: message,
      });
    }
  }

  return summary;
}
