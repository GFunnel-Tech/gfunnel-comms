import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { ChatChannel, ChatMessage, ChatUser } from '@/data/chat-types';
import { demoChannels, demoMessages, demoUsers, currentDemoUser } from '@/data/chat-demo-data';
import { useGFunnel } from '@/hooks/useGFunnel';
import { useSupabaseChat } from '@/hooks/useSupabaseChat';
import { supabase } from '@/integrations/supabase/client';

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
  sendMessage: (content: string, channelId: string, threadParentId?: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
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
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const gfunnel = useGFunnel('chat');
  const isLive = gfunnel.isEmbedded && !!gfunnel.authToken;

  // Set Supabase session from GFunnel auth token
  useEffect(() => {
    if (gfunnel.authToken) {
      supabase.auth.setSession({
        access_token: gfunnel.authToken,
        refresh_token: '',
      });
    }
  }, [gfunnel.authToken]);

  const workspaceId = gfunnel.workspaceId ?? 'demo-workspace';
  const userId = gfunnel.userId ?? currentDemoUser.id;

  const sb = useSupabaseChat(isLive ? workspaceId : '', isLive ? userId : '');

  // Demo mode state
  const [demoAllMessages, setDemoAllMessages] = useState<ChatMessage[]>(demoMessages);
  const [demoChannelList] = useState<ChatChannel[]>(demoChannels);

  // Shared UI state
  const [activeChannelId, setActiveChannelIdRaw] = useState('ch-general');
  const [threadParentId, setThreadParentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanel>('none');

  const channels = isLive ? sb.channels : demoChannelList;
  const allMessages = isLive ? sb.allMessages : demoAllMessages;

  // When switching channels in live mode, load messages
  const setActiveChannelId = useCallback((id: string) => {
    setActiveChannelIdRaw(id);
    if (isLive) sb.loadMessages(id);
  }, [isLive, sb.loadMessages]);

  // Set initial active channel
  useEffect(() => {
    if (channels.length > 0 && !channels.find(c => c.id === activeChannelId)) {
      setActiveChannelIdRaw(channels[0].id);
    }
  }, [channels]);

  // Load messages for active channel in live mode
  useEffect(() => {
    if (isLive && activeChannelId) {
      sb.loadMessages(activeChannelId);
    }
  }, [isLive, activeChannelId]);

  // Set presence when going live
  useEffect(() => {
    if (isLive) {
      sb.updatePresence('online');
      const interval = setInterval(() => sb.updatePresence('online'), 30000);
      return () => {
        clearInterval(interval);
        sb.updatePresence('offline');
      };
    }
  }, [isLive]);

  // Current user
  const currentUser: ChatUser = isLive
    ? {
        id: userId,
        display_name: gfunnel.userDisplayName || 'You',
        avatar_url: gfunnel.userAvatarUrl,
        email: gfunnel.userEmail || '',
        status: 'online',
        role: gfunnel.userRole,
      }
    : currentDemoUser;

  const users = isLive ? [currentUser] : demoUsers; // In live mode, users come from presence/profiles

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

  // Send message - live or demo
  const sendMessage = useCallback((content: string, channelId: string, parentId?: string) => {
    if (isLive) {
      sb.sendMessage(content, channelId, parentId);
      return;
    }
    // Demo mode
    const now = new Date().toISOString();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`, workspace_id: 'demo-workspace', channel_id: channelId,
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
          ...m,
          thread_reply_count: m.thread_reply_count + 1,
          thread_last_reply_at: now,
          thread_participant_ids: [...new Set([...m.thread_participant_ids, currentDemoUser.id])],
        } : m);
      }
      return updated;
    });
  }, [isLive, sb.sendMessage]);

  // Toggle reaction - live or demo
  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    if (isLive) {
      sb.toggleReaction(messageId, emoji);
      return;
    }
    // Demo mode
    setDemoAllMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const current = m.reactions[emoji] || [];
      const hasReacted = current.includes(currentDemoUser.id);
      const updated = hasReacted
        ? current.filter(id => id !== currentDemoUser.id)
        : [...current, currentDemoUser.id];
      const reactions = { ...m.reactions };
      if (updated.length === 0) delete reactions[emoji];
      else reactions[emoji] = updated;
      return { ...m, reactions };
    }));
  }, [isLive, sb.toggleReaction]);

  return (
    <ChatContext.Provider value={{
      currentUser, users, channels,
      activeChannelId, setActiveChannelId, messages, allMessages,
      threadParentId, setThreadParentId: handleSetThreadParentId, threadReplies,
      sendMessage, toggleReaction,
      searchQuery, setSearchQuery, searchOpen, setSearchOpen,
      sidebarCollapsed, setSidebarCollapsed,
      mobileSidebarOpen, setMobileSidebarOpen,
      rightPanel, setRightPanel,
      isLive,
      loading: isLive ? sb.loading : false,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
