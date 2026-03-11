export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          company_name: string | null;
          timezone: string | null;
          subscription_tier: string | null;
          onboarding_completed: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          company_name?: string | null;
          timezone?: string | null;
          subscription_tier?: string | null;
          onboarding_completed?: boolean | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          company_name?: string | null;
          timezone?: string | null;
          subscription_tier?: string | null;
          onboarding_completed?: boolean | null;
        };
      };
      clients: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          colour: string;
          data_source: string;
          notification_preference: string | null;
          notes: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          colour: string;
          data_source?: string;
          notification_preference?: string | null;
          notes?: string | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          colour?: string;
          data_source?: string;
          notification_preference?: string | null;
          notes?: string | null;
          is_active?: boolean | null;
        };
      };
      properties: {
        Row: {
          id: string;
          client_id: string | null;
          owner_id: string | null;
          name: string;
          address: string | null;
          suburb: string | null;
          latitude: number | null;
          longitude: number | null;
          type: string;
          ical_url: string | null;
          bedrooms: number | null;
          bathrooms: number | null;
          has_laundry_service: boolean | null;
          default_clean_duration_minutes: number | null;
          default_clean_price: number | null;
          check_in_time: string | null;
          check_out_time: string | null;
          notes: string | null;
          supply_list: Json | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          owner_id: string;
          name: string;
          address?: string | null;
          suburb?: string | null;
          type?: string;
          ical_url?: string | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          has_laundry_service?: boolean | null;
          default_clean_duration_minutes?: number | null;
          default_clean_price?: number | null;
          check_in_time?: string | null;
          check_out_time?: string | null;
          notes?: string | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          owner_id?: string;
          name?: string;
          address?: string | null;
          suburb?: string | null;
          type?: string;
          ical_url?: string | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          has_laundry_service?: boolean | null;
          default_clean_duration_minutes?: number | null;
          default_clean_price?: number | null;
          check_in_time?: string | null;
          check_out_time?: string | null;
          notes?: string | null;
          is_active?: boolean | null;
        };
      };
      bookings: {
        Row: {
          id: string;
          property_id: string | null;
          owner_id: string | null;
          external_uid: string | null;
          guest_name: string | null;
          guest_count: number | null;
          check_in: string;
          check_out: string;
          status: string | null;
          source: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          property_id: string;
          owner_id: string;
          external_uid?: string | null;
          guest_name?: string | null;
          guest_count?: number | null;
          check_in: string;
          check_out: string;
          status?: string | null;
          source?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          property_id?: string;
          owner_id?: string;
          external_uid?: string | null;
          guest_name?: string | null;
          guest_count?: number | null;
          check_in?: string;
          check_out?: string;
          status?: string | null;
          source?: string | null;
          notes?: string | null;
        };
      };
      ical_sync_log: {
        Row: {
          id: string;
          property_id: string | null;
          synced_at: string | null;
          status: string;
          events_found: number | null;
          events_created: number | null;
          events_updated: number | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          property_id: string;
          synced_at?: string | null;
          status: string;
          events_found?: number | null;
          events_created?: number | null;
          events_updated?: number | null;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          property_id?: string;
          synced_at?: string | null;
          status?: string;
          events_found?: number | null;
          events_created?: number | null;
          events_updated?: number | null;
          error_message?: string | null;
        };
      };
    };
  };
}
