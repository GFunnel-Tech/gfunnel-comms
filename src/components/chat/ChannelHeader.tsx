import { useChatContext } from './ChatContext';
import { Hash, Lock, Search, Pin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ChannelHeader() {
  const { channels, activeChannelId } = useChatContext();
  const channel = channels.find(c => c.id === activeChannelId);
  if (!channel) return null;

  const isDM = channel.type === 'dm' || channel.type === 'group_dm';

  return (
    <div className="h-12 px-4 border-b border-border flex items-center justify-between shrink-0 bg-card">
      <div className="flex items-center gap-2 min-w-0">
        {!isDM && (
          channel.type === 'private'
            ? <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
            : <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <h2 className="font-heading font-semibold text-foreground text-sm truncate">{channel.name}</h2>
        {channel.description && (
          <>
            <span className="text-border">|</span>
            <span className="text-xs text-muted-foreground truncate">{channel.description}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Search className="w-4 h-4 text-muted-foreground" />
        </Button>
        {!isDM && channel.pinned_message_ids.length > 0 && (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pin className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Users className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
