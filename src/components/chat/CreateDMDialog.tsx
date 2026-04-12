import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Search, Check, MessageSquare } from 'lucide-react';
import type { ChatUser } from '@/data/chat-types';

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  dnd: 'bg-red-500',
  offline: 'bg-muted-foreground/40',
};

interface CreateDMDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: ChatUser[];
  currentUserId: string;
  onCreateDM: (userIds: string[]) => void;
}

export function CreateDMDialog({ open, onOpenChange, users, currentUserId, onCreateDM }: CreateDMDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const otherUsers = useMemo(
    () => users.filter(u => u.id !== currentUserId),
    [users, currentUserId]
  );

  const filtered = useMemo(
    () => otherUsers.filter(u =>
      u.display_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    ),
    [otherUsers, search]
  );

  const toggleUser = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreate = () => {
    if (selectedIds.length === 0) return;
    onCreateDM(selectedIds);
    setSearch('');
    setSelectedIds([]);
    onOpenChange(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) { setSearch(''); setSelectedIds([]); }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            New Direct Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
              autoFocus
            />
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedIds.map(id => {
                const u = otherUsers.find(u => u.id === id);
                if (!u) return null;
                return (
                  <button key={id} onClick={() => toggleUser(id)}
                    className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium hover:bg-primary/20 transition-colors">
                    {u.display_name}
                    <span className="text-primary/60">✕</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="max-h-48 overflow-y-auto space-y-0.5 -mx-1 px-1">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No users found</p>
            )}
            {filtered.map(u => {
              const selected = selectedIds.includes(u.id);
              return (
                <button key={u.id} onClick={() => toggleUser(u.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors',
                    selected ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
                  )}>
                  <div className="relative shrink-0">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] bg-secondary font-semibold">
                        {u.display_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className={cn('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background', statusColors[u.status])} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">{u.display_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                  </div>
                  {selected && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={selectedIds.length === 0}>
            {selectedIds.length > 1 ? 'Create Group DM' : 'Start Chat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
