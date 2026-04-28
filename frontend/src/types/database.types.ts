export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      comprehension_checks: {
        Row: {
          answers_json: Json;
          created_at: string;
          id: string;
          questions_json: Json;
          score: number;
          session_id: string;
        };
        Insert: {
          answers_json?: Json;
          created_at?: string;
          id?: string;
          questions_json?: Json;
          score?: number;
          session_id: string;
        };
        Update: {
          answers_json?: Json;
          created_at?: string;
          id?: string;
          questions_json?: Json;
          score?: number;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comprehension_checks_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "reading_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          file_size_bytes: number;
          id: string;
          is_sample: boolean;
          original_filename: string;
          storage_path: string;
          user_id: string;
        };
        Insert: {
          file_size_bytes: number;
          id?: string;
          is_sample?: boolean;
          original_filename: string;
          storage_path: string;
          user_id: string;
        };
        Update: {
          file_size_bytes?: number;
          id?: string;
          is_sample?: boolean;
          original_filename?: string;
          storage_path?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      reading_sessions: {
        Row: {
          achieved_wpm: number | null;
          completed: boolean;
          created_at: string;
          document_id: string;
          duration_seconds: number;
          end_page: number;
          id: string;
          start_page: number;
          target_wpm: number;
          user_id: string;
          words_read: number;
        };
        Insert: {
          achieved_wpm?: number | null;
          completed?: boolean;
          created_at?: string;
          document_id: string;
          duration_seconds?: number;
          end_page?: number;
          id?: string;
          start_page?: number;
          target_wpm: number;
          user_id: string;
          words_read?: number;
        };
        Update: {
          achieved_wpm?: number | null;
          completed?: boolean;
          created_at?: string;
          document_id?: string;
          duration_seconds?: number;
          end_page?: number;
          id?: string;
          start_page?: number;
          target_wpm?: number;
          user_id?: string;
          words_read?: number;
        };
        Relationships: [
          {
            foreignKeyName: "reading_sessions_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          default_wpm: number;
          display_name: string | null;
          email: string | null;
          focus_mode: Database["public"]["Enums"]["focus_mode"];
          id: string;
          last_login_at: string;
          role: Database["public"]["Enums"]["role"];
        };
        Insert: {
          created_at?: string;
          default_wpm?: number;
          display_name?: string | null;
          email?: string | null;
          focus_mode?: Database["public"]["Enums"]["focus_mode"];
          id: string;
          last_login_at?: string;
          role?: Database["public"]["Enums"]["role"];
        };
        Update: {
          created_at?: string;
          default_wpm?: number;
          display_name?: string | null;
          email?: string | null;
          focus_mode?: Database["public"]["Enums"]["focus_mode"];
          id?: string;
          last_login_at?: string;
          role?: Database["public"]["Enums"]["role"];
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
      focus_mode: "highlight" | "dot" | "none";
      role: "admin" | "user" | "guest";
      user_focus_mode: "highlight" | "dot";
      user_role: "admin" | "user" | "guest";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;
