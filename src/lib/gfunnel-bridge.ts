export interface GFunnelContext {
  workspace_id: string;
  workspace_name: string;
  workspace_type: string;
  user_id: string;
  user_display_name: string;
  user_email: string;
  user_avatar_url: string | null;
  user_role: string;
  theme: 'dark' | 'light';
  config: Record<string, unknown>;
  gfunnel_supabase_url: string;
  gfunnel_supabase_anon_key: string;
  auth_token: string | null;
}

type ContextListener = (ctx: GFunnelContext) => void;
let _context: GFunnelContext | null = null;
const _listeners: Set<ContextListener> = new Set();

let _initialized = false;
export function initGFunnelBridge(moduleSlug: string) {
  if (_initialized) { console.info('[GFunnel Bridge] Already initialized, skipping'); return; }
  _initialized = true;
  console.info('[GFunnel Bridge] Initializing bridge for module:', moduleSlug);
  console.info('[GFunnel Bridge] isInsideGFunnel:', isInsideGFunnel());

  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data;
    if (!data?.type) return;
    if (!data.type.startsWith('gfunnel:')) return;

    console.info('[GFunnel Bridge] ← Received:', data.type, JSON.stringify(data.payload ?? {}).slice(0, 200));

    switch (data.type) {
      case 'gfunnel:init':
        _context = data.payload as GFunnelContext;
        console.info('[GFunnel Bridge] Context set — workspace:', _context.workspace_id, 'user:', _context.user_id, 'hasToken:', !!_context.auth_token);
        _listeners.forEach((fn) => fn(_context!));
        window.parent.postMessage({ type: 'module:ready', payload: { module_slug: moduleSlug } }, '*');
        console.info('[GFunnel Bridge] → Sent: module:ready (post-init)');
        break;
      case 'gfunnel:theme':
        console.info('[GFunnel Bridge] Theme changed to:', data.payload?.theme);
        if (_context) { _context.theme = data.payload.theme; _listeners.forEach((fn) => fn(_context!)); }
        break;
      case 'gfunnel:config':
        console.info('[GFunnel Bridge] Config update:', JSON.stringify(data.payload?.config ?? {}).slice(0, 200));
        if (_context) { _context.config = { ..._context.config, ...data.payload.config }; _listeners.forEach((fn) => fn(_context!)); }
        break;
      case 'gfunnel:workspaces':
        if (_workspacesCallback) {
          _workspacesCallback(data.payload.workspaces as WorkspaceInfo[]);
          _workspacesCallback = null;
        }
        break;
      default:
        console.warn('[GFunnel Bridge] Unhandled gfunnel event:', data.type);
    }
  });

  window.parent.postMessage({ type: 'module:ready', payload: { module_slug: moduleSlug } }, '*');
  console.info('[GFunnel Bridge] → Sent: module:ready (initial)');
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
export function notifyUnreadCount(count: number) {
  window.parent.postMessage({ type: 'module:unread', payload: { count } }, '*');
}
export function notifyNavigation(path: string) {
  window.parent.postMessage({ type: 'module:navigate', payload: { path } }, '*');
}

// Workspace list request/response
let _workspacesCallback: ((workspaces: WorkspaceInfo[]) => void) | null = null;

export interface WorkspaceInfo {
  id: string;
  name: string;
  type: 'personal' | 'org';
  logo_url: string | null;
  color: string;
}

export function requestWorkspaceList(
  callback: (workspaces: WorkspaceInfo[]) => void
): void {
  _workspacesCallback = callback;
  window.parent.postMessage({ type: 'module:request_workspaces' }, '*');
}

export function notifyWorkspaceSwitch(workspaceId: string, workspaceName: string): void {
  window.parent.postMessage({
    type: 'module:workspace_switch',
    payload: { workspace_id: workspaceId, workspace_name: workspaceName }
  }, '*');
}
