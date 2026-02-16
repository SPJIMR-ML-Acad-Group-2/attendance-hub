export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      t101_application_roles: {
        Row: {
          id: number
          role_name: string
          description: string | null
        }
        Insert: {
          id?: number
          role_name: string
          description?: string | null
        }
        Update: {
          role_name?: string
          description?: string | null
        }
      }
      t107_user_roles: { // Assuming this links users to roles
        Row: {
          id: number
          user_id: string
          role_name: string
          assigned_at?: string
        }
        Insert: {
          id?: number
          user_id: string
          role_name: string
        }
        Update: {
          role_name?: string
        }
      }
      t901_access_requests: {
        Row: {
          id: number
          user_id: string
          full_name: string
          email: string
          role_requested: string
          details: Json // Stores batch, roll_no, spec, etc.
          status: string // 'PENDING', 'APPROVED', 'REJECTED'
          submitted_at: string
          updated_at?: string
        }
        Insert: {
          user_id: string
          full_name: string
          email: string
          role_requested: string
          details: Json
          status?: string
          submitted_at?: string
        }
        Update: {
          status?: string
          details?: Json
          updated_at?: string
        }
      }
    }
  }
}
  }
}
