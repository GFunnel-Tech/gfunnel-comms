import { useState, useCallback } from 'react';
import { useChatContext } from './ChatContext';
import { useActiveTabContext } from './ActiveTabContext';
import { MessageSquare, Pin, FileText, Users, Plus, X, Settings2 } from 'lucide-react';
import { PinnedTab } from './tabs/PinnedTab';
import { FilesTab } from './tabs/FilesTab';
import { MembersTab } from './tabs/MembersTab';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

export interface ChannelTab {
  id: string;
  label: string;
  icon?: string;        // emoji or lucide key
  type: 'preset' | 'custom';
  visible: boolean;
}

const PRESET_TABS: ChannelTab[] = [
  { id: 'messages', label: 'Messages', icon: 'messages', type: 'preset', visible: true },
  { id: 'pinned', label: 'Pinned', icon: 'pin', type: 'preset', visible: true },
  { id: 'files', label: 'Files', icon: 'file', type: 'preset', visible: true },
  { id: 'members', label: 'Members', icon: 'users', type: 'preset', visible: true },
];

const PRESET_ICONS: Record<string, React.ReactNode> = {
  messages: <MessageSquare className="w-3.5 h-3.5" />,
  pin: <Pin className="w-3.5 h-3.5" />,
  file: <FileText className="w-3.5 h-3.5" />,
  users: <Users className="w-3.5 h-3.5" />,
};

// Store per-channel tab config in memory (localStorage for persistence)
function getTabsForChannel(channelId: string): ChannelTab[] {
  try {
    const stored = localStorage.getItem(`channel_tabs_${channelId}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return PRESET_TABS.map(t => ({ ...t }));
}

function saveTabsForChannel(channelId: string, tabs: ChannelTab[]) {
  localStorage.setItem(`channel_tabs_${channelId}`, JSON.stringify(tabs));
}

export function ChannelTabBar() {
  const { activeChannelId } = useChatContext();
  const { activeTab, setActiveTab } = useActiveTabContext();
  const [tabs, setTabs] = useState<ChannelTab[]>(() => getTabsForChannel(activeChannelId));
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [newTabEmoji, setNewTabEmoji] = useState('📋');

  // Sync tabs when channel changes
  const [lastChannelId, setLastChannelId] = useState(activeChannelId);
  if (activeChannelId !== lastChannelId) {
    setLastChannelId(activeChannelId);
    setTabs(getTabsForChannel(activeChannelId));
    setActiveTab('messages');
  }

  const visibleTabs = tabs.filter(t => t.visible);

  const updateTabs = useCallback((newTabs: ChannelTab[]) => {
    setTabs(newTabs);
    saveTabsForChannel(activeChannelId, newTabs);
  }, [activeChannelId]);

  const handleAddCustomTab = () => {
    if (!newTabName.trim()) return;
    const newTab: ChannelTab = {
      id: `custom-${Date.now()}`,
      label: newTabName.trim(),
      icon: newTabEmoji || '📋',
      type: 'custom',
      visible: true,
    };
    updateTabs([...tabs, newTab]);
    setNewTabName('');
    setNewTabEmoji('📋');
    setShowAddDialog(false);
    setActiveTab(newTab.id);
  };

  const handleRemoveTab = (tabId: string) => {
    updateTabs(tabs.filter(t => t.id !== tabId));
    if (activeTab === tabId) setActiveTab('messages');
  };

  const handleToggleVisibility = (tabId: string, visible: boolean) => {
    updateTabs(tabs.map(t => t.id === tabId ? { ...t, visible } : t));
    if (!visible && activeTab === tabId) setActiveTab('messages');
  };

  return (
    <>
      <div className="h-9 px-4 border-b border-border flex items-center gap-0.5 bg-card/50 shrink-0 overflow-x-auto">
        {visibleTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'group relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 whitespace-nowrap',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {tab.type === 'preset' && tab.icon && PRESET_ICONS[tab.icon]}
              {tab.type === 'custom' && <span className="text-xs">{tab.icon}</span>}
              {tab.label}
              {tab.type === 'custom' && (
                <X
                  className="w-3 h-3 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity ml-0.5"
                  onClick={e => { e.stopPropagation(); handleRemoveTab(tab.id); }}
                />
              )}
            </button>
          );
        })}

        {/* Add tab button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0 ml-0.5">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem className="gap-2 text-xs" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-3.5 h-3.5" /> Add custom tab
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-xs" onClick={() => setShowManageDialog(true)}>
              <Settings2 className="w-3.5 h-3.5" /> Manage tabs
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active tab content for non-messages tabs */}
      {activeTab === 'pinned' && <PinnedTab />}
      {activeTab === 'files' && <FilesTab />}
      {activeTab === 'members' && <MembersTab />}
      {activeTab !== 'messages' && activeTab !== 'pinned' && activeTab !== 'files' && activeTab !== 'members' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="text-3xl">
              {(() => {
                const tab = tabs.find(t => t.id === activeTab);
                if (!tab) return '📋';
                if (tab.type === 'preset' && tab.icon) return null;
                return tab.icon || '📋';
              })()}
            </div>
            <p className="text-sm font-medium text-foreground">
              {tabs.find(t => t.id === activeTab)?.label}
            </p>
            <p className="text-xs text-muted-foreground">Custom tab content — coming soon</p>
          </div>
        </div>
      )}

      {/* Add custom tab dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Custom Tab</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2">
              <Input
                value={newTabEmoji}
                onChange={e => setNewTabEmoji(e.target.value)}
                className="w-12 text-center text-lg px-1"
                maxLength={2}
              />
              <Input
                placeholder="Tab name"
                value={newTabName}
                onChange={e => setNewTabName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCustomTab()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddCustomTab} disabled={!newTabName.trim()}>Add Tab</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage tabs dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Manage Tabs</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 py-2">
            {tabs.map(tab => (
              <div key={tab.id} className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted/50">
                <Checkbox
                  checked={tab.visible}
                  onCheckedChange={(checked) => handleToggleVisibility(tab.id, !!checked)}
                  disabled={tab.id === 'messages'}
                />
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {tab.type === 'preset' && tab.icon && <span className="text-muted-foreground">{PRESET_ICONS[tab.icon]}</span>}
                  {tab.type === 'custom' && <span className="text-sm">{tab.icon}</span>}
                  <span className="text-sm text-foreground truncate">{tab.label}</span>
                  {tab.type === 'preset' && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full ml-auto">Default</span>
                  )}
                </div>
                {tab.type === 'custom' && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleRemoveTab(tab.id)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowManageDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
