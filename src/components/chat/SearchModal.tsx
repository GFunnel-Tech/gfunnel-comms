import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useChatContext } from './ChatContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, Hash, MessageSquare, User, Sparkles, Plus, FileDown } from 'lucide-react';
import { format } from 'date-fns';

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="bg-primary/30 text-foreground rounded-sm px-0.5">{part}</mark> : part
  );
}

type ResultItem =
  | { kind: 'action'; id: string; label: string; icon: React.ReactNode; action: () => void }
  | { kind: 'channel'; id: string; data: any }
  | { kind: 'person'; id: string; data: any }
  | { kind: 'message'; id: string; data: any };

export function SearchModal() {
  const { searchOpen, setSearchOpen, searchQuery, setSearchQuery, channels, users, setActiveChannelId, allMessages, setRightPanel, setHighlightedMessageId, setJumpToMessageId } = useChatContext();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setSearchOpen]);

  // Reset selection when query changes
  useEffect(() => { setSelectedIndex(0); }, [searchQuery]);

  const results = useMemo(() => {
    if (!searchQuery.trim()) return { messages: [], channels: [], people: [] };
    const q = searchQuery.toLowerCase();
    return {
      messages: allMessages.filter(m => m.type === 'text' && m.content.toLowerCase().includes(q) && !m.thread_parent_id).slice(0, 8),
      channels: channels.filter(c => (c.type !== 'dm' && c.type !== 'group_dm') && c.name.toLowerCase().includes(q)),
      people: users.filter(u => u.display_name.toLowerCase().includes(q)),
    };
  }, [searchQuery, channels, users, allMessages]);

  // Build flat list of all selectable items
  const flatItems: ResultItem[] = useMemo(() => {
    if (!searchQuery.trim()) {
      return [
        { kind: 'action', id: 'ai', label: 'Ask GFunnel AI', icon: <Sparkles className="w-3.5 h-3.5 text-info" />, action: () => { setSearchOpen(false); setRightPanel('ai'); } },
        { kind: 'action', id: 'channel', label: 'Create Channel', icon: <Plus className="w-3.5 h-3.5" />, action: () => {} },
        { kind: 'action', id: 'dm', label: 'New Direct Message', icon: <MessageSquare className="w-3.5 h-3.5" />, action: () => {} },
        { kind: 'action', id: 'import', label: 'Import from Slack', icon: <FileDown className="w-3.5 h-3.5" />, action: () => {} },
      ];
    }
    const items: ResultItem[] = [];
    results.channels.forEach(ch => items.push({ kind: 'channel', id: ch.id, data: ch }));
    results.people.forEach(u => items.push({ kind: 'person', id: u.id, data: u }));
    results.messages.forEach(m => items.push({ kind: 'message', id: m.id, data: m }));
    return items;
  }, [searchQuery, results, setSearchOpen, setRightPanel]);

  const executeItem = useCallback((item: ResultItem) => {
    if (item.kind === 'action') { item.action(); return; }
    if (item.kind === 'channel') { setActiveChannelId(item.data.id); setSearchOpen(false); setSearchQuery(''); return; }
    if (item.kind === 'message') {
      const m = item.data;
      setActiveChannelId(m.channel_id); setJumpToMessageId(m.id); setHighlightedMessageId(m.id); setSearchOpen(false); setSearchQuery('');
      setTimeout(() => setHighlightedMessageId(null), 3000);
    }
  }, [setActiveChannelId, setSearchOpen, setSearchQuery, setJumpToMessageId, setHighlightedMessageId]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-result-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, flatItems.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && flatItems.length > 0) { e.preventDefault(); executeItem(flatItems[selectedIndex]); }
  }, [flatItems, selectedIndex, executeItem]);

  let itemIndex = -1;
  const getNextIndex = () => ++itemIndex;
  const selectedClass = (idx: number) => idx === selectedIndex ? 'bg-muted' : '';

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 bg-card border-border">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search GFunnel Chat..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto" ref={listRef}>
          {/* Default view - actions */}
          {!searchQuery.trim() && (
            <div className="p-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">Actions</p>
              {flatItems.filter((it): it is Extract<ResultItem, {kind:'action'}> => it.kind === 'action').map(item => {
                const idx = getNextIndex();
                return (
                  <button key={item.id} data-result-index={idx}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-sidebar-foreground hover:bg-muted transition-colors ${selectedClass(idx)}`}
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}>
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          {searchQuery.trim() && flatItems.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results for "{searchQuery}"
            </div>
          )}

          {results.channels.length > 0 && (
            <div className="p-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">Channels</p>
              {results.channels.map(ch => {
                const idx = getNextIndex();
                return (
                  <button key={ch.id} data-result-index={idx}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors ${selectedClass(idx)}`}
                    onClick={() => executeItem(flatItems.find(i => i.kind === 'channel' && i.id === ch.id)!)}
                    onMouseEnter={() => setSelectedIndex(idx)}>
                    {ch.emoji && ch.emoji !== '#' ? <span>{ch.emoji}</span> : <Hash className="w-3.5 h-3.5 text-muted-foreground" />}
                    <span className="text-foreground">{ch.name}</span>
                    {ch.description && <span className="text-xs text-muted-foreground truncate">— {ch.description}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {results.people.length > 0 && (
            <div className="p-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">People</p>
              {results.people.map(u => {
                const idx = getNextIndex();
                return (
                  <button key={u.id} data-result-index={idx}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors ${selectedClass(idx)}`}
                    onMouseEnter={() => setSelectedIndex(idx)}>
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-foreground">{u.display_name}</span>
                    <span className="text-xs text-muted-foreground">• {u.status}</span>
                  </button>
                );
              })}
            </div>
          )}

          {results.messages.length > 0 && (
            <div className="p-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">Messages</p>
              {results.messages.map(m => {
                const idx = getNextIndex();
                const ch = channels.find(c => c.id === m.channel_id);
                return (
                  <button key={m.id} data-result-index={idx}
                    className={`w-full text-left px-2 py-2 rounded-md hover:bg-muted transition-colors ${selectedClass(idx)}`}
                    onClick={() => executeItem(flatItems.find(i => i.kind === 'message' && i.id === m.id)!)}
                    onMouseEnter={() => setSelectedIndex(idx)}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-foreground">{m.user_display_name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        in #{ch?.name} · {format(new Date(m.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {highlightText(m.content, searchQuery)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}