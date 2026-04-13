
-- Security definer function to check channel membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_channel_member(_channel_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE channel_id = _channel_id AND user_id = _user_id
  )
$$;

-- Fix chat_members SELECT policy (self-referencing)
DROP POLICY IF EXISTS "Users can view memberships in their channels" ON public.chat_members;
CREATE POLICY "Users can view memberships in their channels"
ON public.chat_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_channel_member(channel_id, auth.uid())
);

-- Fix chat_channels SELECT policy
DROP POLICY IF EXISTS "Members can view their channels" ON public.chat_channels;
CREATE POLICY "Members can view their channels"
ON public.chat_channels FOR SELECT TO authenticated
USING (
  public.is_channel_member(id, auth.uid())
  OR type = 'public'::channel_type
  OR type = 'announcement'::channel_type
);

-- Fix chat_messages SELECT policy
DROP POLICY IF EXISTS "Members can view messages in their channels" ON public.chat_messages;
CREATE POLICY "Members can view messages in their channels"
ON public.chat_messages FOR SELECT TO authenticated
USING (public.is_channel_member(channel_id, auth.uid()));

-- Fix chat_messages INSERT policy
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Members can send messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_channel_member(channel_id, auth.uid())
);
