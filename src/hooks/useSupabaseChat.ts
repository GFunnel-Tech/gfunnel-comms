import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ChatChannel, ChatMessage, ChatUser } from '@/data/chat-types';
import type { Tables } from '@/integrations/supabase/types';

type DbMessage = Tables<'chat_messages'>;
type DbChannel = Tables<'chat_channels'>;
type DbMember = Tables<'chat_members'>;

function dbMsgToChat(m: DbMessage): ChatMessage {
  const reactions = (m.reactions && typeof m.reactions === 'object' && !Array.isArray(m.reactions))
    ? m.reactions as Record<string, string[]>
    : {};
  const context_links = Array.isArray(m.context_links)
    ? (m.context_links as { type: string; slug: string; label: string; url: string }[])
    : [];
  const metadata = (m.metadata && typeof m.metadata === 'object' && !Array.isArray(m.metadata))
    ? m.metadata as Record<string, unknown>
    : {};

  return {
    id: m.id,
    workspace_id: m.workspace_id,
    channel_id: m.channel_id,
    user_id: m.user_id,
    user_display_name: '', // filled in by context
    user_avatar_url: null,
    content: m.content,
    content_html: m.content_html ?? undefined,
    type: m.type as ChatMessage['type'],
    source: m.source as ChatMessage['source'],
    thread_parent_id: m.thread_parent_id ?? undefined,
    thread_reply_count: m.thread_reply_count,
    thread_participant_ids: m.thread_participant_ids ?? [],
    thread_last_reply_at: m.thread_last_reply_at ?? undefined,
    is_edited: m.is_edited,
    edited_at: m.edited_at ?? undefined,
    is_deleted: m.is_deleted,
    deleted_at: m.deleted_at ?? undefined,
    pinned: m.pinned,
    pinned_by: m.pinned_by ?? undefined,
    pinned_at: m.pinned_at ?? undefined,
    file_url: m.file_url ?? undefined,
    file_name: m.file_name ?? undefined,
    file_size: m.file_size ?? undefined,
    file_type: m.file_type ?? undefined,
    file_thumbnail_url: m.file_thumbnail_url ?? undefined,
    reactions,
    mentions: m.mentions ?? [],
    channel_mentions: m.channel_mentions ?? [],
    context_links,
    metadata,
    created_at: m.created_at,
    updated_at: m.updated_at,
  };
}

function dbChannelToChat(c: DbChannel, membership?: DbMember): ChatChannel {
  return {
    id: c.id,
    workspace_id: c.workspace_id,
    name: c.name,
    description: c.description ?? undefined,
    topic: c.topic ?? undefined,
    type: c.type as ChatChannel['type'],
    department: c.department as ChatChannel['department'],
    created_by: c.created_by,
    is_archived: c.is_archived,
    is_read_only: c.is_read_only,
    member_ids: [], // filled separately
    pinned_message_ids: (c.pinned_message_ids ?? []) as string[],
    last_message_at: c.last_message_at ?? undefined,
    last_message_preview: c.last_message_preview ?? undefined,
    message_count: c.message_count,
    sort_order: c.sort_order,
    emoji: c.emoji ?? '#',
    linked_module_slug: c.linked_module_slug ?? undefined,
    linked_module_label: c.linked_module_label ?? undefined,
    created_at: c.created_at,
    updated_at: c.updated_at,
    unread_count: membership?.unread_count ?? 0,
    is_starred: membership?.is_starred ?? false,
  };
}

export function useSupabaseChat(workspaceId: string, userId: string) {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const subscriptionsRef = useRef<(() => void)[]>([]);

  // Load channels with membership info
  const loadChannels = useCallback(async () => {
    const { data: memberData } = await supabase
      .from('chat_members')
      .select('channel_id, unread_count, is_starred')
      .eq('user_id', userId);

    const memberMap = new Map(
      (memberData ?? []).map(m => [m.channel_id, m])
    );

    const { data: channelData } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('sort_order');

    if (channelData) {
      setChannels(channelData.map(c => dbChannelToChat(c, memberMap.get(c.id) as DbMember | undefined)));
    }
  }, [workspaceId, userId]);

  // Load messages for a channel
  const loadMessages = useCallback(async (channelId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(200);

    if (data) {
      setAllMessages(prev => {
        const otherChannelMsgs = prev.filter(m => m.channel_id !== channelId);
        return [...otherChannelMsgs, ...data.map(dbMsgToChat)];
      });
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (content: string, channelId: string, threadParentId?: string) => {
    const { error } = await supabase.from('chat_messages').insert({
      workspace_id: workspaceId,
      channel_id: channelId,
      user_id: userId,
      content,
      thread_parent_id: threadParentId ?? null,
    });

    if (error) console.error('Send message error:', error);

    // Update parent thread count if replying
    if (threadParentId) {
      const parent = allMessages.find(m => m.id === threadParentId);
      if (parent) {
        await supabase.from('chat_messages').update({
          thread_reply_count: parent.thread_reply_count + 1,
          thread_last_reply_at: new Date().toISOString(),
          thread_participant_ids: [...new Set([...(parent.thread_participant_ids || []), userId])],
        }).eq('id', threadParentId);
      }
    }

    // Update channel last_message
    await supabase.from('chat_channels').update({
      last_message_at: new Date().toISOString(),
      last_message_preview: content.slice(0, 100),
      message_count: (channels.find(c => c.id === channelId)?.message_count ?? 0) + 1,
    }).eq('id', channelId);
  }, [workspaceId, userId, allMessages, channels]);

  // Toggle reaction
  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    const msg = allMessages.find(m => m.id === messageId);
    if (!msg) return;

    const reactions = { ...msg.reactions };
    const current = reactions[emoji] || [];
    const hasReacted = current.includes(userId);

    if (hasReacted) {
      const updated = current.filter(id => id !== userId);
      if (updated.length === 0) delete reactions[emoji];
      else reactions[emoji] = updated;
    } else {
      reactions[emoji] = [...current, userId];
    }

    // Optimistic update
    setAllMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));

    await supabase.from('chat_messages').update({ reactions }).eq('id', messageId);
  }, [allMessages, userId]);

  // Update presence
  const updatePresence = useCallback(async (status: 'online' | 'away' | 'dnd' | 'offline') => {
    await supabase.from('chat_presence').upsert({
      user_id: userId,
      status,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  }, [userId]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!workspaceId) return;

    // Messages realtime
    const msgChannel = supabase
      .channel('chat-messages-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `workspace_id=eq.${workspaceId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = dbMsgToChat(payload.new as DbMessage);
          setAllMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updated = dbMsgToChat(payload.new as DbMessage);
          setAllMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id: string }).id;
          setAllMessages(prev => prev.filter(m => m.id !== id));
        }
      })
      .subscribe();

    // Channels realtime
    const chChannel = supabase
      .channel('chat-channels-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_channels',
        filter: `workspace_id=eq.${workspaceId}`,
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updated = payload.new as DbChannel;
          setChannels(prev => prev.map(c => c.id === updated.id ? { ...c, ...dbChannelToChat(updated) } : c));
        }
      })
      .subscribe();

    subscriptionsRef.current = [
      () => supabase.removeChannel(msgChannel),
      () => supabase.removeChannel(chChannel),
    ];

    return () => {
      subscriptionsRef.current.forEach(unsub => unsub());
    };
  }, [workspaceId]);

  // Initial load
  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    loadChannels().finally(() => setLoading(false));
  }, [workspaceId, loadChannels]);

  return {
    channels,
    allMessages,
    loading,
    loadMessages,
    sendMessage,
    toggleReaction,
    updatePresence,
    loadChannels,
  };
}
