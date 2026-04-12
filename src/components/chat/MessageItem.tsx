import { ChatMessage } from '@/data/chat-types';
import { useChatContext } from './ChatContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, Pin, Pencil, Trash2, SmilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const quickReactions = ['👍', '❤️', '😂', '🎉', '🔥', '👀'];

interface MessageItemProps {
  message: ChatMessage;
  isCompact: boolean;
}

export function MessageItem({ message, isCompact }: MessageItemProps) {
  const { currentUser, setThreadParentId, toggleReaction } = useChatContext();

  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-1">
        <span className="text-xs text-muted-foreground italic">{message.content}</span>
      </div>
    );
  }

  if (message.is_deleted) {
    return (
      <div className={cn('px-4 py-1', !isCompact && 'pt-2')}>
        <span className="text-xs text-muted-foreground italic">This message was deleted</span>
      </div>
    );
  }

  const initials = message.user_display_name.split(' ').map(n => n[0]).join('');
  const time = format(new Date(message.created_at), 'h:mm a');
  const reactionEntries = Object.entries(message.reactions);

  return (
    <div className="group relative px-4 hover:bg-muted/50 transition-colors">
      {/* Hover action bar */}
      <div className="absolute -top-3 right-4 hidden group-hover:flex items-center bg-card border border-border rounded-md shadow-sm z-10">
        {quickReactions.slice(0, 3).map(emoji => (
          <Button key={emoji} variant="ghost" size="icon" className="h-7 w-7 text-sm"
            onClick={() => toggleReaction(message.id, emoji)}>
            {emoji}
          </Button>
        ))}
        <Button variant="ghost" size="icon" className="h-7 w-7"
          onClick={() => setThreadParentId(message.id)}>
          <MessageSquare className="w-3.5 h-3.5" />
        </Button>
        {message.user_id === currentUser.id && (
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <div className={cn('flex gap-2.5', isCompact ? 'py-0.5' : 'pt-2 pb-1')}>
        {/* Avatar or spacer */}
        {isCompact ? (
          <div className="w-9 shrink-0 flex justify-center">
            <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 mt-0.5">
              {format(new Date(message.created_at), 'h:mm')}
            </span>
          </div>
        ) : (
          <Avatar className="h-9 w-9 shrink-0 mt-0.5">
            <AvatarFallback className="text-xs bg-primary/15 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="flex-1 min-w-0">
          {!isCompact && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-sm font-semibold text-foreground">{message.user_display_name}</span>
              <span className="text-[11px] text-muted-foreground">{time}</span>
              {message.is_edited && <span className="text-[10px] text-muted-foreground">(edited)</span>}
              {message.pinned && <Pin className="w-3 h-3 text-primary inline" />}
            </div>
          )}

          {/* Content */}
          <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
            {message.content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </p>

          {/* Reactions */}
          {reactionEntries.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {reactionEntries.map(([emoji, userIds]) => {
                const hasReacted = userIds.includes(currentUser.id);
                return (
                  <button key={emoji}
                    className={cn(
                      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors',
                      hasReacted
                        ? 'bg-primary/15 border-primary/30 text-foreground'
                        : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                    )}
                    onClick={() => toggleReaction(message.id, emoji)}>
                    <span>{emoji}</span>
                    <span className="text-[10px] font-medium">{userIds.length}</span>
                  </button>
                );
              })}
              <button className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs border border-border bg-muted text-muted-foreground hover:bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity">
                <SmilePlus className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Thread indicator */}
          {message.thread_reply_count > 0 && (
            <button className="flex items-center gap-1.5 mt-1 text-xs text-primary hover:underline"
              onClick={() => setThreadParentId(message.id)}>
              <MessageSquare className="w-3 h-3" />
              {message.thread_reply_count} {message.thread_reply_count === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
