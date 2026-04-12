-- Create whatsapp_contacts table for mapping phone numbers to channels
CREATE TABLE public.whatsapp_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number text NOT NULL,
  whatsapp_name text,
  whatsapp_id text,
  channel_id uuid NOT NULL,
  workspace_id text NOT NULL,
  created_by uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(phone_number, workspace_id)
);

-- Enable RLS
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own contacts"
ON public.whatsapp_contacts FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can create contacts"
ON public.whatsapp_contacts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own contacts"
ON public.whatsapp_contacts FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own contacts"
ON public.whatsapp_contacts FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Timestamp trigger
CREATE TRIGGER update_whatsapp_contacts_updated_at
BEFORE UPDATE ON public.whatsapp_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for quick lookup by phone number
CREATE INDEX idx_whatsapp_contacts_phone ON public.whatsapp_contacts (phone_number, workspace_id);
