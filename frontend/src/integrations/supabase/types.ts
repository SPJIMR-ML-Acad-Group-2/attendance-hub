export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          course_id: string
          created_at: string
          id: string
          session_date: string
          status: string
          student_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          session_date: string
          status: string
          student_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          session_date?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          created_at: string
          division_id: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          division_id: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          division_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          student_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          student_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          student_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          division_id: string
          id: string
          name: string
          student_code: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          division_id: string
          id?: string
          name: string
          student_code: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          division_id?: string
          id?: string
          name?: string
          student_code?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      t101_application_roles: {
        Row: {
          role_code: string
          role_name: string
          created_at: string
        }
        Insert: {
          role_code: string
          role_name: string
          created_at?: string
        }
        Update: {
          role_code?: string
          role_name?: string
          created_at?: string
        }
        Relationships: []
      }
      t102_dashboard_tiles: {
        Row: {
          id: string
          tile_key: string
          tile_label: string
          created_at: string
        }
        Insert: {
          id?: string
          tile_key: string
          tile_label: string
          created_at?: string
        }
        Update: {
          id?: string
          tile_key?: string
          tile_label?: string
          created_at?: string
        }
        Relationships: []
      }
      t103_dashboard_subtiles: {
        Row: {
          id: string
          tile_id: string
          subtile_key: string
          subtile_label: string
          created_at: string
        }
        Insert: {
          id?: string
          tile_id: string
          subtile_key: string
          subtile_label: string
          created_at?: string
        }
        Update: {
          id?: string
          tile_id?: string
          subtile_key?: string
          subtile_label?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "t103_dashboard_subtiles_tile_id_fkey"
            columns: ["tile_id"]
            isOneToOne: false
            referencedRelation: "t102_dashboard_tiles"
            referencedColumns: ["id"]
          },
        ]
      }
      t104_role_tile_access: {
        Row: {
          id: string
          role_code: string
          tile_id: string
          tile_key: string
          tile_label: string
          can_view: boolean
          all_subtiles: boolean
          created_at: string
          last_updated_at: string
        }
        Insert: {
          id?: string
          role_code: string
          tile_id: string
          tile_key: string
          tile_label: string
          can_view?: boolean
          all_subtiles?: boolean
          created_at?: string
          last_updated_at?: string
        }
        Update: {
          id?: string
          role_code?: string
          tile_id?: string
          tile_key?: string
          tile_label?: string
          can_view?: boolean
          all_subtiles?: boolean
          created_at?: string
          last_updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "t104_role_tile_access_role_code_fkey"
            columns: ["role_code"]
            isOneToOne: false
            referencedRelation: "t101_application_roles"
            referencedColumns: ["role_code"]
          },
          {
            foreignKeyName: "t104_role_tile_access_tile_id_fkey"
            columns: ["tile_id"]
            isOneToOne: false
            referencedRelation: "t102_dashboard_tiles"
            referencedColumns: ["id"]
          },
        ]
      }
      t105_role_subtile_access: {
        Row: {
          id: string
          role_code: string
          subtile_id: string
          subtile_key: string
          subtile_label: string
          tile_id: string
          tile_key: string
          tile_label: string
          can_view: boolean
          created_at: string
          last_updated_at: string
        }
        Insert: {
          id?: string
          role_code: string
          subtile_id: string
          subtile_key: string
          subtile_label: string
          tile_id: string
          tile_key: string
          tile_label: string
          can_view?: boolean
          created_at?: string
          last_updated_at?: string
        }
        Update: {
          id?: string
          role_code?: string
          subtile_id?: string
          subtile_key?: string
          subtile_label?: string
          tile_id?: string
          tile_key?: string
          tile_label?: string
          can_view?: boolean
          created_at?: string
          last_updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "t105_role_subtile_access_role_code_fkey"
            columns: ["role_code"]
            isOneToOne: false
            referencedRelation: "t101_application_roles"
            referencedColumns: ["role_code"]
          },
          {
            foreignKeyName: "t105_role_subtile_access_subtile_id_fkey"
            columns: ["subtile_id"]
            isOneToOne: false
            referencedRelation: "t103_dashboard_subtiles"
            referencedColumns: ["id"]
          },
        ]
      }
      t106_user_profile: {
        Row: {
          id: string
          user_id: string | null
          email: string
          full_name: string
          primary_role: string
          requested_role: string | null
          access_status: string
          request_payload: Json | null
          imported_by_program_office: boolean
          last_login_at: string | null
          created_at: string
          last_updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          email: string
          full_name?: string
          primary_role: string
          requested_role?: string | null
          access_status?: string
          request_payload?: Json | null
          imported_by_program_office?: boolean
          last_login_at?: string | null
          created_at?: string
          last_updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          email?: string
          full_name?: string
          primary_role?: string
          requested_role?: string | null
          access_status?: string
          request_payload?: Json | null
          imported_by_program_office?: boolean
          last_login_at?: string | null
          created_at?: string
          last_updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "t106_user_profile_primary_role_fkey"
            columns: ["primary_role"]
            isOneToOne: false
            referencedRelation: "t101_application_roles"
            referencedColumns: ["role_code"]
          },
        ]
      }
      t107_user_logs: {
        Row: {
          id: number
          user_id: string | null
          email: string | null
          api_path: string
          http_method: string
          status_code: number | null
          ip: string | null
          user_agent: string | null
          request_id: string
          meta: Json | null
          called_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          email?: string | null
          api_path: string
          http_method: string
          status_code?: number | null
          ip?: string | null
          user_agent?: string | null
          request_id?: string
          meta?: Json | null
          called_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          email?: string | null
          api_path?: string
          http_method?: string
          status_code?: number | null
          ip?: string | null
          user_agent?: string | null
          request_id?: string
          meta?: Json | null
          called_at?: string
        }
        Relationships: []
      }
      upload_logs: {
        Row: {
          created_at: string
          errors: Json | null
          filename: string
          id: string
          rows_failed: number
          rows_processed: number
          status: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          errors?: Json | null
          filename: string
          id?: string
          rows_failed?: number
          rows_processed?: number
          status?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          errors?: Json | null
          filename?: string
          id?: string
          rows_failed?: number
          rows_processed?: number
          status?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login_at: string | null
          name: string | null
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          last_login_at?: string | null
          name?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          name?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_student_id_for_user: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "program_office" | "developer" | "user"
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
  public: {
    Enums: {
      app_role: ["student", "program_office", "developer", "user"],
    },
  },
} as const
