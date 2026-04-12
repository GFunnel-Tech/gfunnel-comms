import { useState, useEffect } from 'react';
import { initGFunnelBridge, onContextChange, isInsideGFunnel, type GFunnelContext } from '@/lib/gfunnel-bridge';

let bridgeInitialized = false;

export function useGFunnel(moduleSlug: string) {
  const [context, setContext] = useState<GFunnelContext | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    setIsEmbedded(isInsideGFunnel());
    if (!bridgeInitialized) { initGFunnelBridge(moduleSlug); bridgeInitialized = true; }
    return onContextChange((ctx) => setContext(ctx));
  }, [moduleSlug]);

  return {
    context, isEmbedded, isReady: context !== null,
    workspaceId: context?.workspace_id ?? null,
    workspaceName: context?.workspace_name ?? 'Acme Corp',
    workspaceType: context?.workspace_type ?? 'personal',
    userId: context?.user_id ?? null,
    userDisplayName: context?.user_display_name ?? 'You',
    userEmail: context?.user_email ?? null,
    userAvatarUrl: context?.user_avatar_url ?? null,
    userRole: context?.user_role ?? 'member',
    authToken: context?.auth_token ?? null,
    theme: context?.theme ?? 'dark',
    config: context?.config ?? {},
  };
}
