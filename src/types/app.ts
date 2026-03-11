export type ClientColour =
  | "#007AFF"
  | "#34C759"
  | "#FF9F0A"
  | "#FF3B30"
  | "#AF52DE"
  | "#FF2D55"
  | "#5AC8FA"
  | "#FFCC00";

export type DataSource = "manual" | "guesty" | "google_calendar" | "screenshots";
export type NotificationPreference = "email" | "sms" | "whatsapp";
export type PropertyType = "airbnb" | "regular" | "commercial" | "strata";
export type BookingStatus = "upcoming" | "active" | "completed" | "cancelled";
export type BookingSource = "manual" | "synced";

export interface ProfileRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  timezone: string | null;
  subscription_tier: string | null;
  onboarding_completed: boolean | null;
}

export interface ClientRecord {
  id: string;
  owner_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  colour: ClientColour;
  data_source: DataSource;
  notification_preference: NotificationPreference;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyRecord {
  id: string;
  client_id: string;
  owner_id: string;
  name: string;
  address: string | null;
  suburb: string | null;
  type: PropertyType;
  ical_url: string | null;
  bedrooms: number;
  bathrooms: number;
  has_laundry_service: boolean;
  default_clean_duration_minutes: number;
  default_clean_price: number | null;
  check_in_time: string | null;
  check_out_time: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingRecord {
  id: string;
  property_id: string;
  owner_id: string;
  external_uid: string | null;
  guest_name: string | null;
  guest_count: number;
  check_in: string;
  check_out: string;
  status: BookingStatus;
  source: BookingSource;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncLogRecord {
  id: string;
  property_id: string;
  synced_at: string;
  status: string;
  events_found: number;
  events_created: number;
  events_updated: number;
  error_message: string | null;
}

export interface ClientWithProperties extends ClientRecord {
  properties: PropertyRecord[];
}

export interface PropertyWithContext extends PropertyRecord {
  client: ClientRecord;
  latestSyncLog?: SyncLogRecord | null;
}
