import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSupabaseClient } from '@/lib/supabase-context';
import { generateSystemPrompt } from '@/lib/generate-system-prompt';
import type { ChatChannel, AIEmployee, AIEmployeeFormData, AIEmployeePersonality, Department } from '@/data/chat-types';

interface HireAIEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channels: ChatChannel[];
  workspaceName: string;
  workspaceId: string;
  currentUserId: string;
  onHired: (employee: AIEmployee) => void;
}

const DEPARTMENTS: Department[] = [
  'Revenue Generation',
  'Creative & Content',
  'Technology',
  'Operations',
  'Finance',
  'Strategy & Analytics',
  'Team & Support',
  'AI & Automation',
  'Legal & Compliance',
];

const COLOR_SWATCHES = ['#F97316', '#06B6D4', '#8B5CF6', '#EC4899', '#10B981', '#3B82F6'];

const PERSONALITIES: { value: AIEmployeePersonality; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Formal, precise, and data-focused' },
  { value: 'friendly', label: 'Friendly', description: 'Warm, approachable, and encouraging' },
  { value: 'analytical', label: 'Analytical', description: 'Thorough, detail-oriented analysis' },
  { value: 'creative', label: 'Creative', description: 'Ideas-first, lateral thinking' },
  { value: 'direct', label: 'Direct', description: 'Blunt, concise, straight to the point' },
];

const RESPONSE_LENGTHS: { value: 'concise' | 'balanced' | 'detailed'; label: string; description: string }[] = [
  { value: 'concise', label: 'Concise', description: '1-3 sentences' },
  { value: 'balanced', label: 'Balanced', description: 'Paragraph-length' },
  { value: 'detailed', label: 'Detailed', description: 'Thorough with structure' },
];

const SCHEDULE_PRESETS = [
  { label: 'Every Monday 9am', cron: '0 9 * * 1' },
  { label: 'Every day 9am', cron: '0 9 * * *' },
  { label: 'Every Friday 5pm', cron: '0 17 * * 5' },
  { label: 'Custom', cron: '' },
];

const defaultForm: AIEmployeeFormData = {
  name: '',
  role: '',
  department: 'Technology',
  avatar_color: '#F97316',
  personality: 'professional',
  expertise_summary: '',
  response_length: 'balanced',
  assigned_channel_ids: [],
  respond_to_mentions: true,
  respond_to_dms: true,
  scheduled_tasks: [],
};

