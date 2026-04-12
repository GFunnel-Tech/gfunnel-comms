import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const EMOJI_CATEGORIES = [
  { label: '😀', name: 'Smileys', emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐'] },
  { label: '👋', name: 'Gestures', emojis: ['👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤝','🙏'] },
  { label: '❤️', name: 'Hearts', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝'] },
  { label: '🎉', name: 'Celebration', emojis: ['🎉','🎊','🎈','🎆','🎇','🧨','✨','🎀','🎁','🏆','🥇','🥈','🥉','⭐','🌟','💫','🔥','💥','💯','🎯','🚀','💪','👑','💎'] },
  { label: '📎', name: 'Objects', emojis: ['📎','📌','📍','🔗','💡','🔔','📢','📣','💬','💭','🗯️','📝','📋','📊','📈','📉','🗂️','📁','📂','🗃️','📅','📆','🗓️','⏰','⏳','⌛','🔒','🔓','🔑','🗝️'] },
  { label: '👀', name: 'Common', emojis: ['👀','💀','☠️','🫠','😈','👹','👺','🤡','💩','👻','💤','💦','🫧','🕳️','🌈','☀️','🌙','⚡','❄️','🔥','💧','🌊'] },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const filteredEmojis = search
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis)
    : EMOJI_CATEGORIES[activeCategory].emojis;

  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-2 w-72 bg-card border border-border rounded-lg shadow-xl z-50">
      {/* Search */}
      <div className="p-2 border-b border-border">
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search emoji..."
          className="w-full bg-muted/30 border border-border rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex gap-0.5 px-2 pt-1.5 border-b border-border pb-1.5">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              className={cn(
                'text-sm px-1.5 py-0.5 rounded transition-colors',
                activeCategory === i ? 'bg-primary/15' : 'hover:bg-muted'
              )}
              onClick={() => setActiveCategory(i)}
              title={cat.name}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="p-2 h-48 overflow-y-auto">
        {!search && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-0.5">
            {EMOJI_CATEGORIES[activeCategory].name}
          </p>
        )}
        <div className="grid grid-cols-8 gap-0.5">
          {filteredEmojis.map(emoji => (
            <button
              key={emoji}
              className="w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-muted transition-colors"
              onClick={() => { onSelect(emoji); onClose(); }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
