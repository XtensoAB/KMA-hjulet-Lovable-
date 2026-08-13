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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          area: Database["public"]["Enums"]["iso_area"]
          assigned_to: string | null
          checklist: Json
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          iso_clauses: string[]
          month: number
          quarter: number
          recurring: boolean
          responsible_role: string
          status: Database["public"]["Enums"]["activity_status"]
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          area?: Database["public"]["Enums"]["iso_area"]
          assigned_to?: string | null
          checklist?: Json
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          iso_clauses?: string[]
          month: number
          quarter: number
          recurring?: boolean
          responsible_role?: string
          status?: Database["public"]["Enums"]["activity_status"]
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          area?: Database["public"]["Enums"]["iso_area"]
          assigned_to?: string | null
          checklist?: Json
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          iso_clauses?: string[]
          month?: number
          quarter?: number
          recurring?: boolean
          responsible_role?: string
          status?: Database["public"]["Enums"]["activity_status"]
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      ai_suggestions: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"] | null
          area: Database["public"]["Enums"]["iso_area"]
          baseline: number | null
          checklist: Json
          created_at: string
          description: string | null
          document_id: string | null
          id: string
          iso_clauses: string[]
          kind: string
          month: number | null
          rationale: string | null
          responsible_role: string | null
          status: string
          target: number | null
          title: string
          unit: string | null
        }
        Insert: {
          activity_type?: Database["public"]["Enums"]["activity_type"] | null
          area?: Database["public"]["Enums"]["iso_area"]
          baseline?: number | null
          checklist?: Json
          created_at?: string
          description?: string | null
          document_id?: string | null
          id?: string
          iso_clauses?: string[]
          kind?: string
          month?: number | null
          rationale?: string | null
          responsible_role?: string | null
          status?: string
          target?: number | null
          title: string
          unit?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"] | null
          area?: Database["public"]["Enums"]["iso_area"]
          baseline?: number | null
          checklist?: Json
          created_at?: string
          description?: string | null
          document_id?: string | null
          id?: string
          iso_clauses?: string[]
          kind?: string
          month?: number | null
          rationale?: string | null
          responsible_role?: string | null
          status?: string
          target?: number | null
          title?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      deviations: {
        Row: {
          activity_id: string | null
          area: Database["public"]["Enums"]["iso_area"]
          closed_at: string | null
          corrective_action: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          location: string | null
          reference: string
          reported_at: string
          reported_by: string | null
          responsible_role: string | null
          root_cause: string | null
          severity: string
          status: Database["public"]["Enums"]["deviation_status"]
          title: string
          type: Database["public"]["Enums"]["deviation_type"]
          updated_at: string
        }
        Insert: {
          activity_id?: string | null
          area?: Database["public"]["Enums"]["iso_area"]
          closed_at?: string | null
          corrective_action?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          location?: string | null
          reference?: string
          reported_at?: string
          reported_by?: string | null
          responsible_role?: string | null
          root_cause?: string | null
          severity?: string
          status?: Database["public"]["Enums"]["deviation_status"]
          title: string
          type?: Database["public"]["Enums"]["deviation_type"]
          updated_at?: string
        }
        Update: {
          activity_id?: string | null
          area?: Database["public"]["Enums"]["iso_area"]
          closed_at?: string | null
          corrective_action?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          location?: string | null
          reference?: string
          reported_at?: string
          reported_by?: string | null
          responsible_role?: string | null
          root_cause?: string | null
          severity?: string
          status?: Database["public"]["Enums"]["deviation_status"]
          title?: string
          type?: Database["public"]["Enums"]["deviation_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deviations_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          analysis_status: string
          analysis_summary: string | null
          area: Database["public"]["Enums"]["iso_area"]
          created_at: string
          file_path: string
          id: string
          mime_type: string
          size_bytes: number
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          analysis_status?: string
          analysis_summary?: string | null
          area?: Database["public"]["Enums"]["iso_area"]
          created_at?: string
          file_path: string
          id?: string
          mime_type: string
          size_bytes?: number
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          analysis_status?: string
          analysis_summary?: string | null
          area?: Database["public"]["Enums"]["iso_area"]
          created_at?: string
          file_path?: string
          id?: string
          mime_type?: string
          size_bytes?: number
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      objectives: {
        Row: {
          area: Database["public"]["Enums"]["iso_area"]
          baseline: number | null
          created_at: string
          current_value: number | null
          id: string
          progress: Json
          responsible_role: string | null
          target: number | null
          title: string
          unit: string | null
          updated_at: string
          year: number
        }
        Insert: {
          area?: Database["public"]["Enums"]["iso_area"]
          baseline?: number | null
          created_at?: string
          current_value?: number | null
          id?: string
          progress?: Json
          responsible_role?: string | null
          target?: number | null
          title: string
          unit?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          area?: Database["public"]["Enums"]["iso_area"]
          baseline?: number | null
          created_at?: string
          current_value?: number | null
          id?: string
          progress?: Json
          responsible_role?: string | null
          target?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          activity_id: string
          assigned_to: string | null
          created_at: string
          due_date: string | null
          id: string
          responsible_role: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          activity_id: string
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          responsible_role?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          activity_id?: string
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          responsible_role?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_status: "ej_paborjad" | "pagaende" | "klar"
      activity_type:
        | "revision"
        | "riskbedomning"
        | "ledningens_genomgang"
        | "utbildning"
        | "skyddsrond"
        | "lagbevakning"
        | "maluppfoljning"
        | "nodlagesovning"
        | "leverantorsutvardering"
        | "avvikelsehantering"
        | "medarbetarsamtal"
        | "inventering"
        | "policy"
      deviation_status: "ny" | "under_utredning" | "atgard_pagar" | "stangd"
      deviation_type:
        | "avvikelse"
        | "tillbud"
        | "olycksfall"
        | "forbattringsforslag"
        | "kundklagomal"
      iso_area: "kvalitet" | "miljo" | "arbetsmiljo" | "gemensamt"
      task_status: "open" | "in_progress" | "done"
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
      activity_status: ["ej_paborjad", "pagaende", "klar"],
      activity_type: [
        "revision",
        "riskbedomning",
        "ledningens_genomgang",
        "utbildning",
        "skyddsrond",
        "lagbevakning",
        "maluppfoljning",
        "nodlagesovning",
        "leverantorsutvardering",
        "avvikelsehantering",
        "medarbetarsamtal",
        "inventering",
        "policy",
      ],
      deviation_status: ["ny", "under_utredning", "atgard_pagar", "stangd"],
      deviation_type: [
        "avvikelse",
        "tillbud",
        "olycksfall",
        "forbattringsforslag",
        "kundklagomal",
      ],
      iso_area: ["kvalitet", "miljo", "arbetsmiljo", "gemensamt"],
      task_status: ["open", "in_progress", "done"],
    },
  },
} as const
