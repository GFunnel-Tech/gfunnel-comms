import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ChatChannel, ChatMessage, ChatUser } from '@/data/chat-types';
import { demoChannels, demoMessages, demoUsers, currentDemoUser } from '@/data/chat-demo-data';

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
  rightPanel: RightPanel;
  setRightPanel: (p: RightPanel) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [allMessages, setAllMessages] = useState<ChatMessage[]>(demoMessages);
  const [channels] = useState<ChatChannel[]>(demoChannels);
  const [activeChannelId, setActiveChannelId] = useState('ch-general');
  const [threadParentId, setThreadParentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanel>('none');

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

  const sendMessage = useCallback((content: string, channelId: string, parentId?: string) => {
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
    setAllMessages(prev => {
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
  }, []);

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    setAllMessages(prev => prev.map(m => {
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
  }, []);

  return (
    <ChatContext.Provider value={{
      currentUser: currentDemoUser, users: demoUsers, channels,
      activeChannelId, setActiveChannelId, messages, allMessages,
      threadParentId, setThreadParentId: handleSetThreadParentId, threadReplies,
      sendMessage, toggleReaction,
      searchQuery, setSearchQuery, searchOpen, setSearchOpen,
      sidebarCollapsed, setSidebarCollapsed,
      rightPanel, setRightPanel,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
