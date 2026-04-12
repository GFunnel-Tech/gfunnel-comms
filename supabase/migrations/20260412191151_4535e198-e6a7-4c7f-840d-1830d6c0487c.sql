CREATE TABLE public.chat_workspace_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  workspace_name TEXT NOT NULL,
  workspace_type TEXT NOT NULL DEFAULT 'org',
  workspace_logo_url TEXT,
  workspace_color TEXT DEFAULT '#F97316',
  sort_order INTEGER DEFAULT 0,
  total_unread INTEGER DEFAULT 0,
  has_mention BOOLEAN DEFAULT false,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workspace_id)
);

ALTER TABLE public.chat_workspace_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspace connections"
  ON public.chat_workspace_connections
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create own workspace connections"
  ON public.chat_workspace_connections
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own workspace connections"
  ON public.chat_workspace_connections
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own workspace connections"
  ON public.chat_workspace_connections
  FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

CREATE INDEX idx_workspace_connections_user ON public.chat_workspace_connections(user_id, sort_order);