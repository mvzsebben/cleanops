"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown, ChevronRight, LoaderCircle, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { APPLE_COLOURS, DATA_SOURCE_OPTIONS, NOTIFICATION_OPTIONS, PROPERTY_TYPE_OPTIONS } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, formatDateTime } from "@/lib/utils";
import type { ClientWithProperties, DataSource, ProfileRecord, PropertyRecord, SyncLogRecord } from "@/types/app";
import type { Database } from "@/lib/supabase/types";

type PropertyWithSync = PropertyRecord & { latestSyncLog?: SyncLogRecord | null };
type ClientSettingsRecord = Omit<ClientWithProperties, "properties"> & { properties: PropertyWithSync[] };

interface ClientSettingsProps {
  initialClients: ClientSettingsRecord[];
  profile: ProfileRecord | null;
}

type ClientFormState = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  colour: string;
  data_source: DataSource;
  notification_preference: string;
  notes: string;
};

type PropertyFormState = {
  id?: string;
  client_id: string;
  name: string;
  address: string;
  suburb: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  default_clean_duration_minutes: number;
  default_clean_price: string;
  check_in_time: string;
  check_out_time: string;
  has_laundry_service: boolean;
  ical_url: string;
  notes: string;
};

function defaultClientForm(): ClientFormState {
  return {
    name: "",
    email: "",
    phone: "",
    colour: "#007AFF",
    data_source: "manual",
    notification_preference: "email",
    notes: "",
  };
}

function defaultPropertyForm(clientId = ""): PropertyFormState {
  return {
    client_id: clientId,
    name: "",
    address: "",
    suburb: "",
    type: "airbnb",
    bedrooms: 1,
    bathrooms: 1,
    default_clean_duration_minutes: 120,
    default_clean_price: "",
    check_in_time: "15:00",
    check_out_time: "10:00",
    has_laundry_service: false,
    ical_url: "",
    notes: "",
  };
}

