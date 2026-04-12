export interface WorkspaceConnection {
  id: string;
  user_id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_type: 'personal' | 'org';
  workspace_logo_url: string | null;
  workspace_color: string;
  sort_order: number;
  total_unread: number;
  has_mention: boolean;
  last_active_at: string;
  is_active: boolean;
  joined_at: string;
}

export interface WorkspaceFolder {
  id: string;
  name: string;
  workspaceIds: string[];
}

export const demoWorkspaceConnections: WorkspaceConnection[] = [
  {
    id: 'wc-1',
    user_id: 'user-1',
    workspace_id: 'demo-workspace',
    workspace_name: 'Acme Corp',
    workspace_type: 'org',
    workspace_logo_url: null,
    workspace_color: '#F97316',
    sort_order: 0,
    total_unread: 0,
    has_mention: false,
    last_active_at: new Date().toISOString(),
    is_active: true,
    joined_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'wc-2',
    user_id: 'user-1',
    workspace_id: 'ws-emm',
    workspace_name: 'EMM Marketing',
    workspace_type: 'org',
    workspace_logo_url: null,
    workspace_color: '#8B5CF6',
    sort_order: 1,
    total_unread: 3,
    has_mention: false,
    last_active_at: '2026-04-11T10:00:00Z',
    is_active: true,
    joined_at: '2026-02-15T00:00:00Z',
  },
  {
    id: 'wc-3',
    user_id: 'user-1',
    workspace_id: 'ws-personal',
    workspace_name: 'Personal',
    workspace_type: 'personal',
    workspace_logo_url: null,
    workspace_color: '#06B6D4',
    sort_order: 2,
    total_unread: 0,
    has_mention: false,
    last_active_at: '2026-04-10T15:00:00Z',
    is_active: true,
    joined_at: '2026-01-01T00:00:00Z',
  },
];
