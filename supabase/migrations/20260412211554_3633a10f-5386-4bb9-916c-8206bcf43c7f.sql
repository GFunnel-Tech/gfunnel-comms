
-- 1. Provider enum
CREATE TYPE public.messaging_provider AS ENUM (
  'whatsapp', 'telegram', 'facebook', 'instagram', 'linkedin', 'sms', 'custom_webhook'
);

-- 2. Channel integrations table
CREATE TABLE public.channel_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  provider public.messaging_provider NOT NULL,
  display_name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  credentials_secret_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.channel_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integrations"
  ON public.channel_integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create integrations"
  ON public.channel_integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own integrations"
  ON public.channel_integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own integrations"
  ON public.channel_integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE TRIGGER update_channel_integrations_updated_at
  BEFORE UPDATE ON public.channel_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Channel contacts table (generic replacement for whatsapp_contacts)
CREATE TABLE public.channel_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.channel_integrations(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  external_name text,
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  workspace_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz,
  UNIQUE (integration_id, external_id)
);

ALTER TABLE public.channel_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contacts"
  ON public.channel_contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create contacts"
  ON public.channel_contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own contacts"
  ON public.channel_contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own contacts"
  ON public.channel_contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE TRIGGER update_channel_contacts_updated_at
  BEFORE UPDATE ON public.channel_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_channel_integrations_workspace ON public.channel_integrations(workspace_id);
CREATE INDEX idx_channel_contacts_integration ON public.channel_contacts(integration_id);
CREATE INDEX idx_channel_contacts_channel ON public.channel_contacts(channel_id);
CREATE INDEX idx_channel_contacts_external ON public.channel_contacts(integration_id, external_id);
