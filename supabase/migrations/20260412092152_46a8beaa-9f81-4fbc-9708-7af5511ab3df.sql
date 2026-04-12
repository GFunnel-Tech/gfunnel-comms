
-- Create enums
CREATE TYPE public.channel_type AS ENUM ('public', 'private', 'dm', 'group_dm', 'department', 'announcement', 'automation');
CREATE TYPE public.message_source AS ENUM ('user', 'ai', 'n8n', 'system');
CREATE TYPE public.message_type AS ENUM ('text', 'file', 'image', 'system', 'ai', 'automation');
CREATE TYPE public.presence_status AS ENUM ('online', 'away', 'dnd', 'offline');

-- ============================================
-- CHAT CHANNELS
-- ============================================
CREATE TABLE public.chat_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  topic TEXT,
  type public.channel_type NOT NULL DEFAULT 'public',
  department TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  is_read_only BOOLEAN NOT NULL DEFAULT false,
  pinned_message_ids UUID[] DEFAULT '{}',
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  emoji TEXT DEFAULT '#',
  linked_module_slug TEXT,
  linked_module_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CHAT MEMBERS (junction: user <-> channel)
-- ============================================
CREATE TABLE public.chat_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  is_starred BOOLEAN NOT NULL DEFAULT false,
  last_read_at TIMESTAMPTZ,
  unread_count INTEGER NOT NULL DEFAULT 0,
  notifications_muted BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CHAT MESSAGES
-- ============================================
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  content_html TEXT,
  type public.message_type NOT NULL DEFAULT 'text',
  source public.message_source NOT NULL DEFAULT 'user',
  thread_parent_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  thread_reply_count INTEGER NOT NULL DEFAULT 0,
  thread_participant_ids UUID[] DEFAULT '{}',
  thread_last_reply_at TIMESTAMPTZ,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  pinned BOOLEAN NOT NULL DEFAULT false,
  pinned_by UUID REFERENCES auth.users(id),
  pinned_at TIMESTAMPTZ,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  file_thumbnail_url TEXT,
  reactions JSONB NOT NULL DEFAULT '{}',
  mentions UUID[] DEFAULT '{}',
  channel_mentions UUID[] DEFAULT '{}',
  context_links JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_chat_messages_channel ON public.chat_messages(channel_id, created_at DESC);
CREATE INDEX idx_chat_messages_thread ON public.chat_messages(thread_parent_id) WHERE thread_parent_id IS NOT NULL;
CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id);

-- ============================================
-- CHAT PRESENCE
-- ============================================
CREATE TABLE public.chat_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status public.presence_status NOT NULL DEFAULT 'offline',
  status_text TEXT,
  status_emoji TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_presence ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

CREATE POLICY "Members can view their channels"
  ON public.chat_channels FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_members.channel_id = chat_channels.id
        AND chat_members.user_id = auth.uid()
    )
    OR type = 'public'
    OR type = 'announcement'
  );

CREATE POLICY "Authenticated users can create channels"
  ON public.chat_channels FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Channel creator can update"
  ON public.chat_channels FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can view memberships in their channels"
  ON public.chat_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.chat_members cm
      WHERE cm.channel_id = chat_members.channel_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join public channels"
  ON public.chat_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership"
  ON public.chat_members FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave channels"
  ON public.chat_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Members can view messages in their channels"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_members.channel_id = chat_messages.channel_id
        AND chat_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_members.channel_id = chat_messages.channel_id
        AND chat_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.chat_messages FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON public.chat_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Presence is viewable by authenticated users"
  ON public.chat_presence FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own presence"
  ON public.chat_presence FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence"
  ON public.chat_presence FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_chat_channels_updated_at
  BEFORE UPDATE ON public.chat_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_presence_updated_at
  BEFORE UPDATE ON public.chat_presence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_presence;
