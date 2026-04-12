import { useChatContext } from './ChatContext';
import { Hash, Lock, ChevronDown, Search, Plus, MessageSquare, Settings, Menu } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  dnd: 'bg-red-500',
  offline: 'bg-muted-foreground/40',
};

export function ChatSidebar() {
  const { channels, activeChannelId, setActiveChannelId, currentUser, users, setSearchOpen, sidebarCollapsed, setSidebarCollapsed } = useChatContext();

  const publicChannels = channels.filter(c => c.type === 'public' || c.type === 'private');
  const dmChannels = channels.filter(c => c.type === 'dm' || c.type === 'group_dm');

  if (sidebarCollapsed) {
    return (
      <div className="w-12 bg-card border-r border-border flex flex-col items-center py-3 gap-2 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarCollapsed(false)}>
          <Menu className="w-4 h-4" />
        </Button>
        {publicChannels.map(ch => (
          <Button key={ch.id} variant="ghost" size="icon"
            className={cn('h-8 w-8 relative', activeChannelId === ch.id && 'bg-primary/15 text-primary')}
            onClick={() => setActiveChannelId(ch.id)}>
            <Hash className="w-3.5 h-3.5" />
            {(ch.unread_count ?? 0) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-60 bg-card border-r border-border flex flex-col shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-sm text-foreground">GFunnel Chat</h2>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSidebarCollapsed(true)}>
            <Menu className="w-3.5 h-3.5" />
          </Button>
        </div>
        <Button variant="secondary" className="w-full justify-start gap-2 h-8 text-xs text-muted-foreground"
          onClick={() => setSearchOpen(true)}>
          <Search className="w-3.5 h-3.5" />
          Search messages...
          <kbd className="ml-auto text-[10px] bg-muted px-1 rounded">⌘K</kbd>
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Channels */}
          <div className="mb-4">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Channels</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
            {publicChannels.map(ch => (
              <button key={ch.id}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                  activeChannelId === ch.id
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground border-l-2 border-transparent',
                  (ch.unread_count ?? 0) > 0 && activeChannelId !== ch.id && 'font-semibold text-foreground'
                )}
                onClick={() => setActiveChannelId(ch.id)}>
                {ch.type === 'private' ? <Lock className="w-3.5 h-3.5 shrink-0" /> : <Hash className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate">{ch.name}</span>
                {(ch.unread_count ?? 0) > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {ch.unread_count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* DMs */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Direct Messages</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
            {dmChannels.map(ch => {
              const otherUserId = ch.member_ids.find(id => id !== currentUser.id);
              const otherUser = users.find(u => u.id === otherUserId);
              return (
                <button key={ch.id}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                    activeChannelId === ch.id
                      ? 'bg-primary/10 text-primary border-l-2 border-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground border-l-2 border-transparent',
                    (ch.unread_count ?? 0) > 0 && activeChannelId !== ch.id && 'font-semibold text-foreground'
                  )}
                  onClick={() => setActiveChannelId(ch.id)}>
                  <div className="relative shrink-0">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[9px] bg-muted">{ch.name[0]}</AvatarFallback>
                    </Avatar>
                    {otherUser && (
                      <span className={cn('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card', statusColors[otherUser.status])} />
                    )}
                  </div>
                  <span className="truncate">{ch.name}</span>
                  {(ch.unread_count ?? 0) > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {ch.unread_count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      {/* Current user footer */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
                {currentUser.display_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card', statusColors[currentUser.status])} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{currentUser.display_name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{currentUser.status_text || currentUser.status}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
            <Settings className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}
