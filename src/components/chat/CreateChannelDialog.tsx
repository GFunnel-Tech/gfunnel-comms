import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Hash, Lock, Megaphone, Sparkles } from 'lucide-react';
import type { ChannelType } from '@/data/chat-types';

const CHANNEL_TYPES: { value: ChannelType; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'public', label: 'Public', desc: 'Anyone in the workspace can join', icon: <Hash className="w-4 h-4" /> },
  { value: 'private', label: 'Private', desc: 'Only invited members can access', icon: <Lock className="w-4 h-4" /> },
  { value: 'announcement', label: 'Announcement', desc: 'Only admins can post', icon: <Megaphone className="w-4 h-4" /> },
  { value: 'automation', label: 'AI / Automation', desc: 'For AI assistants and automation bots', icon: <Sparkles className="w-4 h-4" /> },
];

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { name: string; description: string; type: ChannelType; emoji: string }) => void;
}

export function CreateChannelDialog({ open, onOpenChange, onCreate }: CreateChannelDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChannelType>('public');
  const [emoji, setEmoji] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim().toLowerCase().replace(/\s+/g, '-'),
      description: description.trim(),
      type,
      emoji: emoji || (type === 'automation' ? '✨' : '#'),
    });
    setName('');
    setDescription('');
    setType('public');
    setEmoji('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Create a channel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Channel type selector */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {CHANNEL_TYPES.map(ct => (
                <button
                  key={ct.value}
                  onClick={() => setType(ct.value)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border p-3 text-left transition-all text-sm',
                    type === ct.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card hover:bg-accent text-foreground'
                  )}
                >
                  <span className="shrink-0">{ct.icon}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-xs">{ct.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{ct.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="channel-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="channel-name"
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                placeholder="🎯"
                className="w-12 text-center px-1"
                maxLength={2}
              />
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. marketing-ideas"
                className="flex-1"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="channel-desc" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description (optional)</Label>
            <Textarea
              id="channel-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's this channel about?"
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>Create Channel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
