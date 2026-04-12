import { useChatContext } from './ChatContext';
import { CreateChannelDialog } from './CreateChannelDialog';
import { CreateDMDialog } from './CreateDMDialog';
import { Hash, Lock, ChevronDown, ChevronRight, Search, Plus, MessageSquare, Settings, Menu, Star, Megaphone, Zap, ChevronsUpDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { DEPARTMENT_COLORS, type Department } from '@/data/chat-types';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useState } from 'react';

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  dnd: 'bg-red-500',
  offline: 'bg-muted-foreground/40',
};

const deptBgColors: Record<string, string> = {
  'dept-revenue': 'bg-dept-revenue/20 text-dept-revenue',
  'dept-creative': 'bg-dept-creative/20 text-dept-creative',
  'dept-technology': 'bg-dept-technology/20 text-dept-technology',
  'dept-operations': 'bg-dept-operations/20 text-dept-operations',
  'dept-finance': 'bg-dept-finance/20 text-dept-finance',
  'dept-strategy': 'bg-dept-strategy/20 text-dept-strategy',
  'dept-support': 'bg-dept-support/20 text-dept-support',
  'dept-ai': 'bg-dept-ai/20 text-dept-ai',
  'dept-legal': 'bg-dept-legal/20 text-dept-legal',
};

function getChannelIcon(type: string, emoji: string) {
  if (type === 'announcement') return <Megaphone className="w-3.5 h-3.5 shrink-0" />;
  if (type === 'private') return <Lock className="w-3.5 h-3.5 shrink-0" />;
  if (emoji && emoji !== '#') return <span className="text-sm shrink-0">{emoji}</span>;
  return <Hash className="w-3.5 h-3.5 shrink-0" />;
}

