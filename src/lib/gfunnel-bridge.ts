export interface GFunnelContext {
  workspace_id: string;
  user_id: string;
  user_display_name: string;
  user_email: string;
  user_avatar_url: string | null;
  theme: 'dark' | 'light';
  config: Record<string, unknown>;
  gfunnel_supabase_url: string;
  gfunnel_supabase_anon_key: string;
}

type ContextListener = (ctx: GFunnelContext) => void;

let _context: GFunnelContext | null = null;
const _listeners: Set<ContextListener> = new Set();

export function initGFunnelBridge(moduleSlug: string) {
  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data;
    if (!data?.type) return;
    switch (data.type) {
      case 'gfunnel:init':
        _context = data.payload as GFunnelContext;
        _listeners.forEach((fn) => fn(_context!));
        window.parent.postMessage({ type: 'module:ready', payload: { module_slug: moduleSlug } }, '*');
        break;
      case 'gfunnel:theme':
        if (_context) { _context.theme = data.payload.theme; _listeners.forEach((fn) => fn(_context!)); }
        break;
      case 'gfunnel:config':
        if (_context) { _context.config = { ..._context.config, ...data.payload.config }; _listeners.forEach((fn) => fn(_context!)); }
        break;
    }
  });
  window.parent.postMessage({ type: 'module:ready', payload: { module_slug: moduleSlug } }, '*');
}

export function getGFunnelContext(): GFunnelContext | null { return _context; }

export function onContextChange(listener: ContextListener): () => void {
  _listeners.add(listener);
  if (_context) listener(_context);
  return () => _listeners.delete(listener);
}

export function isInsideGFunnel(): boolean {
  try { return window.self !== window.top; } catch { return true; }
}

export function notifyParent(title: string, body: string, variant: 'info' | 'success' | 'warning' | 'error' = 'info') {
  window.parent.postMessage({ type: 'module:notify', payload: { title, body, variant } }, '*');
}

export function requestResize(height: number) {
  window.parent.postMessage({ type: 'module:resize', payload: { height } }, '*');
}
