import { useRef, useEffect, useMemo } from 'react';
import { useChatContext } from './ChatContext';
import { MessageItem } from './MessageItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isToday, isYesterday } from 'date-fns';
import { Pin } from 'lucide-react';

export function MessageFeed() {
  const { messages, channels, activeChannelId, jumpToMessageId, setJumpToMessageId } = useChatContext();
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const channel = channels.find(c => c.id === activeChannelId);

  useEffect(() => {
    if (jumpToMessageId) {
      // Wait for render then scroll
      requestAnimationFrame(() => {
        const el = messageRefs.current.get(jumpToMessageId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setJumpToMessageId(null);
      });
    }
  }, [jumpToMessageId, setJumpToMessageId, messages]);

  useEffect(() => {
    if (!jumpToMessageId) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, activeChannelId]);

  const groupedMessages = useMemo(() => {
    const groups: { date: string; label: string; messages: typeof messages }[] = [];
    let currentGroup: typeof groups[0] | null = null;

    messages.forEach(msg => {
      const date = new Date(msg.created_at);
      const dateKey = format(date, 'yyyy-MM-dd');
      if (!currentGroup || currentGroup.date !== dateKey) {
        let label = format(date, 'EEEE, MMMM d, yyyy');
        if (isToday(date)) label = 'Today';
        else if (isYesterday(date)) label = 'Yesterday';
        currentGroup = { date: dateKey, label, messages: [] };
        groups.push(currentGroup);
      }
      currentGroup.messages.push(msg);
    });
    return groups;
  }, [messages]);

  if (messages.length === 0) {
    const isDM = channel?.type === 'dm';
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            {isDM ? `Start a conversation with ${channel?.name}` : `This is the start of #${channel?.name}. Say hello! 👋`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="py-4">
        {/* Pinned banner */}
        {channel && channel.pinned_message_ids.length > 0 && (
          <div className="mx-4 mb-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2">
            <Pin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">
              {channel.pinned_message_ids.length} pinned {channel.pinned_message_ids.length === 1 ? 'message' : 'messages'}
            </span>
          </div>
        )}

        {groupedMessages.map(group => (
          <div key={group.date}>
            {/* Date divider */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] font-medium text-muted-foreground">{group.label}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {group.messages.map((msg, i) => {
              const prev = i > 0 ? group.messages[i - 1] : null;
              const isCompact = prev
                && prev.user_id === msg.user_id
                && prev.type !== 'system'
                && msg.type !== 'system'
                && (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) < 300000;
              return (
                <div key={msg.id} ref={el => { if (el) messageRefs.current.set(msg.id, el); else messageRefs.current.delete(msg.id); }}>
                  <MessageItem message={msg} isCompact={!!isCompact} />
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
