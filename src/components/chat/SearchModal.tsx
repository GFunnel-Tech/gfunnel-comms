import { useEffect, useMemo } from 'react';
import { useChatContext } from './ChatContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Hash, MessageSquare, User } from 'lucide-react';
import { format } from 'date-fns';
import { demoMessages } from '@/data/chat-demo-data';

export function SearchModal() {
  const { searchOpen, setSearchOpen, searchQuery, setSearchQuery, channels, users, setActiveChannelId, setThreadParentId } = useChatContext();

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

  const results = useMemo(() => {
    if (!searchQuery.trim()) return { messages: [], channels: [], people: [] };
    const q = searchQuery.toLowerCase();
    return {
      messages: demoMessages.filter(m => m.type === 'text' && m.content.toLowerCase().includes(q)).slice(0, 8),
      channels: channels.filter(c => (c.type === 'public' || c.type === 'private') && c.name.toLowerCase().includes(q)),
      people: users.filter(u => u.display_name.toLowerCase().includes(q)),
    };
  }, [searchQuery, channels, users]);

  const hasResults = results.messages.length > 0 || results.channels.length > 0 || results.people.length > 0;

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search messages, channels, people..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {searchQuery.trim() && !hasResults && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results for "{searchQuery}"
            </div>
          )}

          {results.channels.length > 0 && (
            <div className="p-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">Channels</p>
              {results.channels.map(ch => (
                <button key={ch.id} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors"
                  onClick={() => { setActiveChannelId(ch.id); setSearchOpen(false); setSearchQuery(''); }}>
                  <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-foreground">{ch.name}</span>
                  {ch.description && <span className="text-xs text-muted-foreground truncate">— {ch.description}</span>}
                </button>
              ))}
            </div>
          )}

          {results.people.length > 0 && (
            <div className="p-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">People</p>
              {results.people.map(u => (
                <button key={u.id} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-foreground">{u.display_name}</span>
                  <span className="text-xs text-muted-foreground">{u.email}</span>
                </button>
              ))}
            </div>
          )}

          {results.messages.length > 0 && (
            <div className="p-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">Messages</p>
              {results.messages.map(m => {
                const ch = channels.find(c => c.id === m.channel_id);
                return (
                  <button key={m.id} className="w-full text-left px-2 py-2 rounded-md hover:bg-muted transition-colors"
                    onClick={() => { setActiveChannelId(m.channel_id); setSearchOpen(false); setSearchQuery(''); }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-foreground">{m.user_display_name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        in #{ch?.name} · {format(new Date(m.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{m.content}</p>
                  </button>
                );
              })}
            </div>
          )}

          {!searchQuery.trim() && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Type to search messages, channels, and people
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
