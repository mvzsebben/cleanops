import { bookingStatusForDates } from "@/lib/utils";

export interface ParsedIcalEvent {
  externalUid: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  notes: string | null;
}

function toDate(value: unknown, fallback: Date) {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return fallback;
}

function cleanGuestName(raw: string | undefined | null) {
  if (!raw) return "";

  return raw
    .replace(/^reservation[:\s-]*/i, "")
    .replace(/^reserved[:\s-]*/i, "")
    .replace(/^booking[:\s-]*/i, "")
    .replace(/^guest[:\s-]*/i, "")
    .trim();
}

function readTextField(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "val" in value && typeof value.val === "string") {
    return value.val;
  }
  return undefined;
}

function extractGuestName(summary?: unknown, description?: unknown) {
  const summaryText = readTextField(summary);
  const descriptionText = readTextField(description);
  const summaryName = cleanGuestName(summaryText);
  if (summaryName) return summaryName;

  const descriptionLine = descriptionText?.split("\n").map((line) => cleanGuestName(line)).find(Boolean);
  return descriptionLine || "Guest stay";
}

export async function fetchAndParseIcalFeed(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "CleanOps/1.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Feed request failed with ${response.status}`);
  }

  const raw = await response.text();
  const ical = await import("node-ical");
  const parsed = ical.parseICS(raw);

  const events = Object.values(parsed)
    .filter((entry) => Boolean(entry) && (entry as { type?: string }).type === "VEVENT")
    .map((rawEvent) => {
      const event = rawEvent as Record<string, unknown>;
      const start = toDate(event.start ?? event.datestart, new Date());
      const end = toDate(event.end ?? event.dtend, start);
      const status = String(event.status ?? "").toUpperCase() === "CANCELLED"
        ? "cancelled"
        : bookingStatusForDates(start, end);

      return {
        externalUid: event.uid ?? `${start.toISOString()}-${end.toISOString()}`,
        guestName: extractGuestName(event.summary, event.description),
        checkIn: start.toISOString(),
        checkOut: end.toISOString(),
        status,
        notes: readTextField(event.description)?.trim() || null,
      };
    })
    .sort((left, right) => left.checkIn.localeCompare(right.checkIn));

  return events;
}
