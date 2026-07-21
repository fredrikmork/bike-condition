export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          strava_id: number;
          email: string | null;
          name: string | null;
          profile_image: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          strava_id: number;
          email?: string | null;
          name?: string | null;
          profile_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          strava_id?: number;
          email?: string | null;
          name?: string | null;
          profile_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_tokens: {
        Row: {
          id: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          access_token?: string;
          refresh_token?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bikes: {
        Row: {
          id: string;
          user_id: string;
          strava_gear_id: string;
          name: string;
          brand_name: string | null;
          model_name: string | null;
          frame_type: number | null;
          description: string | null;
          total_distance: number | null;
          retired: boolean;
          deleted_defaults: string[];
          bike_type: "road" | "mtb" | "tt" | "hybrid" | "ebike" | null;
          shifting_type: ShiftingType | null;
          brake_type: BrakeType | null;
          drivetrain_speed: number | null;
          tire_system: TireSystem | null;
          config_complete: boolean;
          electronic_system: ElectronicSystem | null;
          last_charge_distance: number | null;
          last_charge_date: string | null;
          battery_range_km: number | null;
          default_sport_type: string | null;
          weight: number | null;
          pause_wheels_on_virtual: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          strava_gear_id: string;
          name: string;
          brand_name?: string | null;
          model_name?: string | null;
          frame_type?: number | null;
          description?: string | null;
          total_distance?: number | null;
          retired?: boolean;
          deleted_defaults?: string[];
          bike_type?: "road" | "mtb" | "tt" | "hybrid" | "ebike" | null;
          shifting_type?: ShiftingType | null;
          brake_type?: BrakeType | null;
          drivetrain_speed?: number | null;
          tire_system?: TireSystem | null;
          config_complete?: boolean;
          electronic_system?: ElectronicSystem | null;
          last_charge_distance?: number | null;
          last_charge_date?: string | null;
          battery_range_km?: number | null;
          default_sport_type?: string | null;
          weight?: number | null;
          pause_wheels_on_virtual?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          strava_gear_id?: string;
          name?: string;
          brand_name?: string | null;
          model_name?: string | null;
          frame_type?: number | null;
          description?: string | null;
          total_distance?: number | null;
          retired?: boolean;
          deleted_defaults?: string[];
          bike_type?: "road" | "mtb" | "tt" | "hybrid" | "ebike" | null;
          shifting_type?: ShiftingType | null;
          brake_type?: BrakeType | null;
          drivetrain_speed?: number | null;
          tire_system?: TireSystem | null;
          config_complete?: boolean;
          electronic_system?: ElectronicSystem | null;
          last_charge_distance?: number | null;
          last_charge_date?: string | null;
          battery_range_km?: number | null;
          default_sport_type?: string | null;
          weight?: number | null;
          pause_wheels_on_virtual?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      components: {
        Row: {
          id: string;
          /** NULL when the part sits in the bank, unmounted */
          bike_id: string | null;
          user_id: string;
          name: string;
          /** User-chosen label, shown instead of `name` when set */
          nickname: string | null;
          type: string;
          icon: string | null;
          brand: string | null;
          model: string | null;
          spec: string | null;
          lube_type: LubeType | null;
          recommended_distance: number;
          current_distance: number | null;
          bike_distance_at_install: number;
          installed_at: string;
          replaced_at: string | null;
          notes: string | null;
          muted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bike_id?: string | null;
          user_id: string;
          name: string;
          nickname?: string | null;
          type: string;
          icon?: string | null;
          brand?: string | null;
          model?: string | null;
          spec?: string | null;
          lube_type?: LubeType | null;
          recommended_distance: number;
          current_distance?: number;
          bike_distance_at_install?: number;
          installed_at?: string;
          replaced_at?: string | null;
          notes?: string | null;
          muted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bike_id?: string | null;
          user_id?: string;
          name?: string;
          nickname?: string | null;
          type?: string;
          icon?: string | null;
          brand?: string | null;
          model?: string | null;
          spec?: string | null;
          lube_type?: LubeType | null;
          recommended_distance?: number;
          current_distance?: number;
          bike_distance_at_install?: number;
          installed_at?: string;
          replaced_at?: string | null;
          notes?: string | null;
          muted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          bike_id: string | null;
          strava_activity_id: number;
          name: string | null;
          distance: number;
          moving_time: number | null;
          start_date: string;
          activity_type: string | null;
          trainer: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bike_id?: string | null;
          strava_activity_id: number;
          name?: string | null;
          distance: number;
          moving_time?: number | null;
          start_date: string;
          activity_type?: string | null;
          trainer?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bike_id?: string | null;
          strava_activity_id?: number;
          name?: string | null;
          distance?: number;
          moving_time?: number | null;
          start_date?: string;
          activity_type?: string | null;
          trainer?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      sync_status: {
        Row: {
          id: string;
          user_id: string;
          last_activity_sync: string | null;
          last_bike_sync: string | null;
          last_sync_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          last_activity_sync?: string | null;
          last_bike_sync?: string | null;
          last_sync_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          last_activity_sync?: string | null;
          last_bike_sync?: string | null;
          last_sync_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_log: {
        Row: {
          id: string;
          user_id: string;
          component_id: string;
          notification_type: "warn" | "critical";
          sent_at: string;
          wear_pct_at_send: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          component_id: string;
          notification_type: "warn" | "critical";
          sent_at?: string;
          wear_pct_at_send: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          component_id?: string;
          notification_type?: "warn" | "critical";
          sent_at?: string;
          wear_pct_at_send?: number;
        };
        Relationships: [];
      };
      component_mounts: {
        Row: {
          id: string;
          component_id: string;
          bike_id: string;
          mounted_at: string;
          unmounted_at: string | null;
          bike_distance_at_mount: number;
          bike_distance_at_unmount: number | null;
          usage_scope: UsageScope;
          created_at: string;
        };
        Insert: {
          id?: string;
          component_id: string;
          bike_id: string;
          mounted_at: string;
          unmounted_at?: string | null;
          bike_distance_at_mount?: number;
          bike_distance_at_unmount?: number | null;
          usage_scope?: UsageScope;
          created_at?: string;
        };
        Update: {
          id?: string;
          component_id?: string;
          bike_id?: string;
          mounted_at?: string;
          unmounted_at?: string | null;
          bike_distance_at_mount?: number;
          bike_distance_at_unmount?: number | null;
          usage_scope?: UsageScope;
          created_at?: string;
        };
        Relationships: [];
      };
      virtual_periods: {
        Row: {
          id: string;
          bike_id: string;
          user_id: string;
          start_date: string;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bike_id: string;
          user_id: string;
          start_date: string;
          end_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          bike_id?: string;
          user_id?: string;
          start_date?: string;
          end_date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience types
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Bike = Database["public"]["Tables"]["bikes"]["Row"];
export type BikeInsert = Database["public"]["Tables"]["bikes"]["Insert"];
export type Component = Database["public"]["Tables"]["components"]["Row"];
export type ComponentInsert = Database["public"]["Tables"]["components"]["Insert"];
export type Activity = Database["public"]["Tables"]["activities"]["Row"];
export type ActivityInsert = Database["public"]["Tables"]["activities"]["Insert"];
export type SyncStatus = Database["public"]["Tables"]["sync_status"]["Row"];

export type ComponentMount = Database["public"]["Tables"]["component_mounts"]["Row"];
export type ComponentMountInsert = Database["public"]["Tables"]["component_mounts"]["Insert"];

export type VirtualPeriod = Database["public"]["Tables"]["virtual_periods"]["Row"];

// Extended types with relations
export type BikeWithComponents = Bike & {
  components: Component[];
};

export type LubeType = "wet_lube" | "dry_lube" | "drip_wax" | "hot_wax";

/**
 * Which rides a mount period accumulates distance from. Only "all" is written
 * today — "indoor"/"outdoor" back the planned virtual/outdoor split, where two
 * parts of the same type can sit on one bike and each take its share of rides.
 */
export type UsageScope = "all" | "indoor" | "outdoor";

export type ShiftingType = "mechanical" | "electronic";
export type BrakeType = "disc" | "rim";
export type TireSystem = "tubeless" | "clincher" | "tubular";
export type ElectronicSystem = "di2" | "axs" | "eps" | "other";

export interface BikeConfig {
  shifting_type: ShiftingType;
  brake_type: BrakeType;
  drivetrain_speed: number;
  tire_system: TireSystem;
  electronic_system?: ElectronicSystem | null;
}
