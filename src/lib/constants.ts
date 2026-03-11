import type { ClientColour, DataSource, NotificationPreference, PropertyType } from "@/types/app";

export const APPLE_COLOURS: ClientColour[] = [
  "#007AFF",
  "#34C759",
  "#FF9F0A",
  "#FF3B30",
  "#AF52DE",
  "#FF2D55",
  "#5AC8FA",
  "#FFCC00",
];

export const DATA_SOURCE_OPTIONS: DataSource[] = [
  "manual",
  "guesty",
  "google_calendar",
  "screenshots",
];

export const NOTIFICATION_OPTIONS: NotificationPreference[] = ["email", "sms", "whatsapp"];
export const PROPERTY_TYPE_OPTIONS: PropertyType[] = ["airbnb", "regular", "commercial", "strata"];

export const VIEW_RANGES = [7, 14, 30] as const;

export const DEFAULT_TIMEZONE = "Australia/Sydney";

export const CLIENT_SEED = [
  {
    name: "David",
    colour: "#007AFF",
    data_source: "guesty",
    notification_preference: "email",
    properties: [
      { name: "David Airbnb 1", type: "airbnb" },
      { name: "David Airbnb 2", type: "airbnb" },
      { name: "David Regular 1", type: "regular" },
      { name: "David Regular 2", type: "regular" },
      { name: "David Regular 3", type: "regular" },
      { name: "David Regular 4", type: "regular" },
    ],
  },
  {
    name: "Rohan",
    colour: "#34C759",
    data_source: "guesty",
    notification_preference: "email",
    properties: [
      { name: "Rohan Airbnb 1", type: "airbnb" },
      { name: "Rohan Airbnb 2", type: "airbnb" },
    ],
  },
  {
    name: "Giulia",
    colour: "#FF9F0A",
    data_source: "guesty",
    notification_preference: "email",
    properties: [
      { name: "Giulia Airbnb 1", type: "airbnb" },
      { name: "Giulia Airbnb 2", type: "airbnb" },
    ],
  },
  {
    name: "Eliza",
    colour: "#AF52DE",
    data_source: "guesty",
    notification_preference: "email",
    properties: [{ name: "Eliza Airbnb 1", type: "airbnb" }],
  },
  {
    name: "Bob",
    colour: "#FF2D55",
    data_source: "google_calendar",
    notification_preference: "email",
    properties: [{ name: "Bob Airbnb 1", type: "airbnb" }],
  },
] as const;
