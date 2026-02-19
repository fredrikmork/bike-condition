export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
          total_distance: number;
          is_primary: boolean;
          retired: boolean;
          deleted_defaults: string[];
          shifting_type: ShiftingType | null;
          brake_type: BrakeType | null;
          drivetrain_speed: number | null;
          tire_system: TireSystem | null;
          config_complete: boolean;
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
          total_distance?: number;
          is_primary?: boolean;
          retired?: boolean;
          deleted_defaults?: string[];
          shifting_type?: ShiftingType | null;
          brake_type?: BrakeType | null;
          drivetrain_speed?: number | null;
          tire_system?: TireSystem | null;
          config_complete?: boolean;
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
          total_distance?: number;
          is_primary?: boolean;
          retired?: boolean;
          deleted_defaults?: string[];
          shifting_type?: ShiftingType | null;
          brake_type?: BrakeType | null;
          drivetrain_speed?: number | null;
          tire_system?: TireSystem | null;
          config_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      components: {
        Row: {
          id: string;
          bike_id: string;
          name: string;
          type: string;
          icon: string | null;
          brand: string | null;
          model: string | null;
          spec: string | null;
          lube_type: LubeType | null;
          recommended_distance: number;
          current_distance: number;
          bike_distance_at_install: number;
          installed_at: string;
          replaced_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bike_id: string;
          name: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bike_id?: string;
          name?: string;
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
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserToken = Database["public"]["Tables"]["user_tokens"]["Row"];
export type UserTokenInsert = Database["public"]["Tables"]["user_tokens"]["Insert"];
export type Bike = Database["public"]["Tables"]["bikes"]["Row"];
export type BikeInsert = Database["public"]["Tables"]["bikes"]["Insert"];
export type Component = Database["public"]["Tables"]["components"]["Row"];
export type ComponentInsert = Database["public"]["Tables"]["components"]["Insert"];
export type Activity = Database["public"]["Tables"]["activities"]["Row"];
export type ActivityInsert = Database["public"]["Tables"]["activities"]["Insert"];
export type SyncStatus = Database["public"]["Tables"]["sync_status"]["Row"];

// Extended types with relations
export type BikeWithComponents = Bike & {
  components: Component[];
};

export type LubeType = 'wet_lube' | 'dry_lube' | 'drip_wax' | 'hot_wax';

export type ShiftingType = 'mechanical' | 'electronic';
export type BrakeType = 'disc' | 'rim';
export type TireSystem = 'tubeless' | 'clincher' | 'tubular';

export interface BikeConfig {
  shifting_type: ShiftingType;
  brake_type: BrakeType;
  drivetrain_speed: number;
  tire_system: TireSystem;
}
