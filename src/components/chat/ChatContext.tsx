import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ChatChannel, ChatMessage, ChatUser, ChannelType } from '@/data/chat-types';
import type { AIEmployee } from '@/data/chat-types';
import { demoChannels, demoMessages, demoUsers, currentDemoUser, demoAIEmployees } from '@/data/chat-demo-data';
import { useGFunnel } from '@/hooks/useGFunnel';
import { useSupabaseChat } from '@/hooks/useSupabaseChat';
import { getSupabaseClient } from '@/lib/supabase-context';
import { setSupabaseClient } from '@/lib/supabase-context';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { demoWorkspaceConnections, type WorkspaceConnection, type WorkspaceFolder } from '@/data/workspace-data';
import type { WorkspaceInfo } from '@/lib/gfunnel-bridge';

type RightPanel = 'none' | 'thread' | 'ai';

interface ChatContextType {
  currentUser: ChatUser;
  users: ChatUser[];
  channels: ChatChannel[];
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  messages: ChatMessage[];
  allMessages: ChatMessage[];
  threadParentId: string | null;
  setThreadParentId: (id: string | null) => void;
  threadReplies: ChatMessage[];
  sendMessage: (content: string, channelId: string, threadParentId?: string, files?: File[]) => void;
  createChannel: (data: { name: string; description: string; type: ChannelType; emoji: string }) => void;
  createDM: (userIds: string[]) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  toggleStar: (channelId: string) => void;
  toggleMute: (channelId: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (v: boolean) => void;
  rightPanel: RightPanel;
  setRightPanel: (p: RightPanel) => void;
  isLive: boolean;
  loading: boolean;
  // Workspace
  workspaces: WorkspaceConnection[];
  activeWorkspaceId: string;
  activeWorkspaceName: string;
  switchWorkspace: (ws: WorkspaceConnection) => void;
  reorderWorkspaces: (fromIndex: number, toIndex: number) => void;
  workspaceFolders: WorkspaceFolder[];
  createWorkspaceFolder: (name: string, workspaceIds: string[]) => void;
  removeWorkspaceFromFolder: (folderId: string, workspaceId: string) => void;
  deleteWorkspaceFolder: (folderId: string) => void;
  renameWorkspaceFolder: (folderId: string, newName: string) => void;
  hoveredMessageId: string | null;
  setHoveredMessageId: (id: string | null) => void;
  highlightedMessageId: string | null;
  setHighlightedMessageId: (id: string | null) => void;
  jumpToMessageId: string | null;
  setJumpToMessageId: (id: string | null) => void;
  // AI Employees
  aiEmployees: AIEmployee[];
  loadAIEmployees: () => Promise<void>;
  addAIEmployee: (employee: AIEmployee) => void;
  activeAIEmployeeProfile: AIEmployee | null;
  setActiveAIEmployeeProfile: (emp: AIEmployee | null) => void;
  openAIDM: (employee: AIEmployee) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const gfunnel = useGFunnel('chat');

  const [supabaseUser, setSupabaseUser] = useState<{ id: string; email?: string } | null>(null);

  // CHANGE 1: When embedded, initialize the dynamic Supabase client with bridge-provided credentials
  useEffect(() => {
    if (!gfunnel.isReady) return;
    if (gfunnel.isEmbedded && gfunnel.context?.gfunnel_supabase_url && gfunnel.context?.gfunnel_supabase_anon_key) {
      setSupabaseClient(gfunnel.context.gfunnel_supabase_url, gfunnel.context.gfunnel_supabase_anon_key);
    }
    if (gfunnel.authToken) {
      const client = getSupabaseClient();
      client.auth.setSession({ access_token: gfunnel.authToken, refresh_token: '' });
    }
  }, [gfunnel.isReady, gfunnel.isEmbedded, gfunnel.context, gfunnel.authToken]);

  useEffect(() => {
    const client = getSupabaseClient();
    client.auth.getUser().then(({ data }) => {
      if (data.user) setSupabaseUser({ id: data.user.id, email: data.user.email ?? undefined });
    });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSupabaseUser({ id: session.user.id, email: session.user.email ?? undefined });
      } else {
        setSupabaseUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // CHANGE 2: When bridge sends gfunnel:workspaces, populate workspace list
  useEffect(() => {
    if (!gfunnel.isEmbedded) return;
    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (data?.type !== 'gfunnel:workspaces') return;
      const platformWorkspaces: WorkspaceConnection[] = (data.payload.workspaces as WorkspaceInfo[]).map(
        (ws: WorkspaceInfo, idx: number) => ({
          id: `wc-${ws.id}`,
          user_id: userId ?? '',
          workspace_id: ws.id,
          workspace_name: ws.name,
          workspace_type: ws.type,
          workspace_logo_url: ws.logo_url,
          workspace_color: ws.color,
          sort_order: idx,
          total_unread: 0,
          has_mention: false,
          last_active_at: new Date().toISOString(),
          is_active: true,
          joined_at: new Date().toISOString(),
        })
      );
      setWorkspaces(platformWorkspaces);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [gfunnel.isEmbedded]);

  const isEmbeddedLive = gfunnel.isEmbedded && !!gfunnel.authToken;
  const isLive = isEmbeddedLive || !!supabaseUser;

  // Workspace state
  const [workspaces, setWorkspaces] = useState<WorkspaceConnection[]>(demoWorkspaceConnections);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('demo-workspace');
  const activeWorkspaceName = workspaces.find(w => w.workspace_id === activeWorkspaceId)?.workspace_name ?? 'Workspace';

  // Workspace folders — persisted in localStorage
  const [workspaceFolders, setWorkspaceFolders] = useState<WorkspaceFolder[]>(() => {
    try {
      const saved = localStorage.getItem('workspace_folders');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const persistFolders = useCallback((folders: WorkspaceFolder[]) => {
    setWorkspaceFolders(folders);
    localStorage.setItem('workspace_folders', JSON.stringify(folders));
  }, []);

  const reorderWorkspaces = useCallback((fromIndex: number, toIndex: number) => {
    setWorkspaces(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated.map((ws, i) => ({ ...ws, sort_order: i }));
    });
  }, []);

  const createWorkspaceFolder = useCallback((name: string, workspaceIds: string[]) => {
    const folder: WorkspaceFolder = { id: `folder-${Date.now()}`, name, workspaceIds };
    persistFolders([...workspaceFolders, folder]);
  }, [workspaceFolders, persistFolders]);

  const removeWorkspaceFromFolder = useCallback((folderId: string, workspaceId: string) => {
    const updated = workspaceFolders.map(f => {
      if (f.id !== folderId) return f;
      return { ...f, workspaceIds: f.workspaceIds.filter(id => id !== workspaceId) };
    }).filter(f => f.workspaceIds.length > 1);
    persistFolders(updated);
  }, [workspaceFolders, persistFolders]);

  const deleteWorkspaceFolder = useCallback((folderId: string) => {
    persistFolders(workspaceFolders.filter(f => f.id !== folderId));
  }, [workspaceFolders, persistFolders]);

  const renameWorkspaceFolder = useCallback((folderId: string, newName: string) => {
    persistFolders(workspaceFolders.map(f => f.id === folderId ? { ...f, name: newName } : f));
  }, [workspaceFolders, persistFolders]);

  const workspaceId = isLive ? (gfunnel.workspaceId ?? 'default-workspace') : activeWorkspaceId;
  const userId = isEmbeddedLive
    ? (gfunnel.userId ?? supabaseUser?.id ?? currentDemoUser.id)
    : (supabaseUser?.id ?? currentDemoUser.id);

  const sb = useSupabaseChat(isLive ? workspaceId : '', isLive ? userId : '');

  // AI Employees state
  const [aiEmployees, setAIEmployees] = useState<AIEmployee[]>(demoAIEmployees);
  const [activeAIEmployeeProfile, setActiveAIEmployeeProfile] = useState<AIEmployee | null>(null);

  // Demo mode state
  const [demoAllMessages, setDemoAllMessages] = useState<ChatMessage[]>(demoMessages);
  const [demoChannelList, setDemoChannelList] = useState<ChatChannel[]>(demoChannels);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [jumpToMessageId, setJumpToMessageId] = useState<string | null>(null);

  // UI state
  const [activeChannelId, setActiveChannelIdRaw] = useState('ch-general');
  const [threadParentId, setThreadParentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const isMediumScreen = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
  const [sidebarCollapsed, setSidebarCollapsedRaw] = useState(false);
  const userOverrodeRef = useRef(false);

  useEffect(() => {
    if (!userOverrodeRef.current) setSidebarCollapsedRaw(isMediumScreen);
  }, [isMediumScreen]);

  const setSidebarCollapsed = useCallback((v: boolean) => {
    userOverrodeRef.current = true;
    setSidebarCollapsedRaw(v);
    setTimeout(() => { userOverrodeRef.current = false; }, 0);
  }, []);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanel>('none');

  const channels = isLive ? sb.channels : demoChannelList;
  const allMessages = isLive ? sb.allMessages : demoAllMessages;

  const setActiveChannelId = useCallback((id: string) => {
    setActiveChannelIdRaw(id);
    if (isLive) sb.loadMessages(id);
  }, [isLive, sb.loadMessages]);

  useEffect(() => {
    if (channels.length > 0 && !channels.find(c => c.id === activeChannelId)) {
      setActiveChannelIdRaw(channels[0].id);
    }
  }, [channels, activeChannelId]);

  useEffect(() => {
    if (isLive && activeChannelId) sb.loadMessages(activeChannelId);
  }, [isLive, activeChannelId]);

  useEffect(() => {
    if (isLive) {
      sb.updatePresence('online');
      const interval = setInterval(() => sb.updatePresence('online'), 30000);
      return () => { clearInterval(interval); sb.updatePresence('offline'); };
    }
  }, [isLive]);

  // Workspace switching
  const switchWorkspace = useCallback((ws: WorkspaceConnection) => {
    if (ws.workspace_id === activeWorkspaceId) return;
    // Save current state
    localStorage.setItem(`chat_state_${activeWorkspaceId}`, JSON.stringify({
      activeChannelId,
    }));
    setActiveWorkspaceId(ws.workspace_id);
    // Restore state for target workspace
    const saved = localStorage.getItem(`chat_state_${ws.workspace_id}`);
    if (saved) {
      try {
        const { activeChannelId: savedChannel } = JSON.parse(saved);
        if (savedChannel) setActiveChannelIdRaw(savedChannel);
      } catch {}
    } else {
      // Will reset to first channel via the effect above
      setActiveChannelIdRaw('');
    }
    setThreadParentId(null);
    setRightPanel('none');
  }, [activeWorkspaceId, activeChannelId]);

  const currentUser: ChatUser = isEmbeddedLive
    ? { id: userId, display_name: gfunnel.userDisplayName || 'You', avatar_url: gfunnel.userAvatarUrl, email: gfunnel.userEmail || '', status: 'online', role: gfunnel.userRole }
    : supabaseUser
    ? { id: supabaseUser.id, display_name: supabaseUser.email?.split('@')[0] || 'You', avatar_url: null, email: supabaseUser.email || '', status: 'online', role: 'member' }
    : currentDemoUser;

  const users = isLive ? [currentUser] : demoUsers;

  const messages = useMemo(
    () => allMessages.filter(m => m.channel_id === activeChannelId && !m.thread_parent_id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [allMessages, activeChannelId]
  );

  const threadReplies = useMemo(
    () => threadParentId
      ? allMessages.filter(m => m.thread_parent_id === threadParentId)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      : [],
    [allMessages, threadParentId]
  );

  const handleSetThreadParentId = useCallback((id: string | null) => {
    setThreadParentId(id);
    setRightPanel(id ? 'thread' : 'none');
  }, []);

  const sendMessage = useCallback((content: string, channelId: string, parentId?: string, files?: File[]) => {
    if (isLive) { sb.sendMessage(content, channelId, parentId, files); return; }
    const now = new Date().toISOString();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`, workspace_id: activeWorkspaceId, channel_id: channelId,
      user_id: currentDemoUser.id, user_display_name: currentDemoUser.display_name,
      user_avatar_url: currentDemoUser.avatar_url, content, type: 'text', source: 'user',
      thread_parent_id: parentId, thread_reply_count: 0, thread_participant_ids: [],
      is_edited: false, is_deleted: false, pinned: false, reactions: {},
      mentions: [], channel_mentions: [], context_links: [], metadata: {},
      created_at: now, updated_at: now,
    };
    setDemoAllMessages(prev => {
      const updated = [...prev, newMsg];
      if (parentId) {
        return updated.map(m => m.id === parentId ? {
          ...m, thread_reply_count: m.thread_reply_count + 1, thread_last_reply_at: now,
          thread_participant_ids: [...new Set([...m.thread_participant_ids, currentDemoUser.id])],
        } : m);
      }
      return updated;
    });
  }, [isLive, sb.sendMessage, activeWorkspaceId]);

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    if (isLive) { sb.toggleReaction(messageId, emoji); return; }
    setDemoAllMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const current = m.reactions[emoji] || [];
      const hasReacted = current.includes(currentDemoUser.id);
      const updated = hasReacted ? current.filter(id => id !== currentDemoUser.id) : [...current, currentDemoUser.id];
      const reactions = { ...m.reactions };
      if (updated.length === 0) delete reactions[emoji]; else reactions[emoji] = updated;
      return { ...m, reactions };
    }));
  }, [isLive, sb.toggleReaction]);

  const createChannel = useCallback((data: { name: string; description: string; type: ChannelType; emoji: string }) => {
    const now = new Date().toISOString();
    const newChannel: ChatChannel = {
      id: `ch-${Date.now()}`,
      workspace_id: activeWorkspaceId,
      name: data.name,
      description: data.description || undefined,
      type: data.type,
      emoji: data.emoji || '#',
      created_by: userId,
      is_archived: false,
      is_read_only: data.type === 'announcement',
      member_ids: [userId],
      pinned_message_ids: [],
      message_count: 0,
      sort_order: channels.length,
      created_at: now,
      updated_at: now,
    };
    if (isLive) {
      // TODO: Supabase insert
    } else {
      setDemoChannelList(prev => [...prev, newChannel]);
    }
    setActiveChannelId(newChannel.id);
  }, [activeWorkspaceId, userId, channels.length, isLive, setActiveChannelId]);

  const createDM = useCallback((userIds: string[]) => {
    // Check if a DM already exists with exactly these users
    const dmType = userIds.length > 1 ? 'group_dm' : 'dm';
    const allMembers = [userId, ...userIds].sort();
    const existing = channels.find(c =>
      (c.type === 'dm' || c.type === 'group_dm') &&
      c.member_ids.length === allMembers.length &&
      [...c.member_ids].sort().every((id, i) => id === allMembers[i])
    );
    if (existing) {
      setActiveChannelId(existing.id);
      return;
    }

    const otherUsers = userIds.map(id => users.find(u => u.id === id)).filter(Boolean);
    const dmName = otherUsers.map(u => u!.display_name).join(', ');
    const now = new Date().toISOString();
    const newChannel: ChatChannel = {
      id: `dm-${Date.now()}`,
      workspace_id: activeWorkspaceId,
      name: dmName,
      type: dmType,
      emoji: '',
      created_by: userId,
      is_archived: false,
      is_read_only: false,
      member_ids: allMembers,
      pinned_message_ids: [],
      message_count: 0,
      sort_order: channels.length,
      created_at: now,
      updated_at: now,
    };
    if (!isLive) {
      setDemoChannelList(prev => [...prev, newChannel]);
    }
    setActiveChannelId(newChannel.id);
  }, [activeWorkspaceId, userId, channels, users, isLive, setActiveChannelId]);

  const toggleStar = useCallback((channelId: string) => {
    if (!isLive) {
      setDemoChannelList(prev => prev.map(c => c.id === channelId ? { ...c, is_starred: !c.is_starred } : c));
    }
  }, [isLive]);

  const toggleMute = useCallback((channelId: string) => {
    if (!isLive) {
      setDemoChannelList(prev => prev.map(c => c.id === channelId ? { ...c, is_muted: !c.is_muted } : c));
    }
  }, [isLive]);

  // AI Employees
  const loadAIEmployees = useCallback(async () => {
    if (!workspaceId || workspaceId === 'demo-workspace') return;
    const client = getSupabaseClient();
    const { data } = await client
      .from('chat_ai_employees')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .order('created_at');
    if (data) setAIEmployees(data as unknown as AIEmployee[]);
  }, [workspaceId]);

  const addAIEmployee = useCallback((employee: AIEmployee) => {
    setAIEmployees(prev => [...prev, employee]);
  }, []);

  const openAIDM = useCallback(async (employee: AIEmployee) => {
    const existingDM = channels.find(ch =>
      ch.type === 'dm' &&
      ch.member_ids.includes(employee.id)
    );
    if (existingDM) {
      setActiveChannelId(existingDM.id);
      return;
    }
    createDM([employee.id]);
  }, [channels, createDM, setActiveChannelId]);

  // Load AI employees when workspace changes
  useEffect(() => {
    if (isLive) {
      loadAIEmployees();
    }
  }, [isLive, loadAIEmployees]);

  // Keyboard shortcut: R to reply to hovered message
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        if (hoveredMessageId) {
          e.preventDefault();
          handleSetThreadParentId(hoveredMessageId);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hoveredMessageId, handleSetThreadParentId]);

  return (
    <ChatContext.Provider value={{
      currentUser, users, channels,
      activeChannelId, setActiveChannelId, messages, allMessages,
      threadParentId, setThreadParentId: handleSetThreadParentId, threadReplies,
      sendMessage, createChannel, createDM, toggleReaction, toggleStar, toggleMute,
      searchQuery, setSearchQuery, searchOpen, setSearchOpen,
      sidebarCollapsed, setSidebarCollapsed,
      mobileSidebarOpen, setMobileSidebarOpen,
      rightPanel, setRightPanel,
      isLive, loading: isLive ? sb.loading : false,
      workspaces, activeWorkspaceId, activeWorkspaceName, switchWorkspace,
      reorderWorkspaces, workspaceFolders, createWorkspaceFolder, removeWorkspaceFromFolder, deleteWorkspaceFolder, renameWorkspaceFolder,
      hoveredMessageId, setHoveredMessageId,
      highlightedMessageId, setHighlightedMessageId,
      jumpToMessageId, setJumpToMessageId,
      aiEmployees, loadAIEmployees, addAIEmployee,
      activeAIEmployeeProfile, setActiveAIEmployeeProfile,
      openAIDM,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
