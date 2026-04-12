import { useChatContext } from './ChatContext';
import { MessageItem } from './MessageItem';
import { MessageComposer } from './MessageComposer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, MessageSquare } from 'lucide-react';

export function ThreadPanel() {
  const { threadParentId, setThreadParentId, threadReplies, messages, activeChannelId, channels } = useChatContext();

  if (!threadParentId) return null;

  const parentMsg = messages.find(m => m.id === threadParentId);
  const channel = channels.find(c => c.id === activeChannelId);

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col shrink-0">
      <div className="h-12 px-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-foreground" />
            <h3 className="font-heading font-semibold text-sm text-foreground">Thread</h3>
          </div>
          {channel && <span className="text-[10px] text-muted-foreground ml-6">in #{channel.name}</span>}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setThreadParentId(null)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-2">
          {parentMsg && <MessageItem message={parentMsg} isCompact={false} />}

          {threadReplies.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] font-medium text-muted-foreground">
                {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}

          {threadReplies.map(reply => (
            <MessageItem key={reply.id} message={reply} isCompact={false} />
          ))}
        </div>
      </ScrollArea>

      <MessageComposer channelId={activeChannelId} threadParentId={threadParentId} placeholder="Reply in thread..." />
    </div>
  );
}
