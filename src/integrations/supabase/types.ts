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
      channel_contacts: {
        Row: {
          channel_id: string
          created_at: string
          created_by: string
          external_id: string
          external_name: string | null
          id: string
          integration_id: string
          is_active: boolean
          last_message_at: string | null
          metadata: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          created_by: string
          external_id: string
          external_name?: string | null
          id?: string
          integration_id: string
          is_active?: boolean
          last_message_at?: string | null
          metadata?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          created_by?: string
          external_id?: string
          external_name?: string | null
          id?: string
          integration_id?: string
          is_active?: boolean
          last_message_at?: string | null
          metadata?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_contacts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_contacts_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "channel_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_integrations: {
        Row: {
          config: Json
          created_at: string
          created_by: string
          credentials_secret_name: string | null
          display_name: string
          id: string
          is_active: boolean
          provider: Database["public"]["Enums"]["messaging_provider"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by: string
          credentials_secret_name?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          provider: Database["public"]["Enums"]["messaging_provider"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string
          credentials_secret_name?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          provider?: Database["public"]["Enums"]["messaging_provider"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      chat_api_keys: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          scopes: string[]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          scopes?: string[]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          scopes?: string[]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      chat_channels: {
        Row: {
          created_at: string
          created_by: string
          department: string | null
          description: string | null
          emoji: string | null
          id: string
          is_archived: boolean
          is_read_only: boolean
          last_message_at: string | null
          last_message_preview: string | null
          linked_module_label: string | null
          linked_module_slug: string | null
          message_count: number
          name: string
          pinned_message_ids: string[] | null
          sort_order: number
          topic: string | null
          type: Database["public"]["Enums"]["channel_type"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          department?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_archived?: boolean
          is_read_only?: boolean
          last_message_at?: string | null
          last_message_preview?: string | null
          linked_module_label?: string | null
          linked_module_slug?: string | null
          message_count?: number
          name: string
          pinned_message_ids?: string[] | null
          sort_order?: number
          topic?: string | null
          type?: Database["public"]["Enums"]["channel_type"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          department?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_archived?: boolean
          is_read_only?: boolean
          last_message_at?: string | null
          last_message_preview?: string | null
          linked_module_label?: string | null
          linked_module_slug?: string | null
          message_count?: number
          name?: string
          pinned_message_ids?: string[] | null
          sort_order?: number
          topic?: string | null
          type?: Database["public"]["Enums"]["channel_type"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      chat_event_subscriptions: {
        Row: {
          api_key_id: string
          callback_url: string
          created_at: string
          created_by: string
          events: string[]
          failure_count: number
          id: string
          is_active: boolean
          last_delivered_at: string | null
          signing_secret: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          api_key_id: string
          callback_url: string
          created_at?: string
          created_by: string
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_delivered_at?: string | null
          signing_secret?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          api_key_id?: string
          callback_url?: string
          created_at?: string
          created_by?: string
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_delivered_at?: string | null
          signing_secret?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_event_subscriptions_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "chat_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_members: {
        Row: {
          channel_id: string
          id: string
          is_starred: boolean
          joined_at: string
          last_read_at: string | null
          notifications_muted: boolean
          role: string
          unread_count: number
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          is_starred?: boolean
          joined_at?: string
          last_read_at?: string | null
          notifications_muted?: boolean
          role?: string
          unread_count?: number
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          is_starred?: boolean
          joined_at?: string
          last_read_at?: string | null
          notifications_muted?: boolean
          role?: string
          unread_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_id: string
          channel_mentions: string[] | null
          content: string
          content_html: string | null
          context_links: Json
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          file_name: string | null
          file_size: number | null
          file_thumbnail_url: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_deleted: boolean
          is_edited: boolean
          mentions: string[] | null
          metadata: Json
          pinned: boolean
          pinned_at: string | null
          pinned_by: string | null
          reactions: Json
          source: Database["public"]["Enums"]["message_source"]
          thread_last_reply_at: string | null
          thread_parent_id: string | null
          thread_participant_ids: string[] | null
          thread_reply_count: number
          type: Database["public"]["Enums"]["message_type"]
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          channel_id: string
          channel_mentions?: string[] | null
          content: string
          content_html?: string | null
          context_links?: Json
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_thumbnail_url?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          mentions?: string[] | null
          metadata?: Json
          pinned?: boolean
          pinned_at?: string | null
          pinned_by?: string | null
          reactions?: Json
          source?: Database["public"]["Enums"]["message_source"]
          thread_last_reply_at?: string | null
          thread_parent_id?: string | null
          thread_participant_ids?: string[] | null
          thread_reply_count?: number
          type?: Database["public"]["Enums"]["message_type"]
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          channel_id?: string
          channel_mentions?: string[] | null
          content?: string
          content_html?: string | null
          context_links?: Json
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_thumbnail_url?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          mentions?: string[] | null
          metadata?: Json
          pinned?: boolean
          pinned_at?: string | null
          pinned_by?: string | null
          reactions?: Json
          source?: Database["public"]["Enums"]["message_source"]
          thread_last_reply_at?: string | null
          thread_parent_id?: string | null
          thread_participant_ids?: string[] | null
          thread_reply_count?: number
          type?: Database["public"]["Enums"]["message_type"]
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_thread_parent_id_fkey"
            columns: ["thread_parent_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_presence: {
        Row: {
          id: string
          last_seen_at: string
          status: Database["public"]["Enums"]["presence_status"]
          status_emoji: string | null
          status_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          last_seen_at?: string
          status?: Database["public"]["Enums"]["presence_status"]
          status_emoji?: string | null
          status_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          last_seen_at?: string
          status?: Database["public"]["Enums"]["presence_status"]
          status_emoji?: string | null
          status_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_webhooks: {
        Row: {
          avatar_url: string | null
          channel_id: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          last_triggered_at: string | null
          name: string
          token: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          avatar_url?: string | null
          channel_id: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name: string
          token?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          avatar_url?: string | null
          channel_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name?: string
          token?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_webhooks_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_workspace_connections: {
        Row: {
          has_mention: boolean | null
          id: string
          is_active: boolean | null
          joined_at: string | null
          last_active_at: string | null
          sort_order: number | null
          total_unread: number | null
          user_id: string
          workspace_color: string | null
          workspace_id: string
          workspace_logo_url: string | null
          workspace_name: string
          workspace_type: string
        }
        Insert: {
          has_mention?: boolean | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          last_active_at?: string | null
          sort_order?: number | null
          total_unread?: number | null
          user_id: string
          workspace_color?: string | null
          workspace_id: string
          workspace_logo_url?: string | null
          workspace_name: string
          workspace_type?: string
        }
        Update: {
          has_mention?: boolean | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          last_active_at?: string | null
          sort_order?: number | null
          total_unread?: number | null
          user_id?: string
          workspace_color?: string | null
          workspace_id?: string
          workspace_logo_url?: string | null
          workspace_name?: string
          workspace_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          channel_id: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          last_message_at: string | null
          phone_number: string
          updated_at: string
          whatsapp_id: string | null
          whatsapp_name: string | null
          workspace_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          phone_number: string
          updated_at?: string
          whatsapp_id?: string | null
          whatsapp_name?: string | null
          workspace_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          phone_number?: string
          updated_at?: string
          whatsapp_id?: string | null
          whatsapp_name?: string | null
          workspace_id?: string
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
      channel_type:
        | "public"
        | "private"
        | "dm"
        | "group_dm"
        | "department"
        | "announcement"
        | "automation"
      message_source: "user" | "ai" | "n8n" | "system"
      message_type: "text" | "file" | "image" | "system" | "ai" | "automation"
      messaging_provider:
        | "whatsapp"
        | "telegram"
        | "facebook"
        | "instagram"
        | "linkedin"
        | "sms"
        | "custom_webhook"
        | "slack"
      presence_status: "online" | "away" | "dnd" | "offline"
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
      channel_type: [
        "public",
        "private",
        "dm",
        "group_dm",
        "department",
        "announcement",
        "automation",
      ],
      message_source: ["user", "ai", "n8n", "system"],
      message_type: ["text", "file", "image", "system", "ai", "automation"],
      messaging_provider: [
        "whatsapp",
        "telegram",
        "facebook",
        "instagram",
        "linkedin",
        "sms",
        "custom_webhook",
        "slack",
      ],
      presence_status: ["online", "away", "dnd", "offline"],
    },
  },
} as const
