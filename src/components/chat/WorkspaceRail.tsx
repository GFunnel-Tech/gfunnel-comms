import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import type { WorkspaceConnection } from '@/data/workspace-data';

interface WorkspaceRailProps {
  workspaces: WorkspaceConnection[];
  activeWorkspaceId: string;
  onSwitch: (ws: WorkspaceConnection) => void;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function WorkspaceRail({ workspaces, activeWorkspaceId, onSwitch }: WorkspaceRailProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="w-14 flex flex-col items-center py-3 gap-2 shrink-0"
        style={{ backgroundColor: 'hsl(var(--rail-background))' }}
      >
        {workspaces.map(ws => {
          const isActive = ws.workspace_id === activeWorkspaceId;
          const hasUnread = ws.total_unread > 0 && !isActive;
          const hasMention = ws.has_mention && !isActive;

          return (
            <Tooltip key={ws.id}>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    'relative w-10 h-10 rounded-xl transition-all duration-200 group',
                    isActive
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-[hsl(var(--rail-background))]'
                      : 'opacity-60 hover:opacity-100 hover:rounded-lg'
                  )}
                  style={{ backgroundColor: ws.workspace_color }}
                  onClick={() => onSwitch(ws)}
                >
                  {/* Active indicator - left bar */}
                  {isActive && (
                    <span className="absolute -left-[11px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
                  )}

                  {/* Hover pill for non-active */}
                  {!isActive && hasUnread && (
                    <span className="absolute -left-[11px] top-1/2 -translate-y-1/2 w-[3px] h-2 rounded-r-full bg-[hsl(var(--rail-foreground))] group-hover:h-5 transition-all" />
                  )}

                  {/* Avatar content */}
                  {ws.workspace_logo_url ? (
                    <img src={ws.workspace_logo_url} alt={ws.workspace_name} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <span className="text-white text-xs font-bold select-none">
                      {getInitials(ws.workspace_name)}
                    </span>
                  )}

                  {/* Badge */}
                  {hasMention && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center border-2 border-[hsl(var(--rail-background))]">
                      !
                    </span>
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
                {hasUnread && (
                  <p className="text-xs text-muted-foreground">{ws.total_unread} unread</p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Divider */}
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--rail-foreground) / 0.3)' }} />

        {/* Add workspace button */}
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
    </TooltipProvider>
  );
}
