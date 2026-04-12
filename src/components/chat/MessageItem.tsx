import { ChatMessage } from '@/data/chat-types';
import { useChatContext } from './ChatContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, Pin, Pencil, SmilePlus, Bookmark, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { notifyNavigation } from '@/lib/gfunnel-bridge';

const quickReactions = ['👍', '❤️', '😂', '🎉', '🔥', '👀'];

interface MessageItemProps {
  message: ChatMessage;
  isCompact: boolean;
}

export function MessageItem({ message, isCompact }: MessageItemProps) {
  const { currentUser, setThreadParentId, toggleReaction, users } = useChatContext();

  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-2">
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

  const isAI = message.source === 'ai' || message.type === 'ai';
  const isAutomation = message.source === 'n8n' || message.type === 'automation';
  const initials = message.user_display_name.split(' ').map(n => n[0]).join('');
  const time = format(new Date(message.created_at), 'h:mm a');
  const reactionEntries = Object.entries(message.reactions);

  // Thread participant avatars
  const threadParticipants = message.thread_participant_ids
    .slice(0, 3)
    .map(id => users.find(u => u.id === id))
    .filter(Boolean);

  return (
    <div className={cn(
      'group relative px-4 hover:bg-muted/30 transition-all duration-150',
      isAI && 'border-l-2 border-info bg-info/5',
      isAutomation && 'border-l-2 border-warning bg-warning/5',
    )}>
      {/* Hover action bar */}
      <div className="absolute -top-3 right-4 hidden group-hover:flex items-center bg-card border border-border rounded-lg shadow-enterprise z-10">
        {quickReactions.slice(0, 3).map(emoji => (
          <Button key={emoji} variant="ghost" size="icon" className="h-7 w-7 text-sm hover:bg-muted"
            onClick={() => toggleReaction(message.id, emoji)}>
            {emoji}
          </Button>
        ))}
        <div className="w-px h-4 bg-border" />
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted"
          onClick={() => setThreadParentId(message.id)}>
          <MessageSquare className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted">
          <Bookmark className="w-3.5 h-3.5" />
        </Button>
        {message.user_id === currentUser.id && (
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <div className={cn('flex gap-2.5', isCompact ? 'py-0.5' : 'pt-2 pb-1')}>
        {isCompact ? (
          <div className="w-9 shrink-0 flex justify-center">
            <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 mt-0.5">
              {format(new Date(message.created_at), 'h:mm')}
            </span>
          </div>
        ) : (
          <Avatar className="h-9 w-9 shrink-0 mt-0.5">
            <AvatarFallback className={cn(
              'text-xs font-semibold',
              isAI ? 'bg-info/20 text-info' : isAutomation ? 'bg-warning/20 text-warning' : 'bg-primary/15 text-primary'
            )}>
              {isAI ? '✦' : isAutomation ? '⚡' : initials}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="flex-1 min-w-0">
          {!isCompact && (
            <div className="flex items-center gap-2 mb-0.5">
              <span className={cn(
                'text-sm font-semibold',
                isAI ? 'text-info' : isAutomation ? 'text-warning' : 'text-foreground'
              )}>
                {message.user_display_name}
              </span>
              {isAI && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-info/20 text-info font-medium flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> AI
                </span>
              )}
              {isAutomation && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/20 text-warning font-medium flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" /> Automation
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">{time}</span>
              {message.is_edited && <span className="text-[10px] text-muted-foreground">(edited)</span>}
              {message.pinned && <Pin className="w-3 h-3 text-primary" />}
            </div>
          )}

          {/* Content with basic markdown */}
          <div className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
            {message.content.split(/(\*\*.*?\*\*|`[^`]+`)/g).map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="px-1 py-0.5 rounded bg-muted text-xs font-mono">{part.slice(1, -1)}</code>;
              }
              return part;
            })}
          </div>

          {/* Automation metadata */}
          {isAutomation && message.metadata?.workflow_name && (
            <div className="mt-1 text-[10px] text-warning/70 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />
              {String(message.metadata.workflow_name)}
            </div>
          )}

          {/* Context links */}
          {message.context_links.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {message.context_links.map((link, i) => (
                <button key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                  onClick={() => notifyNavigation(link.url)}>
                  📊 {link.label} →
                </button>
              ))}
            </div>
          )}

          {/* Reactions */}
          {reactionEntries.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {reactionEntries.map(([emoji, userIds]) => {
                const hasReacted = userIds.includes(currentUser.id);
                return (
                  <button key={emoji}
                    className={cn(
                      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-all duration-150',
                      hasReacted
                        ? 'bg-primary/15 border-primary/30 text-foreground'
                        : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                    )}
                    onClick={() => toggleReaction(message.id, emoji)}>
                    <span>{emoji}</span>
                    <span className="text-[10px] font-medium">{userIds.length}</span>
                  </button>
                );
              })}
              <button className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs border border-border bg-muted/30 text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                <SmilePlus className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Thread indicator */}
          {message.thread_reply_count > 0 && (
            <button className="flex items-center gap-2 mt-1.5 text-xs text-primary hover:underline group/thread"
              onClick={() => setThreadParentId(message.id)}>
              <div className="flex -space-x-1.5">
                {threadParticipants.map(u => (
                  <Avatar key={u!.id} className="h-4 w-4 border border-card">
                    <AvatarFallback className="text-[7px] bg-primary/15 text-primary">{u!.display_name[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span>{message.thread_reply_count} {message.thread_reply_count === 1 ? 'reply' : 'replies'}</span>
              {message.thread_last_reply_at && (
                <span className="text-muted-foreground">
                  Last reply {format(new Date(message.thread_last_reply_at), 'h:mm a')}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
