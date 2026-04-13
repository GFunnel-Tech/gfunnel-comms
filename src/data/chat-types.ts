export interface ChatUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email: string;
  status: 'online' | 'away' | 'dnd' | 'offline';
  status_emoji?: string;
  status_text?: string;
  role?: string;
}

export type ChannelType = 'public' | 'private' | 'dm' | 'group_dm' | 'department' | 'announcement' | 'automation';
export type MessageSource = 'user' | 'ai' | 'n8n' | 'system';
export type Department = 'Revenue Generation' | 'Creative & Content' | 'Technology' | 'Operations' | 'Finance' | 'Strategy & Analytics' | 'Team & Support' | 'AI & Automation' | 'Legal & Compliance';

export const DEPARTMENT_COLORS: Record<Department, string> = {
  'Revenue Generation': 'dept-revenue',
  'Creative & Content': 'dept-creative',
  'Technology': 'dept-technology',
  'Operations': 'dept-operations',
  'Finance': 'dept-finance',
  'Strategy & Analytics': 'dept-strategy',
  'Team & Support': 'dept-support',
  'AI & Automation': 'dept-ai',
  'Legal & Compliance': 'dept-legal',
};

export interface ChatChannel {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  topic?: string;
  type: ChannelType;
  department?: Department;
  created_by: string;
  is_archived: boolean;
  is_read_only: boolean;
  member_ids: string[];
  pinned_message_ids: string[];
  last_message_at?: string;
  last_message_preview?: string;
  message_count: number;
  sort_order: number;
  emoji: string;
  linked_module_slug?: string;
  linked_module_label?: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  is_starred?: boolean;
  is_muted?: boolean;
}

export interface ContextLink {
  type: string;
  slug: string;
  label: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  workspace_id: string;
  channel_id: string;
  user_id: string;
  user_display_name: string;
  user_avatar_url: string | null;
  content: string;
  content_html?: string;
  type: 'text' | 'file' | 'image' | 'system' | 'ai' | 'automation';
  source: MessageSource;
  thread_parent_id?: string;
  thread_reply_count: number;
  thread_participant_ids: string[];
  thread_last_reply_at?: string;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  pinned: boolean;
  pinned_by?: string;
  pinned_at?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_thumbnail_url?: string;
  reactions: Record<string, string[]>;
  mentions: string[];
  channel_mentions: string[];
  context_links: ContextLink[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ChatBookmark {
  id: string;
  workspace_id: string;
  user_id: string;
  message_id: string;
  note?: string;
  created_at: string;
}

export type AIEmployeePersonality =
  | 'professional'
  | 'friendly'
  | 'analytical'
  | 'creative'
  | 'direct';

export interface AIEmployee {
  id: string;
  workspace_id: string;
  name: string;
  role: string;
  department: Department;
  avatar_color: string;
  personality: AIEmployeePersonality;
  expertise_summary: string;
  system_prompt: string;
  assigned_channel_ids: string[];
  respond_to_mentions: boolean;
  respond_to_dms: boolean;
  scheduled_tasks: ScheduledTask[];
  message_count: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduledTask {
  id: string;
  cron: string;
  channel_id: string;
  prompt: string;
  last_run: string | null;
  is_active: boolean;
}

export interface AIEmployeeFormData {
  name: string;
  role: string;
  department: Department;
  avatar_color: string;
  personality: AIEmployeePersonality;
  expertise_summary: string;
  response_length: 'concise' | 'balanced' | 'detailed';
  assigned_channel_ids: string[];
  respond_to_mentions: boolean;
  respond_to_dms: boolean;
  scheduled_tasks: Omit<ScheduledTask, 'id' | 'last_run'>[];
}
