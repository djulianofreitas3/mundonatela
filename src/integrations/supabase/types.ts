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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          observacao: string | null
          status: string | null
          telefone: string | null
          updated_at: string | null
          vencimento: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          observacao?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          vencimento?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          observacao?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          vencimento?: string | null
        }
        Relationships: []
      }
      codigos_ativacao: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          installation_id: string
          poll_token: string | null
          request_id: string | null
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          installation_id: string
          poll_token?: string | null
          request_id?: string | null
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          installation_id?: string
          poll_token?: string | null
          request_id?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "codigos_ativacao_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["installation_id"]
          },
        ]
      }
      dispositivo_lista: {
        Row: {
          created_at: string | null
          dispositivo_id: string | null
          id: string
          lista_id: string | null
        }
        Insert: {
          created_at?: string | null
          dispositivo_id?: string | null
          id?: string
          lista_id?: string | null
        }
        Update: {
          created_at?: string | null
          dispositivo_id?: string | null
          id?: string
          lista_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispositivo_lista_dispositivo_id_fkey"
            columns: ["dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispositivo_lista_lista_id_fkey"
            columns: ["lista_id"]
            isOneToOne: false
            referencedRelation: "listas_iptv"
            referencedColumns: ["id"]
          },
        ]
      }
      dispositivos: {
        Row: {
          activated_at: string | null
          android_version: string | null
          app_version: string | null
          cliente_id: string | null
          created_at: string | null
          device_name: string | null
          device_token: string | null
          expires_at: string | null
          id: string
          installation_id: string
          last_seen_at: string | null
          status: Database["public"]["Enums"]["device_status"] | null
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          android_version?: string | null
          app_version?: string | null
          cliente_id?: string | null
          created_at?: string | null
          device_name?: string | null
          device_token?: string | null
          expires_at?: string | null
          id?: string
          installation_id: string
          last_seen_at?: string | null
          status?: Database["public"]["Enums"]["device_status"] | null
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          android_version?: string | null
          app_version?: string | null
          cliente_id?: string | null
          created_at?: string | null
          device_name?: string | null
          device_token?: string | null
          expires_at?: string | null
          id?: string
          installation_id?: string
          last_seen_at?: string | null
          status?: Database["public"]["Enums"]["device_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispositivos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_ativacoes: {
        Row: {
          action: string
          cliente_id: string | null
          created_at: string | null
          details: Json | null
          dispositivo_id: string | null
          id: string
          lista_id: string | null
        }
        Insert: {
          action: string
          cliente_id?: string | null
          created_at?: string | null
          details?: Json | null
          dispositivo_id?: string | null
          id?: string
          lista_id?: string | null
        }
        Update: {
          action?: string
          cliente_id?: string | null
          created_at?: string | null
          details?: Json | null
          dispositivo_id?: string | null
          id?: string
          lista_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_ativacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_ativacoes_dispositivo_id_fkey"
            columns: ["dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_ativacoes_lista_id_fkey"
            columns: ["lista_id"]
            isOneToOne: false
            referencedRelation: "listas_iptv"
            referencedColumns: ["id"]
          },
        ]
      }
      listas_iptv: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          id: string
          nome: string
          senha: string
          status: string | null
          updated_at: string | null
          url: string
          usuario: string
          vencimento: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          nome: string
          senha: string
          status?: string | null
          updated_at?: string | null
          url: string
          usuario: string
          vencimento?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          senha?: string
          status?: string | null
          updated_at?: string | null
          url?: string
          usuario?: string
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listas_iptv_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
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
      device_status: "pending" | "active" | "expired" | "blocked" | "revoked"
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
      device_status: ["pending", "active", "expired", "blocked", "revoked"],
    },
  },
} as const
