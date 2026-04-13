import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, MessageSquare, Pencil, Pause, Play, Zap, Calendar } from 'lucide-react';
import { DEPARTMENT_COLORS, type AIEmployee, type Department } from '@/data/chat-types';
import { cn } from '@/lib/utils';

interface AIEmployeeProfilePanelProps {
  employee: AIEmployee | null;
  onClose: () => void;
  onMessage: (employee: AIEmployee) => void;
  onEdit: (employee: AIEmployee) => void;
}

const deptBgColors: Record<string, string> = {
  'dept-revenue': 'bg-dept-revenue/20 text-dept-revenue',
  'dept-creative': 'bg-dept-creative/20 text-dept-creative',
  'dept-technology': 'bg-dept-technology/20 text-dept-technology',
  'dept-operations': 'bg-dept-operations/20 text-dept-operations',
  'dept-finance': 'bg-dept-finance/20 text-dept-finance',
  'dept-strategy': 'bg-dept-strategy/20 text-dept-strategy',
  'dept-support': 'bg-dept-support/20 text-dept-support',
  'dept-ai': 'bg-dept-ai/20 text-dept-ai',
  'dept-legal': 'bg-dept-legal/20 text-dept-legal',
};

const personalityLabels: Record<string, string> = {
  professional: 'Professional',
  friendly: 'Friendly',
  analytical: 'Analytical',
  creative: 'Creative',
  direct: 'Direct',
};

export function AIEmployeeProfilePanel({ employee, onClose, onMessage, onEdit }: AIEmployeeProfilePanelProps) {
  if (!employee) return null;

  const dept = DEPARTMENT_COLORS[employee.department as Department];
  const deptColor = dept ? deptBgColors[dept] : null;
  const createdDate = new Date(employee.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col shrink-0">
      {/* Header */}
      <div className="h-12 px-4 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="font-heading font-semibold text-sm text-foreground">AI Employee</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Avatar & Identity */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: employee.avatar_color }}
              >
                {employee.name.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-1 -right-1 text-lg leading-none">⚡</span>
            </div>
            <h4 className="font-heading font-bold text-lg text-foreground">{employee.name}</h4>
            <p className="text-sm text-muted-foreground">{employee.role}</p>
            {deptColor && (
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium mt-1', deptColor)}>
                {employee.department}
              </span>
            )}
            <div className="flex items-center gap-1 mt-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-green-600">Always available</span>
            </div>
          </div>

          {/* Message button */}
          <Button
            className="w-full"
            onClick={() => onMessage(employee)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Message {employee.name}
          </Button>

          {/* About */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">About</h5>
            <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
              <div>
                <p className="text-xs font-medium text-foreground">Expertise</p>
                <p className="text-xs text-muted-foreground">{employee.expertise_summary}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Personality</p>
                <p className="text-xs text-muted-foreground">{personalityLabels[employee.personality] ?? employee.personality}</p>
              </div>
            </div>
          </div>

          {/* Channels */}
          {employee.assigned_channel_ids.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Channels</h5>
              <div className="space-y-1">
                {employee.assigned_channel_ids.map(chId => (
                  <div key={chId} className="text-xs text-foreground px-2 py-1 rounded bg-muted/30 border border-border">
                    {chId}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Activity</h5>
            <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Messages sent</span>
                <span className="text-xs font-medium text-foreground">{employee.message_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Hired</span>
                <span className="text-xs font-medium text-foreground">{createdDate}</span>
              </div>
            </div>
          </div>

          {/* Scheduled Tasks */}
          {employee.scheduled_tasks.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Calendar className="w-3 h-3 inline mr-1" />
                Scheduled Tasks
              </h5>
              <div className="space-y-1">
                {employee.scheduled_tasks.map(task => (
                  <div key={task.id} className="p-2 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-foreground truncate">{task.prompt}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      <Zap className="w-2.5 h-2.5 inline mr-0.5" />
                      {task.cron}
                      {task.is_active ? '' : ' (paused)'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <Button variant="outline" className="w-full text-xs" onClick={() => onEdit(employee)}>
              <Pencil className="w-3.5 h-3.5 mr-1" />
              Edit Employee
            </Button>
            <Button variant="outline" className="w-full text-xs text-muted-foreground">
              {employee.is_active ? (
                <>
                  <Pause className="w-3.5 h-3.5 mr-1" />
                  Pause Employee
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1" />
                  Activate Employee
                </>
              )}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
