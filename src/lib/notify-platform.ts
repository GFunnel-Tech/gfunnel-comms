import { getSupabaseClient } from './supabase-context';
import { isInsideGFunnel, getGFunnelContext } from './gfunnel-bridge';

export async function createPlatformNotification({
  recipientUserId,
  type,
  title,
  body,
}: {
  recipientUserId: string;
  type: 'mention' | 'message';
  title: string;
  body: string;
}): Promise<void> {
  if (!isInsideGFunnel()) return; // Only run when inside GFunnel

  const context = getGFunnelContext();
  if (!context) return;

  // Cast to generic client — the `notifications` table exists in GFunnel's
  // main Supabase project but is not in this module's generated types.
  const supabase = getSupabaseClient() as unknown as {
    from: (table: string) => { insert: (row: Record<string, unknown>) => Promise<{ error: unknown }> };
  };

  // Build the href — navigates back to the chat in the correct workspace
  const href = context.workspace_type === 'org' && context.org_slug
    ? `/org/${context.org_slug}/chat`
    : '/chat';

  try {
    await supabase.from('notifications').insert({
      user_id: recipientUserId,
      type,
      title,
      body,
      href,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Notification creation is non-critical — never throw
  }
}
