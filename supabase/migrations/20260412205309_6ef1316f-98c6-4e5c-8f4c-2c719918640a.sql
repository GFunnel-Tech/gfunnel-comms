ALTER TABLE public.chat_channels DROP CONSTRAINT IF EXISTS chat_channels_created_by_fkey;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_pinned_by_fkey;