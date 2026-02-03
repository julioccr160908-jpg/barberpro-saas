export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          barber_id: string | null
          commission_amount: number | null
          created_at: string
          customer_id: string | null
          date: string
          id: string
          notes: string | null
          organization_id: string | null
          payment_id: string | null
          payment_status: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
        }
        Insert: {
          barber_id?: string | null
          commission_amount?: number | null
          created_at?: string
          customer_id?: string | null
          date: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          payment_id?: string | null
          payment_status?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
        }
        Update: {
          barber_id?: string | null
          commission_amount?: number | null
          created_at?: string
          customer_id?: string | null
          date?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          payment_id?: string | null
          payment_status?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          date: string
          id: string
          organization_id: string | null
          title: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          date: string
          id?: string
          organization_id?: string | null
          title: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          id?: string
          organization_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          appointment_id: string | null
          channel: string
          created_at: string
          customer_id: string | null
          error_message: string | null
          id: string
          organization_id: string | null
          sent_at: string | null
          status: string | null
          template_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          channel: string
          created_at?: string
          customer_id?: string | null
          error_message?: string | null
          id?: string
          organization_id?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          channel?: string
          created_at?: string
          customer_id?: string | null
          error_message?: string | null
          id?: string
          organization_id?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          channel: string
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          organization_id: string | null
          subject: string | null
          type: string
          updated_at: string
        }
        Insert: {
          channel: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          subject?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          subject?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          banner_url: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          plan_type: string | null
          primary_color: string | null
          secondary_color: string | null
          slug: string
          subscription_status: string | null
          theme_mode: string | null
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          plan_type?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          subscription_status?: string | null
          theme_mode?: string | null
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          plan_type?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          subscription_status?: string | null
          theme_mode?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          commission_rate: number | null
          created_at: string
          email: string
          id: string
          job_title: string | null
          loyalty_count: number | null
          loyalty_history: Json | null
          name: string
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          avatar_url?: string | null
          commission_rate?: number | null
          created_at?: string
          email: string
          id?: string
          job_title?: string | null
          loyalty_count?: number | null
          loyalty_history?: Json | null
          name: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          avatar_url?: string | null
          commission_rate?: number | null
          created_at?: string
          email?: string
          id?: string
          job_title?: string | null
          loyalty_count?: number | null
          loyalty_history?: Json | null
          name?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          name: string
          organization_id: string | null
          price: number
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          image_url?: string | null
          name: string
          organization_id?: string | null
          price: number
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          name?: string
          organization_id?: string | null
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          address: string | null
          city: string | null
          establishment_name: string | null
          id: number
          interval_minutes: number | null
          loyalty_enabled: boolean | null
          loyalty_target: number | null
          organization_id: string | null
          phone: string | null
          primary_color: string | null
          schedule: Json
          secondary_color: string | null
          state: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          establishment_name?: string | null
          id?: number
          interval_minutes?: number | null
          loyalty_enabled?: boolean | null
          loyalty_target?: number | null
          organization_id?: string | null
          phone?: string | null
          primary_color?: string | null
          schedule: Json
          secondary_color?: string | null
          state?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          establishment_name?: string | null
          id?: number
          interval_minutes?: number | null
          loyalty_enabled?: boolean | null
          loyalty_target?: number | null
          organization_id?: string | null
          phone?: string | null
          primary_color?: string | null
          schedule?: Json
          secondary_color?: string | null
          state?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_pending_organization: {
        Args: { org_name: string; org_slug: string }
        Returns: string
      }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      appointment_status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
      user_role: "ADMIN" | "BARBER" | "CUSTOMER" | "SUPER_ADMIN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      appointment_status: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
      user_role: ["ADMIN", "BARBER", "CUSTOMER", "SUPER_ADMIN"],
    },
  },
} as const

