import { useChatContext } from './ChatContext';
import { Hash, Lock, Search, Pin, Users, Megaphone, Sparkles, Menu, MoreVertical, BellOff, Bell, Edit, Settings, Archive, Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function ChannelHeader() {
  const { channels, activeChannelId, setRightPanel, rightPanel, sidebarCollapsed, setSidebarCollapsed, setMobileSidebarOpen } = useChatContext();
  const channel = channels.find(c => c.id === activeChannelId);
  if (!channel) return null;

  const isDM = channel.type === 'dm' || channel.type === 'group_dm';

  return (
    <div className="h-12 px-4 border-b border-border flex items-center justify-between shrink-0 bg-card/50">
      <div className="flex items-center gap-2 min-w-0">
        {/* Mobile hamburger */}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground md:hidden shrink-0"
          onClick={() => setMobileSidebarOpen(true)}>
          <Menu className="w-4 h-4" />
        </Button>
        {/* Desktop collapse toggle when sidebar is collapsed */}
        {sidebarCollapsed && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hidden md:flex shrink-0"
            onClick={() => setSidebarCollapsed(false)}>
            <Menu className="w-4 h-4" />
          </Button>
        )}
        {!isDM && (
          channel.type === 'announcement'
            ? <Megaphone className="w-4 h-4 text-muted-foreground shrink-0" />
            : channel.type === 'private'
            ? <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
            : channel.emoji && channel.emoji !== '#'
            ? <span className="text-sm">{channel.emoji}</span>
            : <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <h2 className="font-heading font-semibold text-foreground text-sm truncate">{channel.name}</h2>
        {channel.topic && (
          <span className="text-xs text-muted-foreground truncate hidden sm:inline">
            <span className="text-border mx-1">|</span>
            {channel.topic || channel.description}
          </span>
        )}
        {!channel.topic && channel.description && (
          <span className="text-xs text-muted-foreground truncate hidden sm:inline">
            <span className="text-border mx-1">|</span>
            {channel.description}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
          onClick={() => setRightPanel(rightPanel === 'ai' ? 'none' : 'ai')}>
          <Sparkles className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hidden sm:flex">
          <Search className="w-4 h-4" />
        </Button>
        {!isDM && (channel.pinned_message_ids?.length ?? 0) > 0 && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hidden sm:flex">
            <Pin className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hidden sm:flex">
          <Users className="w-4 h-4" />
        </Button>

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem className="gap-2 text-sm" onClick={() => toast.info('Notifications toggled')}>
              <BellOff className="w-4 h-4" />
              Mute channel
            </DropdownMenuItem>
            {channel.is_starred ? (
              <DropdownMenuItem className="gap-2 text-sm" onClick={() => toast.info('Removed from starred')}>
                <StarOff className="w-4 h-4" />
                Unstar channel
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="gap-2 text-sm" onClick={() => toast.info('Added to starred')}>
                <Star className="w-4 h-4" />
                Star channel
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {!isDM && (
              <DropdownMenuItem className="gap-2 text-sm" onClick={() => toast.info('Edit topic — coming soon')}>
                <Edit className="w-4 h-4" />
                Edit topic
              </DropdownMenuItem>
            )}
            {!isDM && (
              <DropdownMenuItem className="gap-2 text-sm" onClick={() => toast.info('Channel settings — coming soon')}>
                <Settings className="w-4 h-4" />
                Channel settings
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-sm text-destructive focus:text-destructive" onClick={() => toast.info('Archive — coming soon')}>
              <Archive className="w-4 h-4" />
              Archive channel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
