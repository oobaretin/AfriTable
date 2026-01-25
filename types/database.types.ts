export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          has_reset_password: boolean;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          has_reset_password?: boolean;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          has_reset_password?: boolean;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema: "auth";
          },
        ];
      };

      restaurants: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          cuisine_types: string[];
          address: Json | null;
          display_city: string | null;
          phone: string | null;
          website: string | null;
          instagram_handle: string | null;
          facebook_url: string | null;
          price_range: number;
          description: string | null;
          images: string[];
          hours: Json | null;
          external_avg_rating: number | null;
          external_review_count: number | null;
          verification: Json | null;
          is_claimed: boolean;
          claimed_by: string | null;
          claimed_at: string | null;
          is_active: boolean;
          published_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          cuisine_types?: string[];
          address?: Json | null;
          display_city?: string | null;
          phone?: string | null;
          website?: string | null;
          instagram_handle?: string | null;
          facebook_url?: string | null;
          price_range: number;
          description?: string | null;
          images?: string[];
          hours?: Json | null;
          external_avg_rating?: number | null;
          external_review_count?: number | null;
          verification?: Json | null;
          is_claimed?: boolean;
          claimed_by?: string | null;
          claimed_at?: string | null;
          is_active?: boolean;
          published_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          slug?: string;
          cuisine_types?: string[];
          address?: Json | null;
          display_city?: string | null;
          phone?: string | null;
          website?: string | null;
          instagram_handle?: string | null;
          facebook_url?: string | null;
          price_range?: number;
          description?: string | null;
          images?: string[];
          hours?: Json | null;
          external_avg_rating?: number | null;
          external_review_count?: number | null;
          verification?: Json | null;
          is_claimed?: boolean;
          claimed_by?: string | null;
          claimed_at?: string | null;
          is_active?: boolean;
          published_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "restaurants_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "restaurants_claimed_by_fkey";
            columns: ["claimed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      restaurant_tables: {
        Row: {
          id: string;
          restaurant_id: string;
          table_number: string;
          capacity: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          table_number: string;
          capacity: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          table_number?: string;
          capacity?: number;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };

      availability_settings: {
        Row: {
          id: string;
          restaurant_id: string;
          slot_duration_minutes: number;
          advance_booking_days: number;
          same_day_cutoff_hours: number;
          max_party_size: number;
          operating_hours: Json;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          slot_duration_minutes?: number;
          advance_booking_days?: number;
          same_day_cutoff_hours?: number;
          max_party_size?: number;
          operating_hours?: Json;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          slot_duration_minutes?: number;
          advance_booking_days?: number;
          same_day_cutoff_hours?: number;
          max_party_size?: number;
          operating_hours?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "availability_settings_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: true;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };

      reservations: {
        Row: {
          id: string;
          restaurant_id: string;
          user_id: string;
          reservation_date: string;
          reservation_time: string;
          party_size: number;
          status: Database["public"]["Enums"]["reservation_status"];
          special_requests: string | null;
          occasion: string | null;
          guest_name: string | null;
          guest_email: string | null;
          guest_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          user_id: string;
          reservation_date: string;
          reservation_time: string;
          party_size: number;
          status?: Database["public"]["Enums"]["reservation_status"];
          special_requests?: string | null;
          occasion?: string | null;
          guest_name?: string | null;
          guest_email?: string | null;
          guest_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          user_id?: string;
          reservation_date?: string;
          reservation_time?: string;
          party_size?: number;
          status?: Database["public"]["Enums"]["reservation_status"];
          special_requests?: string | null;
          occasion?: string | null;
          guest_name?: string | null;
          guest_email?: string | null;
          guest_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      reviews: {
        Row: {
          id: string;
          reservation_id: string;
          user_id: string;
          restaurant_id: string;
          overall_rating: number;
          food_rating: number | null;
          service_rating: number | null;
          ambiance_rating: number | null;
          review_text: string | null;
          photos: string[];
          restaurant_response: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reservation_id: string;
          user_id: string;
          restaurant_id: string;
          overall_rating: number;
          food_rating?: number | null;
          service_rating?: number | null;
          ambiance_rating?: number | null;
          review_text?: string | null;
          photos?: string[];
          restaurant_response?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reservation_id?: string;
          user_id?: string;
          restaurant_id?: string;
          overall_rating?: number;
          food_rating?: number | null;
          service_rating?: number | null;
          ambiance_rating?: number | null;
          review_text?: string | null;
          photos?: string[];
          restaurant_response?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: true;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      favorites: {
        Row: {
          id: string;
          user_id: string;
          restaurant_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          restaurant_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          restaurant_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };

      restaurant_claim_requests: {
        Row: {
          id: string;
          restaurant_id: string;
          user_id: string;
          full_name: string;
          email: string;
          phone: string;
          proof: string | null;
          status: Database["public"]["Enums"]["claim_request_status"];
          decision_note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          user_id: string;
          full_name: string;
          email: string;
          phone: string;
          proof?: string | null;
          status?: Database["public"]["Enums"]["claim_request_status"];
          decision_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          user_id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          proof?: string | null;
          status?: Database["public"]["Enums"]["claim_request_status"];
          decision_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "restaurant_claim_requests_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "restaurant_claim_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "restaurant_claim_requests_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      restaurant_submissions: {
        Row: {
          id: string;
          name: string;
          city: string;
          state: string;
          cuisine_types: string[] | null;
          address: string | null;
          phone: string | null;
          website: string | null;
          notes: string | null;
          submitted_by_email: string | null;
          owner_invited: boolean;
          owner_invited_at: string | null;
          owner_email: string | null;
          owner_invite_token_hash: string | null;
          owner_invite_token_expires_at: string | null;
          owner_invite_token_used_at: string | null;
          verification: Json;
          admin_notes: string | null;
          status: "submitted" | "under_review" | "owner_invited" | "verified" | "approved" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city: string;
          state: string;
          cuisine_types?: string[] | null;
          address?: string | null;
          phone?: string | null;
          website?: string | null;
          notes?: string | null;
          submitted_by_email?: string | null;
          owner_invited?: boolean;
          owner_invited_at?: string | null;
          owner_email?: string | null;
          owner_invite_token_hash?: string | null;
          owner_invite_token_expires_at?: string | null;
          owner_invite_token_used_at?: string | null;
          verification?: Json;
          admin_notes?: string | null;
          status?: "submitted" | "under_review" | "owner_invited" | "verified" | "approved" | "rejected";
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          city?: string;
          state?: string;
          cuisine_types?: string[] | null;
          address?: string | null;
          phone?: string | null;
          website?: string | null;
          notes?: string | null;
          submitted_by_email?: string | null;
          owner_invited?: boolean;
          owner_invited_at?: string | null;
          owner_email?: string | null;
          owner_invite_token_hash?: string | null;
          owner_invite_token_expires_at?: string | null;
          owner_invite_token_used_at?: string | null;
          verification?: Json;
          admin_notes?: string | null;
          status?: "submitted" | "under_review" | "owner_invited" | "verified" | "approved" | "rejected";
          created_at?: string;
        };
        Relationships: [];
      };

      submission_events: {
        Row: {
          id: string;
          submission_id: string;
          event: string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          submission_id: string;
          event: string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          submission_id?: string;
          event?: string;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "submission_events_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "restaurant_submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submission_events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      restaurants_with_rating: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          cuisine_types: string[];
          address: Json | null;
          display_city: string | null;
          phone: string | null;
          website: string | null;
          instagram_handle: string | null;
          facebook_url: string | null;
          price_range: number;
          description: string | null;
          images: string[];
          hours: Json | null;
          is_active: boolean;
          created_at: string;
          avg_rating: number | null;
          review_count: number;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      current_user_role: {
        Args: Record<string, never>;
        Returns: Database["public"]["Enums"]["user_role"];
      };
    };
    Enums: {
      claim_request_status: "pending" | "approved" | "rejected";
      user_role: "diner" | "pending_owner" | "restaurant_owner" | "admin";
      reservation_status:
        | "pending"
        | "confirmed"
        | "seated"
        | "completed"
        | "cancelled"
        | "no_show";
    };
    CompositeTypes: Record<string, never>;
  };
};