export function HireAIEmployeeDialog({
  open, onOpenChange, channels, workspaceName, workspaceId, currentUserId, onHired,
}: HireAIEmployeeDialogProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<AIEmployeeFormData>({ ...defaultForm });
  const [saving, setSaving] = useState(false);

  const updateForm = useCallback(<K extends keyof AIEmployeeFormData>(key: K, value: AIEmployeeFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClose = useCallback((open: boolean) => {
    if (!open) {
      setStep(1);
      setForm({ ...defaultForm });
    }
    onOpenChange(open);
  }, [onOpenChange]);

  const canNext = () => {
    if (step === 1) return form.name.trim() && form.role.trim();
    if (step === 2) return form.expertise_summary.trim();
    return true;
  };

  const handleHire = async () => {
    setSaving(true);
    try {
      const systemPrompt = generateSystemPrompt(form, workspaceName);

      const insertData = {
        workspace_id: workspaceId,
        name: form.name.trim(),
        role: form.role.trim(),
        department: form.department,
        avatar_color: form.avatar_color,
        personality: form.personality,
        expertise_summary: form.expertise_summary.trim(),
        system_prompt: systemPrompt,
        assigned_channel_ids: form.assigned_channel_ids,
        respond_to_mentions: form.respond_to_mentions,
        respond_to_dms: form.respond_to_dms,
        scheduled_tasks: form.scheduled_tasks.map((t, i) => ({
          ...t,
          id: `task-${Date.now()}-${i}`,
          last_run: null,
        })),
        created_by: currentUserId,
      };

      const { data, error } = await getSupabaseClient()
        .from('chat_ai_employees')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const employee: AIEmployee = {
        id: data.id,
        workspace_id: data.workspace_id,
        name: data.name,
        role: data.role,
        department: data.department as Department,
        avatar_color: data.avatar_color ?? '#F97316',
        personality: data.personality as AIEmployeePersonality,
        expertise_summary: data.expertise_summary,
        system_prompt: data.system_prompt,
        assigned_channel_ids: data.assigned_channel_ids ?? [],
        respond_to_mentions: data.respond_to_mentions ?? true,
        respond_to_dms: data.respond_to_dms ?? true,
        scheduled_tasks: (data.scheduled_tasks as unknown as AIEmployee['scheduled_tasks']) ?? [],
        message_count: data.message_count ?? 0,
        is_active: data.is_active ?? true,
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      onHired(employee);
      handleClose(false);
    } catch (err) {
      console.error('Failed to hire AI employee:', err);
    } finally {
      setSaving(false);
    }
  };

  const workspaceChannels = channels.filter(
    ch => ch.type !== 'dm' && ch.type !== 'group_dm'
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Hire AI Employee
            <span className="text-xs font-normal text-muted-foreground ml-auto">Step {step} of 4</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 px-1 py-2">
            {/* Step 1: Identity */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ai-name">Name</Label>
                  <Input
                    id="ai-name"
                    placeholder="e.g. Aria, Marcus, Nova..."
                    value={form.name}
                    onChange={e => updateForm('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-role">Role</Label>
                  <Input
                    id="ai-role"
                    placeholder="e.g. Revenue Analyst, Content Strategist..."
                    value={form.role}
                    onChange={e => updateForm('role', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={form.department}
                    onValueChange={v => updateForm('department', v as Department)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Avatar Color</Label>
                  <div className="flex items-center gap-2">
                    {COLOR_SWATCHES.map(color => (
                      <button
                        key={color}
                        className={cn(
                          'w-8 h-8 rounded-full transition-all',
                          form.avatar_color === color
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                            : 'opacity-60 hover:opacity-100'
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => updateForm('avatar_color', color)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Personality & Expertise */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label>Personality</Label>
                  <div className="space-y-2">
                    {PERSONALITIES.map(p => (
                      <label
                        key={p.value}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          form.personality === p.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/30'
                        )}
                      >
                        <input
                          type="radio"
                          name="personality"
                          value={p.value}
                          checked={form.personality === p.value}
                          onChange={() => updateForm('personality', p.value)}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.label}</p>
                          <p className="text-xs text-muted-foreground">{p.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-expertise">Expertise Summary</Label>
                  <Textarea
                    id="ai-expertise"
                    placeholder="Expert in sales funnels, lead scoring, revenue forecasting..."
                    value={form.expertise_summary}
                    onChange={e => updateForm('expertise_summary', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Response Length</Label>
                  <div className="flex gap-2">
                    {RESPONSE_LENGTHS.map(rl => (
                      <button
                        key={rl.value}
                        className={cn(
                          'flex-1 p-2 rounded-lg border text-center transition-colors',
                          form.response_length === rl.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/30'
                        )}
                        onClick={() => updateForm('response_length', rl.value)}
                      >
                        <p className="text-xs font-medium text-foreground">{rl.label}</p>
                        <p className="text-[10px] text-muted-foreground">{rl.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Preview & Channels */}
            {step === 3 && (
              <>
                <div className="p-3 rounded-lg border border-info/20 bg-info/5">
                  <div className="flex items-start gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: form.avatar_color }}
                    >
                      {form.name.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {form.name || 'AI Employee'}
                        <span className="text-xs text-muted-foreground ml-1">({form.role || 'Role'})</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Hi team! I&apos;m {form.name || '[name]'}, your new {form.role || '[role]'}.
                        I specialize in {form.expertise_summary || '[expertise]'}.
                        Feel free to @mention me anytime — I&apos;m always online!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Assign to Channels</Label>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {workspaceChannels.map(ch => (
                      <label key={ch.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/30 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.assigned_channel_ids.includes(ch.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              updateForm('assigned_channel_ids', [...form.assigned_channel_ids, ch.id]);
                            } else {
                              updateForm('assigned_channel_ids', form.assigned_channel_ids.filter(id => id !== ch.id));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-foreground">{ch.emoji && ch.emoji !== '#' ? ch.emoji : '#'} {ch.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Respond to @mentions</p>
                      <p className="text-xs text-muted-foreground">Auto-reply when mentioned in assigned channels</p>
                    </div>
                    <Switch
                      checked={form.respond_to_mentions}
                      onCheckedChange={v => updateForm('respond_to_mentions', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Respond to DMs</p>
                      <p className="text-xs text-muted-foreground">Accept and respond to direct messages</p>
                    </div>
                    <Switch
                      checked={form.respond_to_dms}
                      onCheckedChange={v => updateForm('respond_to_dms', v)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Scheduled Tasks */}
            {step === 4 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Optionally schedule recurring tasks for {form.name || 'this AI employee'}.
                </p>

                {form.scheduled_tasks.map((task, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Task {idx + 1}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-destructive"
                        onClick={() => {
                          updateForm('scheduled_tasks', form.scheduled_tasks.filter((_, i) => i !== idx));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <Select
                      value={task.channel_id || ''}
                      onValueChange={v => {
                        const updated = [...form.scheduled_tasks];
                        updated[idx] = { ...updated[idx], channel_id: v };
                        updateForm('scheduled_tasks', updated);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        {workspaceChannels
                          .filter(ch => form.assigned_channel_ids.includes(ch.id))
                          .map(ch => (
                            <SelectItem key={ch.id} value={ch.id}>
                              {ch.emoji && ch.emoji !== '#' ? ch.emoji : '#'} {ch.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={task.cron}
                      onValueChange={v => {
                        const updated = [...form.scheduled_tasks];
                        updated[idx] = { ...updated[idx], cron: v };
                        updateForm('scheduled_tasks', updated);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHEDULE_PRESETS.map(s => (
                          <SelectItem key={s.label} value={s.cron || 'custom'}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="What should the AI do? e.g. Summarize this week's activity..."
                      value={task.prompt}
                      onChange={e => {
                        const updated = [...form.scheduled_tasks];
                        updated[idx] = { ...updated[idx], prompt: e.target.value };
                        updateForm('scheduled_tasks', updated);
                      }}
                      rows={2}
                      className="text-xs"
                    />
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    updateForm('scheduled_tasks', [
                      ...form.scheduled_tasks,
                      { cron: '0 9 * * 1', channel_id: '', prompt: '', is_active: true },
                    ]);
                  }}
                >
                  + Add Scheduled Task
                </Button>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div>
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={saving}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => handleClose(false)} disabled={saving}>
              Cancel
            </Button>
            {step < 4 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleHire} disabled={saving || !form.name.trim()}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Hiring...
                  </>
                ) : (
                  <>Hire {form.name || 'Employee'} →</>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
