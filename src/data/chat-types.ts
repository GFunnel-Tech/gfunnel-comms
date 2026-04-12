export interface ChatUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email: string;
  status: 'online' | 'away' | 'dnd' | 'offline';
  status_text?: string;
}

export interface ChatChannel {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'dm' | 'group_dm';
  created_by: string;
  is_archived: boolean;
  member_ids: string[];
  pinned_message_ids: string[];
  last_message_at?: string;
  last_message_preview?: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  workspace_id: string;
  channel_id: string;
  user_id: string;
  user_display_name: string;
  user_avatar_url: string | null;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  thread_parent_id?: string;
  thread_reply_count: number;
  thread_last_reply_at?: string;
  is_edited: boolean;
  is_deleted: boolean;
  pinned: boolean;
  pinned_by?: string;
  pinned_at?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  reactions: Record<string, string[]>;
  mentions: string[];
  created_at: string;
  updated_at: string;
}

export interface ChatMember {
  id: string;
  workspace_id: string;
  channel_id: string;
  user_id: string;
  user_display_name: string;
  user_avatar_url: string | null;
  role: 'admin' | 'member';
  last_read_at: string;
  is_muted: boolean;
  joined_at: string;
}
