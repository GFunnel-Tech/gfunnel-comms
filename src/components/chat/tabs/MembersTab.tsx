import { useMemo } from 'react';
import { useChatContext } from '../ChatContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Shield, Crown, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-amber-400',
  dnd: 'bg-destructive',
  offline: 'bg-muted-foreground/40',
};

const STATUS_LABELS: Record<string, string> = {
  online: 'Online',
  away: 'Away',
  dnd: 'Do Not Disturb',
  offline: 'Offline',
};

export function MembersTab() {
  const { channels, activeChannelId, users, createDM } = useChatContext();
  const channel = channels.find(c => c.id === activeChannelId);

  const members = useMemo(() => {
    if (!channel) return [];
    return channel.member_ids
      .map(id => users.find(u => u.id === id))
      .filter(Boolean)
      .sort((a, b) => {
        const statusOrder = { online: 0, away: 1, dnd: 2, offline: 3 };
        const diff = (statusOrder[a!.status] ?? 3) - (statusOrder[b!.status] ?? 3);
        if (diff !== 0) return diff;
        return a!.display_name.localeCompare(b!.display_name);
      }) as typeof users;
  }, [channel, users]);

  const onlineCount = members.filter(m => m.status === 'online').length;

  if (members.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">No members found</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Members — {members.length}
          </span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {onlineCount} online
          </span>
        </div>

        <div className="space-y-0.5">
          {members.map(member => {
            const initials = member.display_name.split(' ').map(n => n[0]).join('');
            const isAdmin = member.role === 'admin';
            return (
              <div
                key={member.id}
                className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="relative shrink-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs font-semibold bg-primary/15 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card',
                    STATUS_COLORS[member.status]
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground truncate">{member.display_name}</span>
                    {isAdmin && (
                      <Crown className="w-3 h-3 text-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {member.status_text || STATUS_LABELS[member.status]}
                    {member.status_emoji && ` ${member.status_emoji}`}
                  </p>
                </div>

                <button
                  className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  onClick={() => createDM([member.id])}
                  title={`Message ${member.display_name}`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
