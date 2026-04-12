import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatUser } from '@/data/chat-types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MentionAutocompleteProps {
  users: ChatUser[];
  query: string; // text after @
  anchorRect: { top: number; left: number } | null;
  onSelect: (user: ChatUser) => void;
  onClose: () => void;
  visible: boolean;
}

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  dnd: 'bg-red-500',
  offline: 'bg-muted-foreground/40',
};

export function MentionAutocomplete({ users, query, anchorRect, onSelect, onClose, visible }: MentionAutocompleteProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = users.filter(u =>
    u.display_name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  // Reset active index when query or visibility changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query, visible]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const active = listRef.current.children[activeIndex] as HTMLElement;
      active?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!visible || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      onSelect(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [visible, filtered, activeIndex, onSelect, onClose]);

  useEffect(() => {
    if (visible) {
      document.addEventListener('keydown', handleKeyDown, true);
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [visible, handleKeyDown]);

  if (!visible || !anchorRect || filtered.length === 0) return null;

  return (
    <div
      className="absolute z-50 w-72 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
      style={{ bottom: '100%', left: 0, marginBottom: 4 }}
      ref={listRef}
    >
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
        People
      </div>
      {filtered.map((user, i) => (
        <button
          key={user.id}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
            i === activeIndex ? 'bg-accent' : 'hover:bg-accent/50'
          )}
          onMouseEnter={() => setActiveIndex(i)}
          onMouseDown={(e) => {
            e.preventDefault(); // prevent textarea blur
            onSelect(user);
          }}
        >
          <div className="relative shrink-0">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                {user.display_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className={cn(
              'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-popover',
              statusColors[user.status]
            )} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground truncate">{user.display_name}</span>
              {user.role === 'admin' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Admin</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
              {user.status_text && (
                <>
                  <span>{user.status_emoji || ''}</span>
                  <span className="truncate">{user.status_text}</span>
                  <span>·</span>
                </>
              )}
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </button>
      ))}
      <div className="px-3 py-1.5 border-t border-border text-[10px] text-muted-foreground">
        <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">↑↓</kbd> navigate · <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">↵</kbd> select · <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">esc</kbd> dismiss
      </div>
    </div>
  );
}
