-- AI Employees table
CREATE TABLE IF NOT EXISTS public.chat_ai_employees (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            TEXT NOT NULL,
  name                    TEXT NOT NULL,
  role                    TEXT NOT NULL,
  department              TEXT NOT NULL,
  avatar_color            TEXT DEFAULT '#F97316',
  personality             TEXT DEFAULT 'professional'
                          CHECK (personality IN ('professional','friendly','analytical','creative','direct')),
  expertise_summary       TEXT NOT NULL,
  system_prompt           TEXT NOT NULL,
  assigned_channel_ids    UUID[] DEFAULT '{}',
  respond_to_mentions     BOOLEAN DEFAULT true,
  respond_to_dms          BOOLEAN DEFAULT true,
  scheduled_tasks         JSONB DEFAULT '[]',
  message_count           INTEGER DEFAULT 0,
  is_active               BOOLEAN DEFAULT true,
  created_by              TEXT NOT NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_ai_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_ai_employee_access"
  ON public.chat_ai_employees FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE channel_id IN (
        SELECT id FROM public.chat_channels
        WHERE workspace_id = chat_ai_employees.workspace_id
      )
      AND user_id = auth.uid()
    )
  );

-- Allow authenticated users to manage AI employees in their workspace
CREATE POLICY "workspace_ai_employee_write"
  ON public.chat_ai_employees FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid()::text);

CREATE INDEX idx_ai_employees_workspace
  ON public.chat_ai_employees(workspace_id, is_active);