export function ClientSettings({ initialClients, profile }: ClientSettingsProps) {
  const supabase = createSupabaseBrowserClient();
  const [clients, setClients] = useState(initialClients);
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>(
    Object.fromEntries(initialClients.map((client) => [client.id, true])),
  );
  const [clientForms, setClientForms] = useState<Record<string, ClientFormState>>({});
  const [propertyForms, setPropertyForms] = useState<Record<string, PropertyFormState>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activePropertyCount = useMemo(
    () => clients.flatMap((client) => client.properties).filter((property) => property.is_active).length,
    [clients],
  );

  function upsertClientForm(key: string, value: ClientFormState) {
    setClientForms((current) => ({ ...current, [key]: value }));
  }

  function upsertPropertyForm(key: string, value: PropertyFormState) {
    setPropertyForms((current) => ({ ...current, [key]: value }));
  }

  function refreshMessage(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 2400);
  }

  async function saveClient(clientId?: string) {
    const key = clientId ?? "new";
    const form = clientForms[key] ?? defaultClientForm();
    const payload = {
      owner_id: profile?.id,
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      colour: form.colour,
      data_source: form.data_source,
      notification_preference: form.notification_preference,
      notes: form.notes || null,
    } as Database["public"]["Tables"]["clients"]["Insert"];

    startTransition(async () => {
      const query = clientId
        ? supabase.from("clients").update(payload as never).eq("id", clientId).select("*, properties(*)").single()
        : supabase.from("clients").insert(payload as never).select("*, properties(*)").single();

      const { data, error } = await query;
      if (error || !data) {
        refreshMessage(error?.message ?? "Failed to save client.");
        return;
      }

      const savedClient = data as unknown as ClientWithProperties & { id: string; properties?: PropertyRecord[] };

      setClients((current) => {
        const nextClient: ClientSettingsRecord = {
          ...savedClient,
          properties: savedClient.properties ?? [],
        };
        if (clientId) {
          return current.map((client) => (client.id === clientId ? nextClient : client));
        }
        return [...current, nextClient].sort((left, right) => left.name.localeCompare(right.name));
      });

      if (!clientId) {
        setExpandedClients((current) => ({ ...current, [savedClient.id]: true }));
        upsertClientForm("new", defaultClientForm());
      }

      refreshMessage(`Client ${clientId ? "updated" : "created"}.`);
    });
  }

  async function deleteClient(clientId: string) {
    startTransition(async () => {
      const { error } = await supabase.from("clients").delete().eq("id", clientId);
      if (error) {
        refreshMessage(error.message);
        return;
      }

      setClients((current) => current.filter((client) => client.id !== clientId));
      refreshMessage("Client deleted.");
    });
  }

  async function saveProperty(propertyId?: string, clientId?: string) {
    const key = propertyId ?? `new-${clientId}`;
    const form = propertyForms[key];
    if (!form || !profile) return;

    const payload = {
      client_id: form.client_id,
      owner_id: profile.id,
      name: form.name,
      address: form.address || null,
      suburb: form.suburb || null,
      type: form.type,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      default_clean_duration_minutes: form.default_clean_duration_minutes,
      default_clean_price: form.default_clean_price ? Number(form.default_clean_price) : null,
      check_in_time: form.check_in_time || null,
      check_out_time: form.check_out_time || null,
      has_laundry_service: form.has_laundry_service,
      ical_url: form.ical_url || null,
      notes: form.notes || null,
    } as Database["public"]["Tables"]["properties"]["Insert"];

    startTransition(async () => {
      const query = propertyId
        ? supabase.from("properties").update(payload as never).eq("id", propertyId).select("*").single()
        : supabase.from("properties").insert(payload as never).select("*").single();

      const { data, error } = await query;
      if (error || !data) {
        refreshMessage(error?.message ?? "Failed to save property.");
        return;
      }

      const savedProperty = data as unknown as PropertyWithSync;

      setClients((current) =>
        current.map((client) => {
          if (client.id !== savedProperty.client_id) return client;
          const properties = propertyId
            ? client.properties.map((property) => (property.id === propertyId ? savedProperty : property))
            : [...client.properties, savedProperty];

          return {
            ...client,
            properties: properties.sort((left, right) => left.name.localeCompare(right.name)),
          };
        }),
      );

      if (!propertyId && clientId) {
        upsertPropertyForm(`new-${clientId}`, defaultPropertyForm(clientId));
      }

      refreshMessage(`Property ${propertyId ? "updated" : "created"}.`);
    });
  }

  async function deleteProperty(propertyId: string) {
    startTransition(async () => {
      const { error } = await supabase.from("properties").delete().eq("id", propertyId);
      if (error) {
        refreshMessage(error.message);
        return;
      }

      setClients((current) =>
        current.map((client) => ({
          ...client,
          properties: client.properties.filter((property) => property.id !== propertyId),
        })),
      );

      refreshMessage("Property deleted.");
    });
  }

  async function syncNow() {
    startTransition(async () => {
      const response = await fetch("/api/sync", { method: "POST" });
      const result = await response.json();

      if (!response.ok) {
        refreshMessage(result.error ?? "Sync failed.");
        return;
      }

      refreshMessage("Sync completed. Refresh the page to see updated logs.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#007AFF]">Settings</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Clients & properties</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#6b7280]">
            Manage client records, property details, iCal URLs, and sync status in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Card className="px-4 py-3">
            <p className="text-xs uppercase tracking-[0.22em] text-[#9ca3af]">Properties</p>
            <p className="mt-1 text-2xl font-semibold">{activePropertyCount}</p>
          </Card>
          <Button className="gap-2" onClick={syncNow} type="button" variant="secondary">
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync now
          </Button>
        </div>
      </div>

      {message ? (
        <Card className="border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1d4ed8]">{message}</Card>
      ) : null}

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-[#007AFF]" />
          <h3 className="text-lg font-semibold">Add client</h3>
        </div>
        <ClientForm
          form={clientForms.new ?? defaultClientForm()}
          onChange={(next) => upsertClientForm("new", next)}
          onSave={() => saveClient()}
          pending={isPending}
        />
      </Card>

      <div className="space-y-4">
        {clients.map((client) => {
          const form = clientForms[client.id] ?? {
            id: client.id,
            name: client.name,
            email: client.email ?? "",
            phone: client.phone ?? "",
            colour: client.colour,
            data_source: client.data_source,
            notification_preference: client.notification_preference,
            notes: client.notes ?? "",
          };

          const expanded = expandedClients[client.id] ?? true;

          return (
            <Card key={client.id} className="overflow-hidden">
              <button
                className="flex w-full items-center justify-between px-5 py-4 text-left"
                onClick={() => setExpandedClients((current) => ({ ...current, [client.id]: !expanded }))}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: client.colour }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{client.name}</h3>
                    <p className="text-sm text-[#6b7280]">
                      {client.properties.length} properties • data source {client.data_source.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>
                {expanded ? <ChevronDown className="h-4 w-4 text-[#6b7280]" /> : <ChevronRight className="h-4 w-4 text-[#6b7280]" />}
              </button>

              {expanded ? (
                <div className="space-y-6 border-t border-[#eef0f4] px-5 py-5">
                  <ClientForm
                    form={form}
                    onChange={(next) => upsertClientForm(client.id, next)}
                    onDelete={() => deleteClient(client.id)}
                    onSave={() => saveClient(client.id)}
                    pending={isPending}
                  />

                  <div className="space-y-4">
                    {client.properties.map((property) => {
                      const propertyForm = propertyForms[property.id] ?? {
                        id: property.id,
                        client_id: client.id,
                        name: property.name,
                        address: property.address ?? "",
                        suburb: property.suburb ?? "",
                        type: property.type,
                        bedrooms: property.bedrooms,
                        bathrooms: property.bathrooms,
                        default_clean_duration_minutes: property.default_clean_duration_minutes,
                        default_clean_price: property.default_clean_price?.toString() ?? "",
                        check_in_time: property.check_in_time?.slice(0, 5) ?? "15:00",
                        check_out_time: property.check_out_time?.slice(0, 5) ?? "10:00",
                        has_laundry_service: property.has_laundry_service,
                        ical_url: property.ical_url ?? "",
                        notes: property.notes ?? "",
                      };

                      return (
                        <Card key={property.id} className="border border-[#eef0f4] p-4">
                          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h4 className="text-base font-semibold">{property.name}</h4>
                              <div className="mt-1 flex flex-wrap gap-2">
                                <Badge className="bg-[#f2f3f5] text-[#4b5563]">{property.type}</Badge>
                                <SyncStatusBadge log={property.latestSyncLog ?? null} />
                              </div>
                              {client.data_source === "google_calendar" ? (
                                <p className="mt-3 max-w-3xl text-sm text-[#6b7280]">
                                  Ask your client to go to Google Calendar → Settings → [Calendar name] → Integrate calendar → Copy
                                  the &quot;Secret address in iCal format&quot; URL and send it to you.
                                </p>
                              ) : null}
                            </div>
                            <button
                              className="rounded-lg p-2 text-[#FF3B30] transition hover:bg-[#fff1f0]"
                              onClick={() => deleteProperty(property.id)}
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <PropertyForm
                            form={propertyForm}
                            onChange={(next) => upsertPropertyForm(property.id, next)}
                            onSave={() => saveProperty(property.id)}
                            pending={isPending}
                          />
                        </Card>
                      );
                    })}

                    <Card className="border border-dashed border-[#d1d5db] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Plus className="h-4 w-4 text-[#007AFF]" />
                        <h4 className="text-base font-semibold">Add property under {client.name}</h4>
                      </div>
                      <PropertyForm
                        form={propertyForms[`new-${client.id}`] ?? defaultPropertyForm(client.id)}
                        onChange={(next) => upsertPropertyForm(`new-${client.id}`, next)}
                        onSave={() => saveProperty(undefined, client.id)}
                        pending={isPending}
                      />
                    </Card>
                  </div>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ClientForm({
  form,
  onChange,
  onSave,
  onDelete,
  pending,
}: {
  form: ClientFormState;
  onChange: (value: ClientFormState) => void;
  onSave: () => void;
  onDelete?: () => void;
  pending: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Client name">
          <Input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(event) => onChange({ ...form, phone: event.target.value })} />
        </Field>
        <Field label="Notification">
          <Select value={form.notification_preference} onChange={(event) => onChange({ ...form, notification_preference: event.target.value })}>
            {NOTIFICATION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Data source">
          <Select value={form.data_source} onChange={(event) => onChange({ ...form, data_source: event.target.value as DataSource })}>
            {DATA_SOURCE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Client colour">
          <div className="flex flex-wrap gap-3 rounded-lg bg-[#f2f3f5] p-3">
            {APPLE_COLOURS.map((colour) => (
              <button
                key={colour}
                className={cn(
                  "h-8 w-8 rounded-full ring-offset-2 transition hover:scale-105",
                  form.colour === colour ? "ring-2 ring-[#111827]" : "ring-0",
                )}
                onClick={() => onChange({ ...form, colour })}
                style={{ backgroundColor: colour }}
                type="button"
              />
            ))}
          </div>
        </Field>
      </div>

      <Field label="Notes">
        <Textarea value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} />
      </Field>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {onDelete ? (
          <Button onClick={onDelete} type="button" variant="danger">
            Delete client
          </Button>
        ) : null}
        <Button className="gap-2" onClick={onSave} type="button" variant="secondary">
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save client
        </Button>
      </div>
    </div>
  );
}

function PropertyForm({
  form,
  onChange,
  onSave,
  pending,
}: {
  form: PropertyFormState;
  onChange: (value: PropertyFormState) => void;
  onSave: () => void;
  pending: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Property name">
          <Input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} />
        </Field>
        <Field label="Address">
          <Input value={form.address} onChange={(event) => onChange({ ...form, address: event.target.value })} />
        </Field>
        <Field label="Suburb">
          <Input value={form.suburb} onChange={(event) => onChange({ ...form, suburb: event.target.value })} />
        </Field>
        <Field label="Type">
          <Select value={form.type} onChange={(event) => onChange({ ...form, type: event.target.value })}>
            {PROPERTY_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Bedrooms">
          <Input type="number" value={form.bedrooms} onChange={(event) => onChange({ ...form, bedrooms: Number(event.target.value) })} />
        </Field>
        <Field label="Bathrooms">
          <Input type="number" value={form.bathrooms} onChange={(event) => onChange({ ...form, bathrooms: Number(event.target.value) })} />
        </Field>
        <Field label="Duration (minutes)">
          <Input
            type="number"
            value={form.default_clean_duration_minutes}
            onChange={(event) => onChange({ ...form, default_clean_duration_minutes: Number(event.target.value) })}
          />
        </Field>
        <Field label="Default clean price">
          <Input value={form.default_clean_price} onChange={(event) => onChange({ ...form, default_clean_price: event.target.value })} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Check-in time">
          <Input type="time" value={form.check_in_time} onChange={(event) => onChange({ ...form, check_in_time: event.target.value })} />
        </Field>
        <Field label="Check-out time">
          <Input type="time" value={form.check_out_time} onChange={(event) => onChange({ ...form, check_out_time: event.target.value })} />
        </Field>
        <Field label="iCal URL">
          <Input value={form.ical_url} onChange={(event) => onChange({ ...form, ical_url: event.target.value })} />
        </Field>
        <Field label="Laundry service">
          <label className="flex min-h-11 items-center gap-3 rounded-lg bg-[#f2f3f5] px-3 text-sm text-[#111827]">
            <input
              checked={form.has_laundry_service}
              className="h-4 w-4"
              onChange={(event) => onChange({ ...form, has_laundry_service: event.target.checked })}
              type="checkbox"
            />
            Enabled
          </label>
        </Field>
      </div>

      <Field label="Notes">
        <Textarea value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} />
      </Field>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-[#6b7280]">
          {form.ical_url ? "This property will be included in Sync Now and the 30-minute cron job." : "No iCal URL yet. Bookings can still be entered manually."}
        </div>
        <Button className="gap-2" onClick={onSave} type="button" variant="secondary">
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save property
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-[#4b5563]">{label}</span>
      {children}
    </label>
  );
}

function SyncStatusBadge({ log }: { log: SyncLogRecord | null }) {
  if (!log) {
    return <Badge className="bg-[#f2f3f5] text-[#6b7280]">No sync yet</Badge>;
  }

  return (
    <Badge className={cn(log.status === "success" ? "bg-[#ecfdf3] text-[#047857]" : "bg-[#fff1f2] text-[#be123c]")}>
      {log.status} • {formatDateTime(log.synced_at)}
    </Badge>
  );
}
