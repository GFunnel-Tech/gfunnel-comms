import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? '⌘' : 'Ctrl';

const sections = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: [`${mod}`, 'K'], label: 'Open search / command palette' },
      { keys: ['?'], label: 'Show keyboard shortcuts' },
      { keys: ['Esc'], label: 'Close panel / dialog' },
    ],
  },
  {
    title: 'Messages',
    shortcuts: [
      { keys: ['R'], label: 'Reply in thread (hover a message first)' },
      { keys: ['Enter'], label: 'Send message' },
      { keys: ['Shift', 'Enter'], label: 'New line in composer' },
    ],
  },
  {
    title: 'Composer',
    shortcuts: [
      { keys: ['/'], label: 'Open slash commands' },
      { keys: ['@'], label: 'Mention a user' },
      { keys: ['#'], label: 'Link a channel' },
      { keys: [':'], label: 'Insert emoji' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['Alt', 'P'], label: 'Toggle Plan / Build mode' },
    ],
  },
];

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-card border-border">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base font-heading">
            <Keyboard className="w-4 h-4 text-muted-foreground" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-5">
          {sections.map(section => (
            <div key={section.title}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {section.title}
              </p>
              <div className="space-y-1.5">
                {section.shortcuts.map(s => (
                  <div key={s.label} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-foreground/90">{s.label}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.keys.map((key, i) => (
                        <span key={i}>
                          <kbd className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded bg-muted border border-border text-[11px] font-mono text-muted-foreground">
                            {key}
                          </kbd>
                          {i < s.keys.length - 1 && <span className="text-[10px] text-muted-foreground mx-0.5">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border">
          <p className="text-[11px] text-muted-foreground text-center">
            Press <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">?</kbd> to toggle this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
