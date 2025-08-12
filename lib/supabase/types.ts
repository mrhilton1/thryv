export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: "admin" | "editor" | "viewer"
          profile_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role?: "admin" | "editor" | "viewer"
          profile_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: "admin" | "editor" | "viewer"
          profile_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          role: "admin" | "editor" | "viewer"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: "admin" | "editor" | "viewer"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: "admin" | "editor" | "viewer"
          created_at?: string
          updated_at?: string
        }
      }
      config_items: {
        Row: {
          id: string
          category:
            | "teams"
            | "business_impacts"
            | "product_areas"
            | "process_stages"
            | "priorities"
            | "statuses"
            | "gtm_types"
          label: string
          color: "gray" | "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink"
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
          created_by_id: string | null
        }
        Insert: {
          id?: string
          category:
            | "teams"
            | "business_impacts"
            | "product_areas"
            | "process_stages"
            | "priorities"
            | "statuses"
            | "gtm_types"
          label: string
          color?: "gray" | "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink"
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by_id?: string | null
        }
        Update: {
          id?: string
          category?:
            | "teams"
            | "business_impacts"
            | "product_areas"
            | "process_stages"
            | "priorities"
            | "statuses"
            | "gtm_types"
          label?: string
          color?: "gray" | "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink"
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by_id?: string | null
        }
      }
      initiatives: {
        Row: {
          id: string
          title: string
          description: string
          goal: string | null
          product_area: string
          team: string
          tier: number
          owner_id: string
          status: string
          process_stage: string
          priority: string
          business_impact: string
          start_date: string | null
          estimated_release_date: string | null
          actual_release_date: string | null
          estimated_gtm_type: string | null
          progress: number
          tags: string[]
          executive_update: string | null
          reason_if_not_on_track: string | null
          show_on_executive_summary: boolean
          created_by_id: string
          last_updated_by_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          goal?: string | null
          product_area: string
          team: string
          tier?: number
          owner_id: string
          status?: string
          process_stage?: string
          priority?: string
          business_impact?: string
          start_date?: string | null
          estimated_release_date?: string | null
          actual_release_date?: string | null
          estimated_gtm_type?: string | null
          progress?: number
          tags?: string[]
          executive_update?: string | null
          reason_if_not_on_track?: string | null
          show_on_executive_summary?: boolean
          created_by_id: string
          last_updated_by_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          goal?: string | null
          product_area?: string
          team?: string
          tier?: number
          owner_id?: string
          status?: string
          process_stage?: string
          priority?: string
          business_impact?: string
          start_date?: string | null
          estimated_release_date?: string | null
          actual_release_date?: string | null
          estimated_gtm_type?: string | null
          progress?: number
          tags?: string[]
          executive_update?: string | null
          reason_if_not_on_track?: string | null
          show_on_executive_summary?: boolean
          created_by_id?: string
          last_updated_by_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          initiative_id: string
          content: string
          created_by_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          initiative_id: string
          content: string
          created_by_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          initiative_id?: string
          content?: string
          created_by_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          title: string
          description: string
          icon: string
          type: string
          initiative_id: string | null
          created_by_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          icon?: string
          type: string
          initiative_id?: string | null
          created_by_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          icon?: string
          type?: string
          initiative_id?: string | null
          created_by_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      executive_summaries: {
        Row: {
          id: string
          title: string
          content: string
          key_metrics: Json
          created_by_id: string
          updated_by_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          key_metrics?: Json
          created_by_id: string
          updated_by_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          key_metrics?: Json
          created_by_id?: string
          updated_by_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      navigation_settings: {
        Row: {
          id: string
          name: string
          path: string
          icon: string
          is_visible: boolean
          sort_order: number
          is_default: boolean
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          path: string
          icon: string
          is_visible?: boolean
          sort_order?: number
          is_default?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          path?: string
          icon?: string
          is_visible?: boolean
          sort_order?: number
          is_default?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Additional type exports for NavigationConfig
export interface NavigationConfig {
  id: string
  name: string
  description?: string
  icon?: string
  route?: string
  permission: string
  isVisible: boolean
  order: number
  isDefault: boolean
  createdAt?: string
  createdById?: string
}
