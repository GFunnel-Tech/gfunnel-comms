
-- API Keys table for bot tokens
CREATE TABLE public.chat_api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id text NOT NULL,
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{messaging,channels}',
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
  ON public.chat_api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create API keys"
  ON public.chat_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own API keys"
  ON public.chat_api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own API keys"
  ON public.chat_api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE TRIGGER update_chat_api_keys_updated_at
  BEFORE UPDATE ON public.chat_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_chat_api_keys_key_hash ON public.chat_api_keys (key_hash);
CREATE INDEX idx_chat_api_keys_workspace ON public.chat_api_keys (workspace_id);

-- Incoming Webhooks table
CREATE TABLE public.chat_webhooks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id text NOT NULL,
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  name text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamp with time zone,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhooks"
  ON public.chat_webhooks FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create webhooks"
  ON public.chat_webhooks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own webhooks"
  ON public.chat_webhooks FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own webhooks"
  ON public.chat_webhooks FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE TRIGGER update_chat_webhooks_updated_at
  BEFORE UPDATE ON public.chat_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_chat_webhooks_token ON public.chat_webhooks (token);
CREATE INDEX idx_chat_webhooks_workspace ON public.chat_webhooks (workspace_id);

-- Outgoing Event Subscriptions table
CREATE TABLE public.chat_event_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id text NOT NULL,
  api_key_id uuid NOT NULL REFERENCES public.chat_api_keys(id) ON DELETE CASCADE,
  callback_url text NOT NULL,
  events text[] NOT NULL DEFAULT '{message.created}',
  signing_secret text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active boolean NOT NULL DEFAULT true,
  failure_count integer NOT NULL DEFAULT 0,
  last_delivered_at timestamp with time zone,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_event_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own event subscriptions"
  ON public.chat_event_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create event subscriptions"
  ON public.chat_event_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own event subscriptions"
  ON public.chat_event_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own event subscriptions"
  ON public.chat_event_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE TRIGGER update_chat_event_subscriptions_updated_at
  BEFORE UPDATE ON public.chat_event_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_chat_event_subs_workspace ON public.chat_event_subscriptions (workspace_id);
CREATE INDEX idx_chat_event_subs_api_key ON public.chat_event_subscriptions (api_key_id);
