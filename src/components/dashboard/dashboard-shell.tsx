"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, CalendarRange, List, Plus, RefreshCw, Search } from "lucide-react";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { VIEW_RANGES } from "@/lib/constants";
import { bookingStatusForDates, buildDateRange, cn, endOfVisibleRange, formatDateTime, nightsBetween, rgba, startOfVisibleRange } from "@/lib/utils";
import type { BookingRecord, ClientWithProperties, ProfileRecord } from "@/types/app";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface DashboardShellProps {
  clients: ClientWithProperties[];
  bookings: BookingRecord[];
  profile: ProfileRecord | null;
}

interface BookingFormState {
  id?: string;
  property_id: string;
  guest_name: string;
  guest_count: number;
  check_in: string;
  check_out: string;
  notes: string;
}

const STATUS_TONES: Record<string, string> = {
  upcoming: "bg-[#eef5ff] text-[#1d4ed8]",
  active: "bg-[#fff7ed] text-[#c2410c]",
  completed: "bg-[#ecfdf3] text-[#047857]",
  cancelled: "bg-[#f3f4f6] text-[#4b5563]",
};

export function DashboardShell({ clients, bookings, profile }: DashboardShellProps) {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [days, setDays] = useState<(typeof VIEW_RANGES)[number]>(14);
  const [rangeStart, setRangeStart] = useState(startOfDay(new Date()));
  const [clientFilter, setClientFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [bookingModal, setBookingModal] = useState<BookingFormState | null>(null);
  const [isPending, startTransition] = useTransition();
  const [bookingState, setBookingState] = useState(bookings);

  const propertyLookup = useMemo(
    () =>
      new Map(
        clients.flatMap((client) =>
          client.properties.map((property) => [property.id, { property, client }] as const),
        ),
      ),
    [clients],
  );

  const filteredClients = useMemo(() => {
    return clients
      .filter((client) => clientFilter === "all" || client.id === clientFilter)
      .map((client) => ({
        ...client,
        properties: client.properties.filter(
          (property) =>
            (propertyTypeFilter === "all" || property.type === propertyTypeFilter) &&
            (propertyFilter === "all" || property.id === propertyFilter),
        ),
      }))
      .filter((client) => client.properties.length > 0);
  }, [clientFilter, clients, propertyFilter, propertyTypeFilter]);

  const filteredBookings = useMemo(() => {
    return bookingState
      .filter((booking) => {
        const context = propertyLookup.get(booking.property_id);
        if (!context) return false;
        if (clientFilter !== "all" && context.client.id !== clientFilter) return false;
        if (propertyTypeFilter !== "all" && context.property.type !== propertyTypeFilter) return false;
        if (propertyFilter !== "all" && context.property.id !== propertyFilter) return false;
        if (statusFilter !== "all" && booking.status !== statusFilter) return false;
        if (search && !`${booking.guest_name ?? ""} ${context.property.name}`.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((left, right) => left.check_out.localeCompare(right.check_out));
  }, [bookingState, clientFilter, propertyLookup, propertyFilter, propertyTypeFilter, search, statusFilter]);

  const visibleDates = buildDateRange(rangeStart, days);
  const mobileDays = buildDateRange(rangeStart, 5);

  const overview = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const activeAirbnbs = clients.flatMap((client) => client.properties).filter((property) => property.type === "airbnb" && property.is_active).length;

    return [
      {
        key: "turnovers",
        label: "Turnovers Today",
        value: bookingState.filter((booking) => new Date(booking.check_out) >= today && new Date(booking.check_out) < tomorrow).length,
        colour: "#FF9F0A",
        action: () => setStatusFilter("upcoming"),
      },
      {
        key: "checkins",
        label: "Check-ins Today",
        value: bookingState.filter((booking) => new Date(booking.check_in) >= today && new Date(booking.check_in) < tomorrow).length,
        colour: "#34C759",
        action: () => setStatusFilter("upcoming"),
      },
      {
        key: "active",
        label: "Active Stays",
        value: bookingState.filter((booking) => booking.status === "active").length,
        colour: "#AF52DE",
        action: () => setStatusFilter("active"),
      },
      {
        key: "properties",
        label: "Properties",
        value: activeAirbnbs,
        colour: "#007AFF",
        action: () => setPropertyTypeFilter("airbnb"),
      },
    ];
  }, [bookingState, clients]);

  const timelineRows = useMemo(
    () =>
      filteredClients.flatMap((client) =>
        client.properties.map((property) => ({
          client,
          property,
          bookings: filteredBookings.filter((booking) => booking.property_id === property.id),
        })),
      ),
    [filteredBookings, filteredClients],
  );

  async function saveBooking() {
    if (!bookingModal) return;

    const payload = {
      property_id: bookingModal.property_id,
      guest_name: bookingModal.guest_name,
      guest_count: bookingModal.guest_count,
      check_in: new Date(bookingModal.check_in).toISOString(),
      check_out: new Date(bookingModal.check_out).toISOString(),
      notes: bookingModal.notes || null,
      status: bookingStatusForDates(new Date(bookingModal.check_in), new Date(bookingModal.check_out)),
    };

    startTransition(async () => {
      const response = await fetch(bookingModal.id ? `/api/bookings/${bookingModal.id}` : "/api/bookings", {
        method: bookingModal.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) return;

      setBookingState((current) => {
        if (bookingModal.id) {
          return current.map((booking) => (booking.id === bookingModal.id ? result.booking : booking));
        }
        return [...current, result.booking];
      });
      setBookingModal(null);
    });
  }

  async function deleteBooking(id: string) {
    startTransition(async () => {
      const response = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (!response.ok) return;
      setBookingState((current) => current.filter((booking) => booking.id !== id));
      setSelectedBooking(null);
    });
  }

  async function syncNow() {
    startTransition(async () => {
      await fetch("/api/sync", { method: "POST" });
      window.location.reload();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[#007AFF]">Dashboard</p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Booking timeline</h2>
            <p className="mt-2 text-sm text-[#6b7280]">
              {profile?.company_name || "CleanOps"} • {filteredBookings.length} bookings in view
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button className="gap-2" onClick={() => setBookingModal(defaultBookingForm(clients))} type="button" variant="secondary">
              <Plus className="h-4 w-4" />
              Add booking
            </Button>
            <Button className="gap-2" onClick={syncNow} type="button" variant="secondary">
              {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync now
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.map((card) => (
          <button key={card.key} className="text-left" onClick={card.action} type="button">
            <Card className="p-5 transition duration-200 hover:-translate-y-0.5">
              <p className="text-sm text-[#6b7280]">{card.label}</p>
              <div className="mt-3 flex items-end justify-between">
                <p className="text-4xl font-semibold tracking-tight">{card.value}</p>
                <span className="h-10 w-10 rounded-full" style={{ backgroundColor: rgba(card.colour, 0.14) }} />
              </div>
            </Card>
          </button>
        ))}
      </div>

      <Card className="p-4 md:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setView("calendar")} type="button" variant={view === "calendar" ? "primary" : "secondary"}>
                <CalendarRange className="mr-2 h-4 w-4" />
                Calendar
              </Button>
              <Button onClick={() => setView("list")} type="button" variant={view === "list" ? "primary" : "secondary"}>
                <List className="mr-2 h-4 w-4" />
                List
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setRangeStart(addDays(rangeStart, -days))} type="button" variant="ghost">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button onClick={() => setRangeStart(startOfDay(new Date()))} type="button" variant="secondary">
                Today
              </Button>
              <Button onClick={() => setRangeStart(addDays(rangeStart, days))} type="button" variant="ghost">
                <ChevronRight className="h-4 w-4" />
              </Button>
              {VIEW_RANGES.map((range) => (
                <Button key={range} onClick={() => setDays(range)} type="button" variant={days === range ? "primary" : "secondary"}>
                  {range}-day
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
              <option value="all">All clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
            <Select value={propertyTypeFilter} onChange={(event) => setPropertyTypeFilter(event.target.value)}>
              <option value="all">All property types</option>
              <option value="airbnb">Airbnb only</option>
              <option value="regular">Regular only</option>
              <option value="commercial">Commercial only</option>
              <option value="strata">Strata only</option>
            </Select>
            <Select value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)}>
              <option value="all">All properties</option>
              {clients.flatMap((client) =>
                client.properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                )),
              )}
            </Select>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
              <Input className="pl-9" placeholder="Search guest name" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
          </div>
        </div>
      </Card>

      {clients.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#6b7280]">Add your first client and property in Settings to get started.</Card>
      ) : view === "calendar" ? (
        <>
          <Card className="hidden overflow-hidden md:block">
            <div className="flex min-h-[600px]">
              <div className="sticky left-0 z-20 w-[200px] shrink-0 border-r border-[#eef0f4] bg-white">
                <div className="h-[72px] border-b border-[#eef0f4] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#9ca3af]">
                    {format(startOfVisibleRange(rangeStart), "d MMM")} - {format(endOfVisibleRange(rangeStart, days), "d MMM")}
                  </p>
                  <p className="mt-1 text-base font-semibold">Properties</p>
                </div>
                <div>
                  {filteredClients.map((client) => (
                    <div key={client.id}>
                      <div className="flex items-center gap-2 border-b border-[#f3f4f6] px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[#6b7280]">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: client.colour }} />
                        {client.name}
                      </div>
                      {client.properties.map((property) => (
                        <div key={property.id} className="border-b border-[#f8f8fa] px-4 py-4">
                          <p className="text-sm font-medium text-[#111827]">{property.name}</p>
                          <p className="mt-1 text-xs text-[#9ca3af]">{property.type}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <div style={{ width: `${days * 108}px` }}>
                  <div className="grid border-b border-[#eef0f4]" style={{ gridTemplateColumns: `repeat(${days}, minmax(108px, 1fr))` }}>
                    {visibleDates.map((date) => {
                      const isToday = isSameDay(date, new Date());
                      return (
                        <div key={date.toISOString()} className={cn("relative px-3 py-4", isToday && "text-[#007AFF]")}>
                          <p className="text-xs uppercase tracking-[0.16em] text-[#9ca3af]">{format(date, "EEE")}</p>
                          <p className="mt-1 text-lg font-semibold">
                            {format(date, "d")}
                            {format(date, "d") === "1" ? ` ${format(date, "MMM")}` : ""}
                          </p>
                          {isToday ? <div className="absolute inset-y-0 left-0 w-px bg-[#007AFF]/30" /> : null}
                        </div>
                      );
                    })}
                  </div>

                  {timelineRows.map((row) => (
                    <div
                      key={row.property.id}
                      className="relative grid border-b border-[#f8f8fa]"
                      style={{ gridTemplateColumns: `repeat(${days}, minmax(108px, 1fr))` }}
                    >
                      {visibleDates.map((date) => (
                        <button
                          key={`${row.property.id}-${date.toISOString()}`}
                          className="relative h-[74px] border-r border-[#f8f8fa] transition hover:bg-[#f9fafb]"
                          onClick={() =>
                            setBookingModal({
                              ...defaultBookingForm(clients),
                              property_id: row.property.id,
                              check_in: dateAtTime(date, row.property.check_in_time ?? "15:00"),
                              check_out: dateAtTime(addDays(date, 1), row.property.check_out_time ?? "10:00"),
                            })
                          }
                          type="button"
                        >
                          {isSameDay(date, new Date()) ? <div className="absolute inset-y-0 left-0 w-px bg-[#007AFF]/30" /> : null}
                        </button>
                      ))}

                      {row.bookings
                        .filter((booking) => new Date(booking.check_out) >= rangeStart && new Date(booking.check_in) <= addDays(rangeStart, days))
                        .map((booking) => {
                          const context = propertyLookup.get(booking.property_id);
                          if (!context) return null;

                          const startIndex = Math.max(0, Math.floor((startOfDay(new Date(booking.check_in)).getTime() - rangeStart.getTime()) / 86400000));
                          const span = Math.max(1, nightsBetween(booking.check_in, booking.check_out));

                          return (
                            <button
                              key={booking.id}
                              className="absolute top-3 z-10 flex h-[48px] items-center overflow-hidden rounded-r-xl rounded-l-md px-3 text-left text-sm font-medium transition hover:brightness-105"
                              onClick={() => setSelectedBooking(booking)}
                              style={{
                                left: `${startIndex * 108 + 4}px`,
                                width: `${Math.max(54, span * 108 - 8)}px`,
                                backgroundColor: rgba(context.client.colour, 0.15),
                                borderLeft: `3px solid ${context.client.colour}`,
                              }}
                              type="button"
                            >
                              {span > 1 ? <span className="truncate">{booking.guest_name || "Guest stay"}</span> : null}
                            </button>
                          );
                        })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-4 md:hidden">
            {mobileDays.map((date) => {
              const dayBookings = filteredBookings.filter((booking) => isSameDay(new Date(booking.check_in), date) || isSameDay(new Date(booking.check_out), date) || (new Date(booking.check_in) < date && new Date(booking.check_out) > date));
              return (
                <Card key={date.toISOString()} className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-[#9ca3af]">{format(date, "EEEE")}</p>
                      <h3 className="text-xl font-semibold">{format(date, "d MMMM")}</h3>
                    </div>
                    <Button onClick={() => setBookingModal(defaultBookingForm(clients, date))} type="button" variant="secondary">
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {dayBookings.length === 0 ? (
                      <p className="text-sm text-[#9ca3af]">No bookings for this day.</p>
                    ) : (
                      dayBookings.map((booking) => {
                        const context = propertyLookup.get(booking.property_id);
                        if (!context) return null;

                        return (
                          <button key={booking.id} className="w-full text-left" onClick={() => setSelectedBooking(booking)} type="button">
                            <Card className="p-4" style={{ borderLeft: `3px solid ${context.client.colour}` }}>
                              <p className="text-sm font-semibold">{context.property.name}</p>
                              <p className="mt-1 text-sm text-[#6b7280]">{booking.guest_name || "Guest stay"}</p>
                              <p className="mt-2 text-xs text-[#9ca3af]">
                                {formatDateTime(booking.check_in)} → {formatDateTime(booking.check_out)}
                              </p>
                            </Card>
                          </button>
                        );
                      })
                    )}
                  </div>
                </Card>
              );
            })}
            <div className="flex items-center justify-between gap-3">
              <Button onClick={() => setRangeStart(addDays(rangeStart, -5))} type="button" variant="secondary">
                Previous
              </Button>
              <Button onClick={() => setRangeStart(addDays(rangeStart, 5))} type="button" variant="secondary">
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const context = propertyLookup.get(booking.property_id);
            if (!context) return null;
            return (
              <button key={booking.id} className="w-full text-left" onClick={() => setSelectedBooking(booking)} type="button">
                <Card className="p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: context.client.colour }} />
                      <div>
                        <p className="text-base font-semibold">{context.property.name}</p>
                        <p className="text-sm text-[#6b7280]">
                          {context.client.name} • {booking.guest_name || "Guest stay"} • {booking.guest_count} guests
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-2 text-sm text-[#4b5563] md:grid-cols-3 md:items-center">
                      <span>{formatDateTime(booking.check_in)}</span>
                      <span>{formatDateTime(booking.check_out)}</span>
                      <div className="flex items-center gap-2">
                        <Badge className={STATUS_TONES[booking.status]}>{booking.status}</Badge>
                        <Badge className={booking.source === "manual" ? "bg-[#f3f4f6] text-[#4b5563]" : "bg-[#eef5ff] text-[#1d4ed8]"}>
                          {booking.source === "manual" ? "Manual" : "Synced"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        description={selectedBooking ? "Booking details and quick actions." : ""}
        onClose={() => setSelectedBooking(null)}
        open={Boolean(selectedBooking)}
        title={selectedBooking?.guest_name || "Booking"}
      >
        {selectedBooking ? (
          <div className="space-y-4">
            {(() => {
              const context = propertyLookup.get(selectedBooking.property_id);
              if (!context) return null;
              return (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Detail label="Property" value={context.property.name} />
                    <Detail label="Client" value={context.client.name} />
                    <Detail label="Guest count" value={`${selectedBooking.guest_count}`} />
                    <Detail label="Nights" value={`${nightsBetween(selectedBooking.check_in, selectedBooking.check_out)}`} />
                    <Detail label="Check-in" value={formatDateTime(selectedBooking.check_in)} />
                    <Detail label="Check-out" value={formatDateTime(selectedBooking.check_out)} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={STATUS_TONES[selectedBooking.status]}>{selectedBooking.status}</Badge>
                    <Badge className={selectedBooking.source === "manual" ? "bg-[#f3f4f6] text-[#4b5563]" : "bg-[#eef5ff] text-[#1d4ed8]"}>
                      {selectedBooking.source === "manual" ? "Manual" : "Synced"}
                    </Badge>
                  </div>
                  {selectedBooking.notes ? (
                    <Card className="bg-[#f9fafb] p-4 text-sm text-[#4b5563]">{selectedBooking.notes}</Card>
                  ) : null}
                  {selectedBooking.source === "manual" ? (
                    <div className="flex flex-wrap justify-end gap-3">
                      <Button
                        onClick={() =>
                          setBookingModal({
                            id: selectedBooking.id,
                            property_id: selectedBooking.property_id,
                            guest_name: selectedBooking.guest_name || "",
                            guest_count: selectedBooking.guest_count,
                            check_in: toInputDateTime(selectedBooking.check_in),
                            check_out: toInputDateTime(selectedBooking.check_out),
                            notes: selectedBooking.notes || "",
                          })
                        }
                        type="button"
                        variant="secondary"
                      >
                        Edit booking
                      </Button>
                      <Button onClick={() => deleteBooking(selectedBooking.id)} type="button" variant="danger">
                        Delete booking
                      </Button>
                    </div>
                  ) : null}
                </>
              );
            })()}
          </div>
        ) : null}
      </Modal>

      <Modal
        description="Manual bookings can be created from the dashboard and edited later from the detail panel."
        onClose={() => setBookingModal(null)}
        open={Boolean(bookingModal)}
        title={bookingModal?.id ? "Edit booking" : "Add booking"}
      >
        {bookingModal ? (
          <div className="space-y-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-[#4b5563]">Property</span>
              <select
                className="min-h-11 w-full rounded-lg bg-[#f2f3f5] px-3 text-sm"
                value={bookingModal.property_id}
                onChange={(event) => setBookingModal({ ...bookingModal, property_id: event.target.value })}
              >
                {clients.map((client) => (
                  <optgroup key={client.id} label={client.name}>
                    {client.properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[#4b5563]">Guest name</span>
                <Input value={bookingModal.guest_name} onChange={(event) => setBookingModal({ ...bookingModal, guest_name: event.target.value })} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-[#4b5563]">Guest count</span>
                <Input type="number" value={bookingModal.guest_count} onChange={(event) => setBookingModal({ ...bookingModal, guest_count: Number(event.target.value) })} />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[#4b5563]">Check-in</span>
                <Input type="datetime-local" value={bookingModal.check_in} onChange={(event) => setBookingModal({ ...bookingModal, check_in: event.target.value })} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-[#4b5563]">Check-out</span>
                <Input type="datetime-local" value={bookingModal.check_out} onChange={(event) => setBookingModal({ ...bookingModal, check_out: event.target.value })} />
              </label>
            </div>
            <label className="space-y-2">
              <span className="text-sm font-medium text-[#4b5563]">Notes</span>
              <Textarea value={bookingModal.notes} onChange={(event) => setBookingModal({ ...bookingModal, notes: event.target.value })} />
            </label>
            <div className="flex justify-end">
              <Button onClick={saveBooking} type="button">
                {isPending ? "Saving..." : bookingModal.id ? "Save changes" : "Create booking"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-[#f9fafb] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[#9ca3af]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[#111827]">{value}</p>
    </Card>
  );
}

function defaultBookingForm(clients: ClientWithProperties[], date = new Date()): BookingFormState {
  const firstProperty = clients[0]?.properties[0];
  const checkIn = dateAtTime(date, firstProperty?.check_in_time ?? "15:00");
  const checkOut = dateAtTime(addDays(date, 1), firstProperty?.check_out_time ?? "10:00");

  return {
    property_id: firstProperty?.id ?? "",
    guest_name: "",
    guest_count: 1,
    check_in: checkIn,
    check_out: checkOut,
    notes: "",
  };
}

function dateAtTime(date: Date, time: string) {
  const safeTime = time.length >= 5 ? time.slice(0, 5) : "15:00";
  return `${format(date, "yyyy-MM-dd")}T${safeTime}`;
}

function toInputDateTime(value: string) {
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
}
