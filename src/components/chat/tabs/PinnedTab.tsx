import { useMemo } from 'react';
import { useChatContext } from '../ChatContext';
import { useActiveTabContext } from '../ActiveTabContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Pin, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export function PinnedTab() {
  const { channels, activeChannelId, allMessages, setJumpToMessageId, setHighlightedMessageId } = useChatContext();
  const { setActiveTab } = useActiveTabContext();
  const channel = channels.find(c => c.id === activeChannelId);

  const pinnedMessages = useMemo(() => {
    return allMessages
      .filter(m => m.channel_id === activeChannelId && m.pinned)
      .sort((a, b) => new Date(b.pinned_at || b.created_at).getTime() - new Date(a.pinned_at || a.created_at).getTime());
  }, [allMessages, activeChannelId]);

  if (pinnedMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
            <Pin className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">No pinned messages</p>
          <p className="text-xs text-muted-foreground max-w-[240px]">
            Pin important messages to keep them easily accessible for everyone in the channel.
          </p>
        </div>
      </div>
    );
  }

  const handleJump = (msgId: string) => {
    setActiveTab('messages');
    setTimeout(() => {
      setJumpToMessageId(msgId);
      setHighlightedMessageId(msgId);
      setTimeout(() => setHighlightedMessageId(null), 3000);
    }, 50);
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Pin className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {pinnedMessages.length} pinned {pinnedMessages.length === 1 ? 'message' : 'messages'}
          </span>
        </div>
        {pinnedMessages.map(msg => {
          const initials = msg.user_display_name.split(' ').map(n => n[0]).join('');
          return (
            <div
              key={msg.id}
              className="group rounded-lg border border-border bg-card p-3 hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => handleJump(msg.id)}
            >
              <div className="flex items-start gap-2.5">
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  <AvatarFallback className="text-[10px] font-semibold bg-primary/15 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground">{msg.user_display_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 line-clamp-3 whitespace-pre-wrap">{msg.content}</p>
                </div>
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
              </div>
              {msg.pinned_by && (
                <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1.5">
                  <Pin className="w-2.5 h-2.5 text-primary" />
                  <span className="text-[10px] text-muted-foreground">
                    Pinned {msg.pinned_at ? format(new Date(msg.pinned_at), 'MMM d') : ''}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