export function ChatSidebar() {
  const { channels, activeChannelId, setActiveChannelId, currentUser, users, setSearchOpen, sidebarCollapsed, setSidebarCollapsed, setRightPanel, setMobileSidebarOpen, activeWorkspaceName, workspaces, activeWorkspaceId, switchWorkspace, createChannel, createDM } = useChatContext();
  const showRail = useMediaQuery('(min-width: 900px)');
  const [starredOpen, setStarredOpen] = useState(true);
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDMOpen, setCreateDMOpen] = useState(false);

  const starredChannels = channels.filter(c => c.is_starred);
  const publicChannels = channels.filter(c => c.type !== 'dm' && c.type !== 'group_dm' && !c.is_starred);
  const dmChannels = channels.filter(c => c.type === 'dm' || c.type === 'group_dm');

  if (sidebarCollapsed) {
    return (
      <div className="w-12 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-3 gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground" onClick={() => setSidebarCollapsed(false)}>
          <Menu className="w-4 h-4" />
        </Button>
        <div className="w-6 h-px bg-sidebar-border my-1" />
        {channels.filter(c => c.type !== 'dm' && c.type !== 'group_dm').map(ch => (
          <Button key={ch.id} variant="ghost" size="icon"
            className={cn('h-8 w-8 relative text-sidebar-foreground', activeChannelId === ch.id && 'bg-primary/10 text-primary')}
            onClick={() => { setActiveChannelId(ch.id); setMobileSidebarOpen(false); }}>
            {ch.emoji && ch.emoji !== '#' ? <span className="text-xs">{ch.emoji}</span> : <Hash className="w-3.5 h-3.5" />}
            {(ch.unread_count ?? 0) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>
        ))}
      </div>
    );
  }

  const renderChannelRow = (ch: typeof channels[0]) => {
    const dept = ch.department ? DEPARTMENT_COLORS[ch.department as Department] : null;
    const deptColor = dept ? deptBgColors[dept] : null;
    return (
      <button key={ch.id}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all duration-150',
          activeChannelId === ch.id
            ? 'bg-primary/10 text-primary border-l-2 border-primary'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-2 border-transparent',
          (ch.unread_count ?? 0) > 0 && activeChannelId !== ch.id && 'font-semibold text-foreground'
        )}
        onClick={() => { setActiveChannelId(ch.id); setMobileSidebarOpen(false); }}>
        {getChannelIcon(ch.type, ch.emoji)}
        <span className="truncate">{ch.name}</span>
        {deptColor && (
          <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium', deptColor)}>
            {(ch.department ?? '').split(' ')[0]}
          </span>
        )}
        {ch.linked_module_slug && <Zap className="w-3 h-3 text-primary shrink-0" />}
        {(ch.unread_count ?? 0) > 0 && (
          <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
            {ch.unread_count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="w-60 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 shadow-enterprise-sm">
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {!showRail ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 min-w-0 hover:bg-sidebar-accent rounded px-1 py-0.5 transition-colors">
                    <h2 className="font-heading font-bold text-sm text-foreground truncate">{activeWorkspaceName}</h2>
                    <ChevronsUpDown className="w-3 h-3 text-sidebar-foreground shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  {workspaces.map(ws => (
                    <DropdownMenuItem key={ws.workspace_id}
                      className={cn('gap-2', ws.workspace_id === activeWorkspaceId && 'bg-primary/10 text-primary')}
                      onClick={() => switchWorkspace(ws)}>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: ws.workspace_color || 'hsl(var(--primary))' }}>
                        {ws.workspace_name.charAt(0)}
                      </span>
                      <span className="truncate">{ws.workspace_name}</span>
                      {(ws.total_unread ?? 0) > 0 && (
                        <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 min-w-[18px] text-center">
                          {ws.total_unread}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <h2 className="font-heading font-bold text-sm text-foreground truncate">{activeWorkspaceName}</h2>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-sidebar-foreground" onClick={() => setSidebarCollapsed(true)}>
              <Menu className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start gap-2 h-8 text-xs text-sidebar-foreground bg-sidebar-accent/50 hover:bg-sidebar-accent"
          onClick={() => setSearchOpen(true)}>
          <Search className="w-3.5 h-3.5" />
          Search or jump to...
          <kbd className="ml-auto text-[10px] bg-sidebar-accent px-1 rounded">⌘K</kbd>
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Starred */}
          {starredChannels.length > 0 && (
            <div className="mb-2">
              <button className="flex items-center gap-1 px-2 mb-1 w-full" onClick={() => setStarredOpen(!starredOpen)}>
                {starredOpen ? <ChevronDown className="w-3 h-3 text-sidebar-foreground" /> : <ChevronRight className="w-3 h-3 text-sidebar-foreground" />}
                <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/80">Starred</span>
              </button>
              {starredOpen && starredChannels.map(renderChannelRow)}
            </div>
          )}

          {/* Channels */}
          <div className="mb-2">
            <div className="flex items-center justify-between px-2 mb-1">
              <button className="flex items-center gap-1" onClick={() => setChannelsOpen(!channelsOpen)}>
                {channelsOpen ? <ChevronDown className="w-3 h-3 text-sidebar-foreground" /> : <ChevronRight className="w-3 h-3 text-sidebar-foreground" />}
                <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/80">Channels</span>
              </button>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-sidebar-foreground" onClick={() => setCreateOpen(true)}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            {channelsOpen && publicChannels.map(renderChannelRow)}
          </div>

          {/* DMs */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <button className="flex items-center gap-1" onClick={() => setDmsOpen(!dmsOpen)}>
                {dmsOpen ? <ChevronDown className="w-3 h-3 text-sidebar-foreground" /> : <ChevronRight className="w-3 h-3 text-sidebar-foreground" />}
                <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/80">Direct Messages</span>
              </button>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-sidebar-foreground" onClick={() => setCreateDMOpen(true)}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            {dmsOpen && dmChannels.map(ch => {
              const otherUserId = ch.member_ids.find(id => id !== currentUser.id);
              const otherUser = users.find(u => u.id === otherUserId);
              return (
                <button key={ch.id}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all duration-150',
                    activeChannelId === ch.id
                      ? 'bg-primary/10 text-primary border-l-2 border-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-2 border-transparent',
                    (ch.unread_count ?? 0) > 0 && activeChannelId !== ch.id && 'font-semibold text-foreground'
                  )}
                  onClick={() => { setActiveChannelId(ch.id); setMobileSidebarOpen(false); }}>
                  <div className="relative shrink-0">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[9px] bg-secondary">{ch.name[0]}</AvatarFallback>
                    </Avatar>
                    {otherUser && (
                      <span className={cn('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-sidebar', statusColors[otherUser.status])} />
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
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
                {currentUser.display_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar', statusColors[currentUser.status])} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{currentUser.display_name}</p>
            <p className="text-[10px] text-sidebar-foreground truncate">{currentUser.status_text || currentUser.status}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-sidebar-foreground">
            <Settings className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <CreateChannelDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={createChannel} />
      <CreateDMDialog open={createDMOpen} onOpenChange={setCreateDMOpen} users={users} currentUserId={currentUser.id} onCreateDM={createDM} />
    </div>
  );
}
