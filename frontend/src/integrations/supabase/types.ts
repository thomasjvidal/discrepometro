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
      analise_discrepancia: {
        Row: {
          ano: number | null
          cfop: string | null
          codigo: string
          created_at: string
          discrepancia_tipo: string | null
          discrepancia_valor: number | null
          entradas: number | null
          est_calculado: number | null
          est_final: number | null
          est_inicial: number | null
          id: number
          observacoes: string | null
          produto: string
          saidas: number | null
          user_id: string | null
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          ano?: number | null
          cfop?: string | null
          codigo: string
          created_at?: string
          discrepancia_tipo?: string | null
          discrepancia_valor?: number | null
          entradas?: number | null
          est_calculado?: number | null
          est_final?: number | null
          est_inicial?: number | null
          id?: number
          observacoes?: string | null
          produto: string
          saidas?: number | null
          user_id?: string | null
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          ano?: number | null
          cfop?: string | null
          codigo?: string
          created_at?: string
          discrepancia_tipo?: string | null
          discrepancia_valor?: number | null
          entradas?: number | null
          est_calculado?: number | null
          est_final?: number | null
          est_inicial?: number | null
          id?: number
          observacoes?: string | null
          produto?: string
          saidas?: number | null
          user_id?: string | null
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: []
      }
      cfop_metrics: {
        Row: {
          cfop: string
          created_at: string
          id: string
          user_id: string
          valor: number
        }
        Insert: {
          cfop: string
          created_at?: string
          id?: string
          user_id: string
          valor: number
        }
        Update: {
          cfop?: string
          created_at?: string
          id?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      discrepancies: {
        Row: {
          created_at: string | null
          detalhe: string | null
          entry_id: string | null
          id: string
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          detalhe?: string | null
          entry_id?: string | null
          id?: string
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          detalhe?: string | null
          entry_id?: string | null
          id?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discrepancies_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          file_url: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      empresas: {
        Row: {
          cnpj: string
          id: string
          nome: string
        }
        Insert: {
          cnpj: string
          id?: string
          nome: string
        }
        Update: {
          cnpj?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      entries: {
        Row: {
          cfop: string | null
          created_at: string | null
          document_id: string | null
          id: string
          linha: number | null
          user_id: string | null
          valor: number | null
        }
        Insert: {
          cfop?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          linha?: number | null
          user_id?: string | null
          valor?: number | null
        }
        Update: {
          cfop?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          linha?: number | null
          user_id?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entries_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque: {
        Row: {
          data_base: string
          empresa_id: string | null
          estoque_final_2021: number | null
          estoque_inicial_2021: number | null
          id: string
          produto: string
          quantidade_final: number
        }
        Insert: {
          data_base: string
          empresa_id?: string | null
          estoque_final_2021?: number | null
          estoque_inicial_2021?: number | null
          id?: string
          produto: string
          quantidade_final: number
        }
        Update: {
          data_base?: string
          empresa_id?: string | null
          estoque_final_2021?: number | null
          estoque_inicial_2021?: number | null
          id?: string
          produto?: string
          quantidade_final?: number
        }
        Relationships: [
          {
            foreignKeyName: "estoque_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_products: {
        Row: {
          created_at: string | null
          id: string
          page_number: number | null
          product_code: string | null
          product_name: string
          quantity: number
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_number?: number | null
          product_code?: string | null
          product_name: string
          quantity: number
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          page_number?: number | null
          product_code?: string | null
          product_name?: string
          quantity?: number
          year?: number
        }
        Relationships: []
      }
      processing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          processed_chunks: number
          progress: number
          status: string
          total_chunks: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          processed_chunks?: number
          progress?: number
          status?: string
          total_chunks?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          processed_chunks?: number
          progress?: number
          status?: string
          total_chunks?: number
        }
        Relationships: []
      }
      transacoes: {
        Row: {
          cfop: string
          codigo_produto: string | null
          data: string
          empresa_id: string | null
          estoque_final_2021: number | null
          estoque_inicial_2021: number | null
          id: string
          nome_produto: string | null
          produto: string
          quantidade: number
          tipo: string | null
          total_entradas: number | null
          total_saidas: number | null
          valor: number
        }
        Insert: {
          cfop: string
          codigo_produto?: string | null
          data: string
          empresa_id?: string | null
          estoque_final_2021?: number | null
          estoque_inicial_2021?: number | null
          id?: string
          nome_produto?: string | null
          produto: string
          quantidade: number
          tipo?: string | null
          total_entradas?: number | null
          total_saidas?: number | null
          valor: number
        }
        Update: {
          cfop?: string
          codigo_produto?: string | null
          data?: string
          empresa_id?: string | null
          estoque_final_2021?: number | null
          estoque_inicial_2021?: number | null
          id?: string
          nome_produto?: string | null
          produto?: string
          quantidade?: number
          tipo?: string | null
          total_entradas?: number | null
          total_saidas?: number | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          cfop: string
          created_at: string | null
          date: string
          id: string
          product_name: string
          quantity: number
          transaction_type: string
        }
        Insert: {
          cfop: string
          created_at?: string | null
          date: string
          id?: string
          product_name: string
          quantity: number
          transaction_type: string
        }
        Update: {
          cfop?: string
          created_at?: string | null
          date?: string
          id?: string
          product_name?: string
          quantity?: number
          transaction_type?: string
        }
        Relationships: []
      }
      uploads: {
        Row: {
          file_size: number | null
          file_type: string
          filename: string
          id: string
          processed: boolean | null
          upload_date: string | null
          year: number | null
        }
        Insert: {
          file_size?: number | null
          file_type: string
          filename: string
          id?: string
          processed?: boolean | null
          upload_date?: string | null
          year?: number | null
        }
        Update: {
          file_size?: number | null
          file_type?: string
          filename?: string
          id?: string
          processed?: boolean | null
          upload_date?: string | null
          year?: number | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
