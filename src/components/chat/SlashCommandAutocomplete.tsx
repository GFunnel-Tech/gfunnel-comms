import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Clock, Image, BarChart3, Hash, HelpCircle } from 'lucide-react';

export interface SlashCommand {
  name: string;
  description: string;
  usage: string;
  icon: React.ReactNode;
  category: 'ai' | 'utility' | 'fun';
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    name: 'ai',
    description: 'Ask AI a question or get help with a task',
    usage: '/ai <your question>',
    icon: <Sparkles className="w-4 h-4 text-info" />,
    category: 'ai',
  },
  {
    name: 'remind',
    description: 'Set a reminder for yourself or the channel',
    usage: '/remind <time> <message>',
    icon: <Clock className="w-4 h-4 text-amber-500" />,
    category: 'utility',
  },
  {
    name: 'giphy',
    description: 'Search and share a GIF from Giphy',
    usage: '/giphy <search term>',
    icon: <Image className="w-4 h-4 text-green-500" />,
    category: 'fun',
  },
  {
    name: 'poll',
    description: 'Create a quick poll for the channel',
    usage: '/poll "<question>" "<option1>" "<option2>" ...',
    icon: <BarChart3 className="w-4 h-4 text-purple-500" />,
    category: 'utility',
  },
  {
    name: 'channel',
    description: 'Set channel topic or description',
    usage: '/channel topic <new topic>',
    icon: <Hash className="w-4 h-4 text-muted-foreground" />,
    category: 'utility',
  },
  {
    name: 'help',
    description: 'Show all available slash commands',
    usage: '/help',
    icon: <HelpCircle className="w-4 h-4 text-muted-foreground" />,
    category: 'utility',
  },
];

interface SlashCommandAutocompleteProps {
  query: string;
  visible: boolean;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

export function SlashCommandAutocomplete({ query, visible, onSelect, onClose }: SlashCommandAutocompleteProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = SLASH_COMMANDS.filter(cmd =>
    cmd.name.toLowerCase().startsWith(query.toLowerCase())
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, visible]);

  useEffect(() => {
    if (listRef.current) {
      const active = listRef.current.children[1]?.children[activeIndex] as HTMLElement;
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

  if (!visible || filtered.length === 0) return null;

  return (
    <div
      className="absolute z-50 w-80 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
      style={{ bottom: '100%', left: 0, marginBottom: 4 }}
      ref={listRef}
    >
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
        Commands matching "/{query}"
      </div>
      <div>
        {filtered.map((cmd, i) => (
          <button
            key={cmd.name}
            className={cn(
              'w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors',
              i === activeIndex ? 'bg-accent' : 'hover:bg-accent/50'
            )}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(cmd);
            }}
          >
            <div className="mt-0.5 shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center">
              {cmd.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">/{cmd.name}</span>
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded font-medium',
                  cmd.category === 'ai' ? 'bg-info/10 text-info' :
                  cmd.category === 'fun' ? 'bg-green-500/10 text-green-600' :
                  'bg-muted text-muted-foreground'
                )}>
                  {cmd.category}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{cmd.description}</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{cmd.usage}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="px-3 py-1.5 border-t border-border text-[10px] text-muted-foreground">
        <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">↑↓</kbd> navigate · <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">↵</kbd> select · <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">esc</kbd> dismiss
      </div>
    </div>
  );
}
