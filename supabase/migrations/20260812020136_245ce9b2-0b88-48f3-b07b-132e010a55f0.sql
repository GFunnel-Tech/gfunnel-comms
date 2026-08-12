CREATE TABLE public.chat_ai_employees (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  name text not null,
  role text not null,
  department text not null,
  avatar_color text not null default '#F97316',
  personality text not null default 'professional',
  expertise_summary text not null default '',
  system_prompt text not null default '',
  assigned_channel_ids uuid[] not null default '{}',
  respond_to_mentions boolean not null default true,
  respond_to_dms boolean not null default true,
  scheduled_tasks jsonb not null default '[]'::jsonb,
  message_count integer not null default 0,
  is_active boolean not null default true,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_ai_employees TO authenticated;
GRANT ALL ON public.chat_ai_employees TO service_role;

ALTER TABLE public.chat_ai_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view their AI employees" ON public.chat_ai_employees FOR SELECT TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creators can create AI employees" ON public.chat_ai_employees FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update their AI employees" ON public.chat_ai_employees FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creators can delete their AI employees" ON public.chat_ai_employees FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE INDEX idx_chat_ai_employees_workspace ON public.chat_ai_employees(workspace_id);

CREATE TRIGGER update_chat_ai_employees_updated_at BEFORE UPDATE ON public.chat_ai_employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();