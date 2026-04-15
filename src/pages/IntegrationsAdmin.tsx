import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Plus, MessageSquare, Phone, Send, Instagram, Linkedin, Radio, Webhook,
  Settings2, Trash2, Power, PowerOff, ExternalLink, Shield, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Provider = 'whatsapp' | 'telegram' | 'facebook' | 'instagram' | 'linkedin' | 'sms' | 'slack' | 'custom_webhook';

interface Integration {
  id: string;
  workspace_id: string;
  provider: Provider;
  display_name: string;
  config: Record<string, any>;
  credentials_secret_name: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const PROVIDERS: { id: Provider; label: string; icon: React.ReactNode; color: string; description: string; configFields: { key: string; label: string; placeholder: string; type?: string }[] }[] = [
  {
    id: 'whatsapp', label: 'WhatsApp', icon: <Phone className="w-5 h-5" />, color: 'bg-green-500/10 text-green-600 border-green-500/20',
    description: 'Connect your WhatsApp Business API to receive and send messages.',
    configFields: [
      { key: 'phone_number_id', label: 'Phone Number ID', placeholder: 'From Meta Business dashboard' },
      { key: 'business_account_id', label: 'Business Account ID', placeholder: 'Your WABA ID' },
      { key: 'display_phone', label: 'Display Phone Number', placeholder: '+1 234 567 8900' },
    ],
  },
  {
    id: 'telegram', label: 'Telegram', icon: <Send className="w-5 h-5" />, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    description: 'Connect a Telegram bot to route messages into your workspace.',
    configFields: [
      { key: 'bot_username', label: 'Bot Username', placeholder: '@YourBotName' },
      { key: 'bot_id', label: 'Bot ID', placeholder: 'Numeric bot ID' },
    ],
  },
  {
    id: 'facebook', label: 'Facebook Messenger', icon: <MessageSquare className="w-5 h-5" />, color: 'bg-blue-600/10 text-blue-600 border-blue-600/20',
    description: 'Connect a Facebook Page to receive Messenger conversations.',
    configFields: [
      { key: 'page_id', label: 'Page ID', placeholder: 'Your Facebook Page ID' },
      { key: 'page_name', label: 'Page Name', placeholder: 'My Business Page' },
    ],
  },
  {
    id: 'instagram', label: 'Instagram DMs', icon: <Instagram className="w-5 h-5" />, color: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    description: 'Route Instagram Direct Messages into your chat workspace.',
    configFields: [
      { key: 'instagram_account_id', label: 'Instagram Account ID', placeholder: 'Linked Instagram account' },
      { key: 'page_id', label: 'Linked Facebook Page ID', placeholder: 'Required for IG Messaging API' },
    ],
  },
  {
    id: 'linkedin', label: 'LinkedIn Messages', icon: <Linkedin className="w-5 h-5" />, color: 'bg-sky-600/10 text-sky-700 border-sky-600/20',
    description: 'Connect LinkedIn messaging for professional conversations.',
    configFields: [
      { key: 'organization_id', label: 'Organization ID', placeholder: 'LinkedIn Company ID' },
    ],
  },
  {
    id: 'slack', label: 'Slack', icon: <MessageSquare className="w-5 h-5" />, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    description: 'Bidirectional Slack integration — receive and send messages via a custom Slack app.',
    configFields: [
      { key: 'team_id', label: 'Slack Team ID', placeholder: 'T0123456789' },
      { key: 'bot_user_id', label: 'Bot User ID', placeholder: 'U0123456789' },
      { key: 'app_id', label: 'App ID', placeholder: 'A0123456789' },
    ],
  },
  {
    id: 'sms', label: 'SMS / Twilio', icon: <Radio className="w-5 h-5" />, color: 'bg-red-500/10 text-red-500 border-red-500/20',
    description: 'Send and receive SMS messages via Twilio or compatible providers.',
    configFields: [
      { key: 'phone_number', label: 'Twilio Phone Number', placeholder: '+1 234 567 8900' },
      { key: 'account_sid', label: 'Account SID', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
    ],
  },
  {
    id: 'custom_webhook', label: 'Custom Webhook', icon: <Webhook className="w-5 h-5" />, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    description: 'Connect any platform via a custom webhook endpoint.',
    configFields: [
      { key: 'webhook_url', label: 'Inbound Webhook URL', placeholder: 'Will be generated after creation' },
      { key: 'label', label: 'Source Label', placeholder: 'e.g. Intercom, Drift' },
    ],
  },
];

// Default workspace for demo mode
const WORKSPACE_ID = 'ws-acme';

export default function IntegrationsAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editIntegration, setEditIntegration] = useState<Integration | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [formData, setFormData] = useState<{ display_name: string; config: Record<string, string>; credentials_secret_name: string }>({
    display_name: '', config: {}, credentials_secret_name: '',
  });

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['channel-integrations'],
    queryFn: async () => {
      const { data, error } = await getSupabaseClient()
        .from('channel_integrations')
        .select('*')
        .eq('workspace_id', WORKSPACE_ID)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Integration[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: { provider: Provider; display_name: string; config: Record<string, string>; credentials_secret_name: string }) => {
      const { data: { user } } = await getSupabaseClient().auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await getSupabaseClient().from('channel_integrations').insert({
        workspace_id: WORKSPACE_ID,
        provider: input.provider,
        display_name: input.display_name,
        config: input.config,
        credentials_secret_name: input.credentials_secret_name || null,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-integrations'] });
      toast.success('Integration added');
      closeDialogs();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (input: { id: string; display_name: string; config: Record<string, string>; credentials_secret_name: string }) => {
      const { error } = await getSupabaseClient().from('channel_integrations').update({
        display_name: input.display_name,
        config: input.config,
        credentials_secret_name: input.credentials_secret_name || null,
      }).eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-integrations'] });
      toast.success('Integration updated');
      closeDialogs();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await getSupabaseClient().from('channel_integrations').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-integrations'] });
      toast.success('Status updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabaseClient().from('channel_integrations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-integrations'] });
      toast.success('Integration removed');
    },
  });

  function closeDialogs() {
    setAddDialogOpen(false);
    setEditIntegration(null);
    setSelectedProvider(null);
    setFormData({ display_name: '', config: {}, credentials_secret_name: '' });
  }

  function openEdit(integration: Integration) {
    setEditIntegration(integration);
    setSelectedProvider(integration.provider);
    setFormData({
      display_name: integration.display_name,
      config: (integration.config || {}) as Record<string, string>,
      credentials_secret_name: integration.credentials_secret_name || '',
    });
  }

  function handleSave() {
    if (!selectedProvider) return;
    if (editIntegration) {
      updateMutation.mutate({ id: editIntegration.id, ...formData });
    } else {
      createMutation.mutate({ provider: selectedProvider, ...formData });
    }
  }

  const providerMeta = (id: Provider) => PROVIDERS.find(p => p.id === id)!;
  const configFields = selectedProvider ? providerMeta(selectedProvider).configFields : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold font-['Sora']">Channel Integrations</h1>
            <p className="text-xs text-muted-foreground">Connect messaging platforms to your workspace</p>
          </div>
          <Button className="ml-auto gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4" /> Add Integration
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Active integrations */}
        {isLoading ? (
          <div className="text-center text-muted-foreground py-16 text-sm">Loading integrations...</div>
        ) : integrations.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Webhook className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-1">No integrations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Connect a messaging platform to start routing conversations into your workspace.</p>
            <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add your first integration
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {integrations.map(integration => {
              const meta = providerMeta(integration.provider);
              return (
                <Card key={integration.id} className={cn('p-4 flex items-center gap-4 transition-colors', !integration.is_active && 'opacity-60')}>
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border', meta.color)}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">{integration.display_name}</h3>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', integration.is_active ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground')}>
                        {integration.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{meta.label} · Added {new Date(integration.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={integration.is_active}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: integration.id, is_active: checked })}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(integration)}>
                      <Settings2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => {
                      if (confirm('Remove this integration? Connected contacts will be disconnected.')) {
                        deleteMutation.mutate(integration.id);
                      }
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Available providers */}
        <div className="mt-12">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Available Platforms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PROVIDERS.map(provider => {
              const connected = integrations.filter(i => i.provider === provider.id).length;
              return (
                <Card
                  key={provider.id}
                  className="p-4 hover:border-primary/30 transition-colors cursor-pointer group"
                  onClick={() => {
                    setSelectedProvider(provider.id);
                    setFormData({ display_name: provider.label, config: {}, credentials_secret_name: '' });
                    setAddDialogOpen(true);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center border', provider.color)}>
                      {provider.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{provider.label}</h3>
                        {connected > 0 && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{connected} connected</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{provider.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={addDialogOpen || !!editIntegration} onOpenChange={(open) => { if (!open) closeDialogs(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProvider && (
                <div className={cn('w-7 h-7 rounded-md flex items-center justify-center border', providerMeta(selectedProvider).color)}>
                  {providerMeta(selectedProvider).icon}
                </div>
              )}
              {editIntegration ? `Edit ${formData.display_name}` : selectedProvider ? `Connect ${providerMeta(selectedProvider).label}` : 'Select Provider'}
            </DialogTitle>
          </DialogHeader>

          {!selectedProvider ? (
            <div className="grid grid-cols-2 gap-2 py-2">
              {PROVIDERS.map(p => (
                <button key={p.id} onClick={() => {
                  setSelectedProvider(p.id);
                  setFormData({ display_name: p.label, config: {}, credentials_secret_name: '' });
                }} className={cn('flex items-center gap-2 p-3 rounded-lg border hover:border-primary/30 transition-colors text-left', p.color)}>
                  {p.icon}
                  <span className="text-sm font-medium text-foreground">{p.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 py-2 pr-2">
                <div>
                  <Label className="text-xs">Display Name</Label>
                  <Input
                    value={formData.display_name}
                    onChange={e => setFormData(f => ({ ...f, display_name: e.target.value }))}
                    placeholder="e.g. Main WhatsApp Line"
                    className="mt-1"
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Provider Configuration</h4>
                  {configFields.map(field => (
                    <div key={field.key} className="mb-3">
                      <Label className="text-xs">{field.label}</Label>
                      <Input
                        value={formData.config[field.key] || ''}
                        onChange={e => setFormData(f => ({ ...f, config: { ...f.config, [field.key]: e.target.value } }))}
                        placeholder={field.placeholder}
                        className="mt-1 font-mono text-xs"
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Credentials
                  </h4>
                  <div>
                    <Label className="text-xs">Secret Name (in vault)</Label>
                    <Input
                      value={formData.credentials_secret_name}
                      onChange={e => setFormData(f => ({ ...f, credentials_secret_name: e.target.value }))}
                      placeholder="e.g. WA_TOKEN_ws-acme"
                      className="mt-1 font-mono text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Reference to the secret stored in your backend vault. No credentials are stored in the database.</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          {selectedProvider && (
            <DialogFooter>
              <Button variant="outline" onClick={closeDialogs}>Cancel</Button>
              <Button onClick={handleSave} disabled={!formData.display_name || createMutation.isPending || updateMutation.isPending}>
                {editIntegration ? 'Save Changes' : 'Connect'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
