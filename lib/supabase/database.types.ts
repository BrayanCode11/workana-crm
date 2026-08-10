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
      clients: {
        Row: {
          company_name: string | null
          country: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
          user_id: string
          workana_profile_url: string | null
        }
        Insert: {
          company_name?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          workana_profile_url?: string | null
        }
        Update: {
          company_name?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          workana_profile_url?: string | null
        }
        Relationships: []
      }
      experiment_variants: {
        Row: {
          ai_instructions: string | null
          code: string
          created_at: string
          description: string | null
          experiment_id: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_instructions?: string | null
          code: string
          created_at?: string
          description?: string | null
          experiment_id: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          ai_instructions?: string | null
          code?: string
          created_at?: string
          description?: string | null
          experiment_id?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_variants_experiment_fk"
            columns: ["experiment_id", "user_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      experiments: {
        Row: {
          created_at: string
          description: string | null
          ended_at: string | null
          id: string
          is_default_for_new_opportunities: boolean
          name: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          is_default_for_new_opportunities?: boolean
          name: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          is_default_for_new_opportunities?: boolean
          name?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lost_reasons: {
        Row: {
          id: number
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          id?: never
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          id?: never
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          client_id: string | null
          contact_country: string | null
          contact_name: string | null
          created_at: string
          description: string | null
          experiment_id: string | null
          experiment_variant_id: string | null
          final_value: number | null
          final_value_currency: string | null
          first_contacted_at: string | null
          first_response_at: string | null
          follow_up_1_at: string | null
          follow_up_2_at: string | null
          id: string
          last_contact_at: string | null
          lost_at: string | null
          lost_reason_id: number | null
          lost_reason_notes: string | null
          negotiation_at: string | null
          next_follow_up_at: string | null
          planned_price: number | null
          planned_price_currency: string | null
          project_type: string | null
          proposal_at: string | null
          published_at: string | null
          published_budget_currency: string | null
          published_budget_max: number | null
          published_budget_min: number | null
          stage: string
          technologies: string[]
          title: string
          updated_at: string
          user_id: string
          won_at: string | null
          workana_url: string | null
        }
        Insert: {
          client_id?: string | null
          contact_country?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          experiment_id?: string | null
          experiment_variant_id?: string | null
          final_value?: number | null
          final_value_currency?: string | null
          first_contacted_at?: string | null
          first_response_at?: string | null
          follow_up_1_at?: string | null
          follow_up_2_at?: string | null
          id?: string
          last_contact_at?: string | null
          lost_at?: string | null
          lost_reason_id?: number | null
          lost_reason_notes?: string | null
          negotiation_at?: string | null
          next_follow_up_at?: string | null
          planned_price?: number | null
          planned_price_currency?: string | null
          project_type?: string | null
          proposal_at?: string | null
          published_at?: string | null
          published_budget_currency?: string | null
          published_budget_max?: number | null
          published_budget_min?: number | null
          stage?: string
          technologies?: string[]
          title: string
          updated_at?: string
          user_id?: string
          won_at?: string | null
          workana_url?: string | null
        }
        Update: {
          client_id?: string | null
          contact_country?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          experiment_id?: string | null
          experiment_variant_id?: string | null
          final_value?: number | null
          final_value_currency?: string | null
          first_contacted_at?: string | null
          first_response_at?: string | null
          follow_up_1_at?: string | null
          follow_up_2_at?: string | null
          id?: string
          last_contact_at?: string | null
          lost_at?: string | null
          lost_reason_id?: number | null
          lost_reason_notes?: string | null
          negotiation_at?: string | null
          next_follow_up_at?: string | null
          planned_price?: number | null
          planned_price_currency?: string | null
          project_type?: string | null
          proposal_at?: string | null
          published_at?: string | null
          published_budget_currency?: string | null
          published_budget_max?: number | null
          published_budget_min?: number | null
          stage?: string
          technologies?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          won_at?: string | null
          workana_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_client_fk"
            columns: ["client_id", "user_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "opportunities_experiment_fk"
            columns: ["experiment_id", "user_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "opportunities_lost_reason_id_fkey"
            columns: ["lost_reason_id"]
            isOneToOne: false
            referencedRelation: "lost_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_variant_fk"
            columns: ["experiment_variant_id", "experiment_id", "user_id"]
            isOneToOne: false
            referencedRelation: "experiment_variants"
            referencedColumns: ["id", "experiment_id", "user_id"]
          },
        ]
      }
      opportunity_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          opportunity_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          opportunity_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          opportunity_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_notes_opportunity_fk"
            columns: ["opportunity_id", "user_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      opportunity_messages: {
        Row: {
          content: string
          created_at: string
          direction: string
          id: string
          message_type: string
          opportunity_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          direction: string
          id?: string
          message_type: string
          opportunity_id: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          direction?: string
          id?: string
          message_type?: string
          opportunity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_messages_opportunity_fk"
            columns: ["opportunity_id", "user_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      ai_generations: {
        Row: {
          content: string | null
          created_at: string
          generation_type: string
          id: string
          model: string
          opportunity_id: string
          prompt_version: string
          structured_data: Json
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          generation_type: string
          id?: string
          model: string
          opportunity_id: string
          prompt_version: string
          structured_data: Json
          user_id?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          generation_type?: string
          id?: string
          model?: string
          opportunity_id?: string
          prompt_version?: string
          structured_data?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_opportunity_fk"
            columns: ["opportunity_id", "user_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
