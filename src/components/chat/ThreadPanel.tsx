import { useChatContext } from './ChatContext';
import { MessageItem } from './MessageItem';
import { MessageComposer } from './MessageComposer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, MessageSquare } from 'lucide-react';

export function ThreadPanel() {
  const { threadParentId, setThreadParentId, threadReplies, messages, activeChannelId } = useChatContext();

  if (!threadParentId) return null;

  // Find parent - could be in messages (main feed) or in allMessages
  const allMsgs = [...messages];
  const parentMsg = allMsgs.find(m => m.id === threadParentId);

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col shrink-0">
      {/* Header */}
      <div className="h-12 px-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-foreground" />
          <h3 className="font-heading font-semibold text-sm text-foreground">Thread</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setThreadParentId(null)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Parent message */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {parentMsg && <MessageItem message={parentMsg} isCompact={false} />}

          {/* Reply count divider */}
          {threadReplies.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] font-medium text-muted-foreground">
                {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}

          {/* Replies */}
          {threadReplies.map(reply => (
            <MessageItem key={reply.id} message={reply} isCompact={false} />
          ))}
        </div>
      </ScrollArea>

      {/* Composer */}
      <MessageComposer channelId={activeChannelId} threadParentId={threadParentId} placeholder="Reply in thread..." />
    </div>
  );
}
