import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Plus, FolderOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { WorkspaceConnection, WorkspaceFolder } from '@/data/workspace-data';

interface WorkspaceRailProps {
  workspaces: WorkspaceConnection[];
  activeWorkspaceId: string;
  onSwitch: (ws: WorkspaceConnection) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  folders: WorkspaceFolder[];
  onCreateFolder: (name: string, workspaceIds: string[]) => void;
  onRemoveFromFolder: (folderId: string, workspaceId: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function WorkspaceIcon({
  ws, isActive, onSwitch, draggable, onDragStart, onDragOver, onDrop, onDragEnd, dropTarget,
}: {
  ws: WorkspaceConnection;
  isActive: boolean;
  onSwitch: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  dropTarget?: boolean;
}) {
  const hasUnread = ws.total_unread > 0 && !isActive;
  const hasMention = ws.has_mention && !isActive;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          draggable={draggable}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
          className={cn(
            'relative w-10 h-10 rounded-xl transition-all duration-200 group flex items-center justify-center',
            isActive
              ? 'ring-2 ring-primary ring-offset-2 ring-offset-[hsl(var(--rail-background))]'
              : 'opacity-60 hover:opacity-100 hover:rounded-lg',
            dropTarget && 'scale-110 ring-2 ring-accent ring-offset-1 ring-offset-[hsl(var(--rail-background))]'
          )}
          style={{ backgroundColor: ws.workspace_color }}
          onClick={onSwitch}
        >
          {isActive && (
            <span className="absolute -left-[11px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
          )}
          {!isActive && hasUnread && (
            <span className="absolute -left-[11px] top-1/2 -translate-y-1/2 w-[3px] h-2 rounded-r-full bg-[hsl(var(--rail-foreground))] group-hover:h-5 transition-all" />
          )}
          {ws.workspace_logo_url ? (
            <img src={ws.workspace_logo_url} alt={ws.workspace_name} className="w-full h-full rounded-xl object-cover" />
          ) : (
            <span className="text-white text-xs font-bold select-none">
              {getInitials(ws.workspace_name)}
            </span>
          )}
          {hasMention && (
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center border-2 border-[hsl(var(--rail-background))]">!</span>
          )}
          {hasUnread && !hasMention && (
            <span className="absolute -bottom-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1 border-2 border-[hsl(var(--rail-background))]">
              {ws.total_unread > 99 ? '99+' : ws.total_unread}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-medium">
        <p>{ws.workspace_name}</p>
        {hasUnread && <p className="text-xs text-muted-foreground">{ws.total_unread} unread</p>}
      </TooltipContent>
    </Tooltip>
  );
}

function FolderItem({
  folder, workspaces, activeWorkspaceId, onSwitch, onRemoveFromFolder, onDeleteFolder,
  onDragOver, onDrop,
}: {
  folder: WorkspaceFolder;
  workspaces: WorkspaceConnection[];
  activeWorkspaceId: string;
  onSwitch: (ws: WorkspaceConnection) => void;
  onRemoveFromFolder: (folderId: string, wsId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const folderWorkspaces = folder.workspaceIds
    .map(id => workspaces.find(ws => ws.workspace_id === id))
    .filter(Boolean) as WorkspaceConnection[];

  const totalUnread = folderWorkspaces.reduce((sum, ws) => sum + ws.total_unread, 0);
  const hasActive = folderWorkspaces.some(ws => ws.workspace_id === activeWorkspaceId);
  const colors = folderWorkspaces.slice(0, 4).map(ws => ws.workspace_color);

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              onDragOver={onDragOver}
              onDrop={onDrop}
              className={cn(
                'relative w-10 h-10 rounded-xl transition-all duration-200 group flex items-center justify-center',
                hasActive
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-[hsl(var(--rail-background))]'
                  : 'opacity-70 hover:opacity-100 hover:rounded-lg'
              )}
              style={{ backgroundColor: 'hsl(var(--rail-foreground) / 0.15)' }}
            >
              {hasActive && (
                <span className="absolute -left-[11px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
              )}
              {/* Mini grid preview of workspace colors */}
              <div className="grid grid-cols-2 gap-0.5 w-6 h-6">
                {colors.map((color, i) => (
                  <div key={i} className="rounded-sm" style={{ backgroundColor: color }} />
                ))}
                {colors.length < 4 && Array.from({ length: 4 - colors.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="rounded-sm" style={{ backgroundColor: 'hsl(var(--rail-foreground) / 0.1)' }} />
                ))}
              </div>
              {totalUnread > 0 && !hasActive && (
                <span className="absolute -bottom-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1 border-2 border-[hsl(var(--rail-background))]">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          <p>{folder.name}</p>
          <p className="text-xs text-muted-foreground">{folderWorkspaces.length} workspaces</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent side="right" align="start" className="w-auto p-2 space-y-1.5">
        <div className="flex items-center justify-between gap-4 px-1 mb-1">
          <span className="text-xs font-semibold text-foreground">{folder.name}</span>
          <Button variant="ghost" size="sm" className="h-5 text-[10px] text-destructive px-1.5"
            onClick={() => onDeleteFolder(folder.id)}>
            Ungroup
          </Button>
        </div>
        {folderWorkspaces.map(ws => (
          <div key={ws.workspace_id} className="flex items-center gap-2 group/item">
            <button
              className={cn(
                'flex items-center gap-2 flex-1 rounded-md px-2 py-1.5 text-sm transition-colors',
                ws.workspace_id === activeWorkspaceId
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-accent'
              )}
              onClick={() => onSwitch(ws)}
            >
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                style={{ backgroundColor: ws.workspace_color }}>
                {getInitials(ws.workspace_name)}
              </span>
              <span className="truncate">{ws.workspace_name}</span>
              {ws.total_unread > 0 && ws.workspace_id !== activeWorkspaceId && (
                <span className="ml-auto bg-primary text-primary-foreground text-[9px] font-bold rounded-full px-1.5 min-w-[16px] text-center">
                  {ws.total_unread}
                </span>
              )}
            </button>
            <button
              className="opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-foreground text-[10px] px-1 transition-opacity"
              onClick={() => onRemoveFromFolder(folder.id, ws.workspace_id)}
              title="Remove from folder"
            >
              ✕
            </button>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function WorkspaceRail({
  workspaces, activeWorkspaceId, onSwitch, onReorder, folders, onCreateFolder, onRemoveFromFolder, onDeleteFolder,
}: WorkspaceRailProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [folderPrompt, setFolderPrompt] = useState<{ wsIdA: string; wsIdB: string } | null>(null);
  const [folderName, setFolderName] = useState('');
  const dragSourceRef = useRef<string | null>(null);

  // Which workspace IDs are inside folders
  const folderedIds = new Set(folders.flatMap(f => f.workspaceIds));
  const ungrouped = workspaces.filter(ws => !folderedIds.has(ws.workspace_id));

  // Build render order: folders first (at position of first member), then ungrouped
  type RailItem = { type: 'workspace'; ws: WorkspaceConnection; index: number } | { type: 'folder'; folder: WorkspaceFolder };
  const railItems: RailItem[] = [];
  const usedFolderIds = new Set<string>();

  workspaces.forEach((ws, i) => {
    const folder = folders.find(f => f.workspaceIds.includes(ws.workspace_id));
    if (folder) {
      if (!usedFolderIds.has(folder.id)) {
        usedFolderIds.add(folder.id);
        railItems.push({ type: 'folder', folder });
      }
    } else {
      railItems.push({ type: 'workspace', ws, index: i });
    }
  });

  const handleDragStart = useCallback((wsId: string, index: number) => (e: React.DragEvent) => {
    dragSourceRef.current = wsId;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', wsId);
  }, []);

  const handleDragOver = useCallback((targetIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetIndex(targetIndex);
  }, []);

  const handleDragOverFolder = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDropOnFolder = useCallback((folderId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const wsId = e.dataTransfer.getData('text/plain');
    if (!wsId) return;
    const folder = folders.find(f => f.id === folderId);
    if (folder && !folder.workspaceIds.includes(wsId)) {
      // Add to existing folder
      const updated = folders.map(f =>
        f.id === folderId ? { ...f, workspaceIds: [...f.workspaceIds, wsId] } : f
      );
      // Persist via delete + recreate hack (we only have create/remove)
      onDeleteFolder(folderId);
      const target = updated.find(f => f.id === folderId)!;
      onCreateFolder(target.name, target.workspaceIds);
    }
    setDragIndex(null);
    setDropTargetIndex(null);
    dragSourceRef.current = null;
  }, [folders, onDeleteFolder, onCreateFolder]);

  const handleDrop = useCallback((targetIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const sourceWsId = e.dataTransfer.getData('text/plain');
    if (!sourceWsId) return;

    const targetItem = railItems[targetIndex];

    // Dropping on another ungrouped workspace → prompt to create folder
    if (targetItem?.type === 'workspace' && targetItem.ws.workspace_id !== sourceWsId) {
      setFolderPrompt({ wsIdA: sourceWsId, wsIdB: targetItem.ws.workspace_id });
    } else if (dragIndex !== null && dragIndex !== targetIndex) {
      // Reorder
      const sourceIdx = workspaces.findIndex(w => w.workspace_id === sourceWsId);
      const targetWs = targetItem?.type === 'workspace' ? targetItem.ws : null;
      const targetIdx = targetWs ? workspaces.findIndex(w => w.workspace_id === targetWs.workspace_id) : -1;
      if (sourceIdx >= 0 && targetIdx >= 0) {
        onReorder(sourceIdx, targetIdx);
      }
    }

    setDragIndex(null);
    setDropTargetIndex(null);
    dragSourceRef.current = null;
  }, [railItems, dragIndex, workspaces, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDropTargetIndex(null);
    dragSourceRef.current = null;
  }, []);

  const handleCreateFolder = () => {
    if (!folderPrompt || !folderName.trim()) return;
    onCreateFolder(folderName.trim(), [folderPrompt.wsIdA, folderPrompt.wsIdB]);
    setFolderPrompt(null);
    setFolderName('');
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="w-14 flex flex-col items-center py-3 gap-2 shrink-0"
        style={{ backgroundColor: 'hsl(var(--rail-background))' }}
      >
        {railItems.map((item, idx) => {
          if (item.type === 'folder') {
            return (
              <FolderItem
                key={item.folder.id}
                folder={item.folder}
                workspaces={workspaces}
                activeWorkspaceId={activeWorkspaceId}
                onSwitch={onSwitch}
                onRemoveFromFolder={onRemoveFromFolder}
                onDeleteFolder={onDeleteFolder}
                onDragOver={handleDragOverFolder}
                onDrop={handleDropOnFolder(item.folder.id)}
              />
            );
          }

          return (
            <WorkspaceIcon
              key={item.ws.workspace_id}
              ws={item.ws}
              isActive={item.ws.workspace_id === activeWorkspaceId}
              onSwitch={() => onSwitch(item.ws)}
              draggable
              onDragStart={handleDragStart(item.ws.workspace_id, idx)}
              onDragOver={handleDragOver(idx)}
              onDrop={handleDrop(idx)}
              onDragEnd={handleDragEnd}
              dropTarget={dropTargetIndex === idx && dragSourceRef.current !== item.ws.workspace_id}
            />
          );
        })}

        {/* Divider */}
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--rail-foreground) / 0.3)' }} />

        {/* Add workspace */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center transition-all hover:rounded-lg hover:border-primary hover:text-primary"
              style={{ borderColor: 'hsl(var(--rail-foreground) / 0.3)', color: 'hsl(var(--rail-foreground) / 0.5)' }}>
              <Plus className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Add a Workspace</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Create folder dialog */}
      <Dialog open={!!folderPrompt} onOpenChange={open => { if (!open) { setFolderPrompt(null); setFolderName(''); } }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              Create Folder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Group these workspaces into a folder:
            </p>
            {folderPrompt && (
              <div className="flex items-center gap-2">
                {[folderPrompt.wsIdA, folderPrompt.wsIdB].map(wsId => {
                  const ws = workspaces.find(w => w.workspace_id === wsId);
                  if (!ws) return null;
                  return (
                    <span key={wsId} className="flex items-center gap-1.5 bg-accent rounded-md px-2 py-1 text-xs">
                      <span className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold text-white"
                        style={{ backgroundColor: ws.workspace_color }}>
                        {getInitials(ws.workspace_name)}
                      </span>
                      {ws.workspace_name}
                    </span>
                  );
                })}
              </div>
            )}
            <Input
              placeholder="Folder name"
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setFolderPrompt(null); setFolderName(''); }}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={!folderName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
