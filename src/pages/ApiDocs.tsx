import { useState, useCallback } from 'react';
import { Book, Key, Webhook, Radio, MessageSquare, Hash, Copy, Check, ChevronRight, ExternalLink, Code, Shield, Play, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

type Section = 'overview' | 'auth' | 'channels' | 'messages' | 'webhooks' | 'events';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="absolute top-2 right-2 p-1 rounded bg-muted/80 hover:bg-muted text-muted-foreground"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); toast.success('Copied!'); setTimeout(() => setCopied(false), 2000); }}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <div className="relative group rounded-lg bg-[#1e1e2e] border border-border overflow-hidden my-3">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-wider">{lang}</div>
      <CopyButton text={code} />
      <pre className="p-3 text-xs text-green-300 overflow-x-auto"><code>{code}</code></pre>
    </div>
  );
}

function EndpointRow({ method, path, desc }: { method: string; path: string; desc: string }) {
  const colors: Record<string, string> = { GET: 'bg-blue-500/20 text-blue-400', POST: 'bg-green-500/20 text-green-400', PATCH: 'bg-yellow-500/20 text-yellow-400', DELETE: 'bg-red-500/20 text-red-400' };
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors text-sm">
      <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider', colors[method] || 'bg-muted text-muted-foreground')}>{method}</span>
      <code className="text-xs text-foreground font-mono">{path}</code>
      <span className="text-xs text-muted-foreground ml-auto hidden sm:block">{desc}</span>
    </div>
  );
}

/* ─── Try It Panel ─── */
interface TryItConfig {
  method: string;
  path: string;
  defaultHeaders?: Record<string, string>;
  defaultBody?: string;
  defaultQuery?: Record<string, string>;
  description: string;
}

function TryItPanel({ config }: { config: TryItConfig }) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [body, setBody] = useState(config.defaultBody || '');
  const [queryParams, setQueryParams] = useState(
    Object.entries(config.defaultQuery || {}).map(([k, v]) => `${k}=${v}`).join('&')
  );
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<{ status: number; body: string; time: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // Extract path params like :id, :token
  const paramMatches = config.path.match(/:(\w+)/g) || [];

  const resolvedPath = paramMatches.reduce<string>((p, match) => {
    const key = match.slice(1);
    return p.replace(match, pathParams[key] || match);
  }, config.path);

  const execute = useCallback(async () => {
    setLoading(true);
    setResponse(null);
    const start = performance.now();
    try {
      const url = `${BASE_URL}${resolvedPath}${queryParams ? '?' + queryParams : ''}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
      };
      if (apiKey) headers['X-API-Key'] = apiKey;

      const opts: RequestInit = { method: config.method, headers };
      if (['POST', 'PATCH', 'PUT'].includes(config.method) && body) {
        opts.body = body;
      }

      const res = await fetch(url, opts);
      const text = await res.text();
      let formatted = text;
      try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch {}
      setResponse({ status: res.status, body: formatted, time: Math.round(performance.now() - start) });
    } catch (err: any) {
      setResponse({ status: 0, body: `Network error: ${err.message}`, time: Math.round(performance.now() - start) });
    }
    setLoading(false);
  }, [resolvedPath, queryParams, apiKey, body, config.method]);

  const statusColor = response
    ? response.status >= 200 && response.status < 300 ? 'text-green-400' 
    : response.status >= 400 ? 'text-red-400' 
    : 'text-yellow-400'
    : '';

  return (
    <div className="my-4 rounded-lg border border-primary/30 bg-primary/5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
      >
        <Play className="w-3.5 h-3.5" />
        Try it — {config.description}
        <ChevronDown className={cn('w-3.5 h-3.5 ml-auto transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-primary/20">
          {/* API Key */}
          <div className="pt-3">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="gfc_your_api_key..."
              className="w-full mt-1 px-3 py-1.5 text-xs font-mono bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Path params */}
          {paramMatches.length > 0 && (
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Path Parameters</label>
              <div className="space-y-1.5 mt-1">
                {paramMatches.map(match => {
                  const key = match.slice(1);
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <code className="text-[10px] text-primary w-16 shrink-0">:{key}</code>
                      <input
                        type="text"
                        value={pathParams[key] || ''}
                        onChange={e => setPathParams(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={`Enter ${key}...`}
                        className="flex-1 px-3 py-1.5 text-xs font-mono bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Query params */}
          {(config.defaultQuery || config.method === 'GET') && (
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Query Parameters</label>
              <input
                type="text"
                value={queryParams}
                onChange={e => setQueryParams(e.target.value)}
                placeholder="workspace_id=ws-acme&limit=50"
                className="w-full mt-1 px-3 py-1.5 text-xs font-mono bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Body */}
          {['POST', 'PATCH', 'PUT'].includes(config.method) && (
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Request Body (JSON)</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={Math.min(body.split('\n').length + 1, 10)}
                className="w-full mt-1 px-3 py-2 text-xs font-mono bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-y"
              />
            </div>
          )}

          {/* Execute button */}
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={execute} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Send Request
            </Button>
            <span className="text-[10px] text-muted-foreground font-mono">
              {config.method} {BASE_URL}{resolvedPath}{queryParams ? '?' + queryParams : ''}
            </span>
          </div>

          {/* Response */}
          {response && (
            <div className="rounded-lg bg-[#1e1e2e] border border-border overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border/50">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Response</span>
                <span className={cn('text-xs font-bold font-mono', statusColor)}>{response.status || 'ERR'}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{response.time}ms</span>
              </div>
              <pre className="p-3 text-xs text-green-300 overflow-x-auto max-h-64"><code>{response.body}</code></pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Book className="w-4 h-4" /> },
  { id: 'auth', label: 'Authentication', icon: <Shield className="w-4 h-4" /> },
  { id: 'channels', label: 'Channels', icon: <Hash className="w-4 h-4" /> },
  { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'webhooks', label: 'Webhooks', icon: <Webhook className="w-4 h-4" /> },
  { id: 'events', label: 'Events', icon: <Radio className="w-4 h-4" /> },
];

export default function ApiDocsPage() {
  const [active, setActive] = useState<Section>('overview');

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-56 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            <h1 className="text-sm font-bold">API Reference</h1>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">GFunnel Chat Platform API</p>
        </div>
        <ScrollArea className="flex-1 p-2">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors', active === s.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
              {s.icon}
              {s.label}
            </button>
          ))}
        </ScrollArea>
        <div className="p-3 border-t border-border">
          <a href="/docs/api" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ExternalLink className="w-3 h-3" /> Full docs (Markdown)
          </a>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto p-8">
          {active === 'overview' && <OverviewSection />}
          {active === 'auth' && <AuthSection />}
          {active === 'channels' && <ChannelsSection />}
          {active === 'messages' && <MessagesSection />}
          {active === 'webhooks' && <WebhooksSection />}
          {active === 'events' && <EventsSection />}
        </div>
      </ScrollArea>
    </div>
  );
}

function OverviewSection() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">GFunnel Chat API</h2>
      <p className="text-muted-foreground mb-6">A platform-style REST API for building integrations, bots, and automations — similar to Slack, Teams, and Discord APIs.</p>

      <div className="rounded-lg border border-border bg-card p-4 mb-6">
        <p className="text-xs text-muted-foreground mb-1">Base URL</p>
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono text-foreground">{BASE_URL}</code>
          <CopyButton text={BASE_URL} />
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-3">All Endpoints</h3>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-2">Channels</p>
        <EndpointRow method="GET" path="/chat-api/channels" desc="List channels" />
        <EndpointRow method="GET" path="/chat-api/channels/:id" desc="Get channel" />
        <EndpointRow method="POST" path="/chat-api/channels" desc="Create channel" />
        <EndpointRow method="PATCH" path="/chat-api/channels/:id" desc="Update channel" />
        <EndpointRow method="GET" path="/chat-api/channels/:id/messages" desc="List messages" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-3">Messages</p>
        <EndpointRow method="POST" path="/chat-api/messages" desc="Send message" />
        <EndpointRow method="PATCH" path="/chat-api/messages/:id" desc="Edit message" />
        <EndpointRow method="DELETE" path="/chat-api/messages/:id" desc="Delete message" />
        <EndpointRow method="POST" path="/chat-api/messages/:id/reactions" desc="Toggle reaction" />
        <EndpointRow method="POST" path="/chat-api/messages/:id/thread" desc="Reply in thread" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-3">Webhooks</p>
        <EndpointRow method="POST" path="/chat-api/webhooks" desc="Create webhook" />
        <EndpointRow method="POST" path="/chat-webhooks/:token" desc="Post via webhook" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-3">Events</p>
        <EndpointRow method="GET" path="/chat-events" desc="List event types" />
        <EndpointRow method="POST" path="/chat-api/events" desc="Subscribe to events" />
      </div>
    </div>
  );
}

function AuthSection() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Authentication</h2>
      <p className="text-muted-foreground mb-6">Two authentication methods: API keys for bots/integrations, JWT tokens for the web UI.</p>

      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Key className="w-4 h-4 text-primary" /> API Keys</h3>
      <p className="text-sm text-muted-foreground mb-3">API keys start with <code className="bg-muted px-1 rounded">gfc_</code> and are passed via the <code className="bg-muted px-1 rounded">X-API-Key</code> header.</p>
      <CodeBlock code={`curl -X GET \\
  -H "X-API-Key: gfc_abc123..." \\
  "${BASE_URL}/chat-api/channels?workspace_id=ws-acme"`} />

      <h4 className="text-sm font-semibold mt-4 mb-2">Creating a Key</h4>
      <CodeBlock code={`curl -X POST \\
  -H "Authorization: Bearer <jwt>" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "My Bot", "workspace_id": "ws-acme", "scopes": ["messaging", "channels"]}' \\
  "${BASE_URL}/chat-api/api-keys"`} />
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 my-4 text-xs text-foreground">
        ⚠️ The full API key is shown <strong>only once</strong> at creation. Store it securely.
      </div>

      <h4 className="text-sm font-semibold mt-4 mb-2">Available Scopes</h4>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {[['messaging', 'Send, edit, delete messages'], ['channels', 'List, create, update channels'], ['webhooks', 'Manage incoming webhooks'], ['events', 'Manage event subscriptions']].map(([scope, desc]) => (
          <div key={scope} className="rounded border border-border p-2">
            <code className="text-xs text-primary">{scope}</code>
            <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold mb-2">JWT Bearer Token</h3>
      <p className="text-sm text-muted-foreground mb-3">For browser-based access, use a Supabase auth session token:</p>
      <CodeBlock code={`curl -H "Authorization: Bearer eyJhbG..." \\
  "${BASE_URL}/chat-api/channels?workspace_id=ws-acme"`} />
    </div>
  );
}

function ChannelsSection() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Channels</h2>
      <p className="text-muted-foreground mb-6">Create, list, and manage channels. Retrieve messages from channels with pagination.</p>

      <h3 className="text-sm font-semibold mb-2">List Channels</h3>
      <CodeBlock code={`curl -H "X-API-Key: gfc_..." \\
  "${BASE_URL}/chat-api/channels?workspace_id=ws-acme"`} />
      <TryItPanel config={{
        method: 'GET',
        path: '/chat-api/channels',
        defaultQuery: { workspace_id: 'ws-acme' },
        description: 'List channels',
      }} />

      <h3 className="text-sm font-semibold mt-6 mb-2">Get Channel</h3>
      <TryItPanel config={{
        method: 'GET',
        path: '/chat-api/channels/:id',
        description: 'Get a single channel',
      }} />

      <h3 className="text-sm font-semibold mt-6 mb-2">Create Channel</h3>
      <CodeBlock lang="json" code={`{
  "name": "engineering",
  "description": "Engineering team discussions",
  "type": "public",
  "workspace_id": "ws-acme",
  "emoji": "⚙️"
}`} />
      <TryItPanel config={{
        method: 'POST',
        path: '/chat-api/channels',
        defaultBody: JSON.stringify({ name: 'test-channel', description: 'Created from API docs', type: 'public', workspace_id: 'ws-acme', emoji: '🧪' }, null, 2),
        description: 'Create a channel',
      }} />

      <h3 className="text-sm font-semibold mt-6 mb-2">List Messages (with pagination)</h3>
      <CodeBlock code={`curl -H "X-API-Key: gfc_..." \\
  "${BASE_URL}/chat-api/channels/<channel-id>/messages?limit=50&before=2025-01-15T10:00:00Z"`} />
      <TryItPanel config={{
        method: 'GET',
        path: '/chat-api/channels/:id/messages',
        defaultQuery: { limit: '20' },
        description: 'List messages in a channel',
      }} />
    </div>
  );
}

function MessagesSection() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Messages</h2>
      <p className="text-muted-foreground mb-6">Send, edit, delete messages. Toggle reactions and reply in threads.</p>

      <h3 className="text-sm font-semibold mb-2">Send Message</h3>
      <CodeBlock lang="json" code={`POST /chat-api/messages

{
  "channel_id": "uuid",
  "workspace_id": "ws-acme",
  "content": "Hello from the API! 🤖"
}`} />
      <TryItPanel config={{
        method: 'POST',
        path: '/chat-api/messages',
        defaultBody: JSON.stringify({ channel_id: '', workspace_id: 'ws-acme', content: 'Hello from the API docs! 🧪' }, null, 2),
        description: 'Send a message',
      }} />

      <h3 className="text-sm font-semibold mt-6 mb-2">Toggle Reaction</h3>
      <CodeBlock lang="json" code={`POST /chat-api/messages/<id>/reactions

{ "emoji": "👍" }`} />
      <TryItPanel config={{
        method: 'POST',
        path: '/chat-api/messages/:id/reactions',
        defaultBody: JSON.stringify({ emoji: '👍' }, null, 2),
        description: 'Toggle a reaction',
      }} />

      <h3 className="text-sm font-semibold mt-6 mb-2">Reply in Thread</h3>
      <CodeBlock lang="json" code={`POST /chat-api/messages/<parent-id>/thread

{
  "content": "Great point!",
  "workspace_id": "ws-acme"
}`} />
      <TryItPanel config={{
        method: 'POST',
        path: '/chat-api/messages/:id/thread',
        defaultBody: JSON.stringify({ content: 'Great point!', workspace_id: 'ws-acme' }, null, 2),
        description: 'Reply in a thread',
      }} />

      <h3 className="text-sm font-semibold mt-6 mb-2">Edit Message</h3>
      <TryItPanel config={{
        method: 'PATCH',
        path: '/chat-api/messages/:id',
        defaultBody: JSON.stringify({ content: 'Updated message content' }, null, 2),
        description: 'Edit a message',
      }} />

      <h3 className="text-sm font-semibold mt-6 mb-2">Delete Message</h3>
      <TryItPanel config={{
        method: 'DELETE',
        path: '/chat-api/messages/:id',
        description: 'Delete a message',
      }} />
    </div>
  );
}

function WebhooksSection() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Incoming Webhooks</h2>
      <p className="text-muted-foreground mb-6">Allow external tools (CI/CD, monitoring, CRMs) to post messages — Slack-compatible format.</p>

      <h3 className="text-sm font-semibold mb-2">1. Create a Webhook</h3>
      <CodeBlock lang="json" code={`POST /chat-api/webhooks

{
  "name": "GitHub Notifications",
  "channel_id": "uuid",
  "workspace_id": "ws-acme"
}`} />
      <TryItPanel config={{
        method: 'POST',
        path: '/chat-api/webhooks',
        defaultBody: JSON.stringify({ name: 'Test Webhook', channel_id: '', workspace_id: 'ws-acme' }, null, 2),
        description: 'Create a webhook',
      }} />
      <p className="text-xs text-muted-foreground mb-4">Response includes a <code className="bg-muted px-1 rounded">webhook_url</code> — save it, the token won't be shown again.</p>

      <h3 className="text-sm font-semibold mb-2">2. Post via Webhook (no auth needed)</h3>
      <CodeBlock code={`curl -X POST \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Build #142 passed ✅", "username": "CI Bot"}' \\
  "${BASE_URL}/chat-webhooks/<token>"`} />
      <TryItPanel config={{
        method: 'POST',
        path: '/chat-webhooks/:token',
        defaultBody: JSON.stringify({ text: 'Build #142 passed ✅', username: 'CI Bot', icon_url: '' }, null, 2),
        description: 'Post via webhook',
      }} />

      <h4 className="text-sm font-semibold mt-4 mb-2">Slack-Compatible Fields</h4>
      <div className="rounded border border-border text-xs">
        <div className="grid grid-cols-3 gap-2 p-2 border-b border-border font-semibold text-muted-foreground"><span>Field</span><span>Type</span><span>Description</span></div>
        {[['text', 'string ✅', 'Message content'], ['username', 'string', 'Display name override'], ['icon_url', 'string', 'Avatar URL override'], ['attachments', 'array', 'Slack-style attachments']].map(([f, t, d]) => (
          <div key={f} className="grid grid-cols-3 gap-2 p-2 border-b border-border last:border-0"><code>{f}</code><span className="text-muted-foreground">{t}</span><span className="text-muted-foreground">{d}</span></div>
        ))}
      </div>
    </div>
  );
}

function EventsSection() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Event Subscriptions</h2>
      <p className="text-muted-foreground mb-6">Subscribe to real-time events via HTTP callbacks — like Slack Event Subscriptions.</p>

      <h3 className="text-sm font-semibold mb-2">Available Events</h3>
      <div className="rounded border border-border text-xs mb-6">
        {[['message.created', 'New message posted'], ['message.updated', 'Message edited'], ['message.deleted', 'Message deleted'], ['reaction.added', 'Reaction added'], ['channel.created', 'Channel created'], ['member.joined', 'User joined channel'], ['thread.reply', 'Thread reply posted'], ['presence.changed', 'Presence status changed']].map(([ev, desc]) => (
          <div key={ev} className="flex justify-between p-2 border-b border-border last:border-0"><code className="text-primary">{ev}</code><span className="text-muted-foreground">{desc}</span></div>
        ))}
      </div>

      <h3 className="text-sm font-semibold mb-2">List Event Types</h3>
      <TryItPanel config={{
        method: 'GET',
        path: '/chat-events',
        description: 'List all event types',
      }} />

      <h3 className="text-sm font-semibold mt-6 mb-2">Create Subscription</h3>
      <CodeBlock lang="json" code={`POST /chat-api/events

{
  "workspace_id": "ws-acme",
  "api_key_id": "uuid",
  "callback_url": "https://your-server.com/gfunnel-events",
  "events": ["message.created", "reaction.added"]
}`} />
      <TryItPanel config={{
        method: 'POST',
        path: '/chat-api/events',
        defaultBody: JSON.stringify({ workspace_id: 'ws-acme', api_key_id: '', callback_url: 'https://example.com/events', events: ['message.created'] }, null, 2),
        description: 'Subscribe to events',
      }} />

      <h3 className="text-sm font-semibold mt-6 mb-2">Signature Verification</h3>
      <p className="text-xs text-muted-foreground mb-2">Every event includes an HMAC-SHA256 signature:</p>
      <CodeBlock lang="javascript" code={`const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto.createHmac('sha256', secret)
    .update(payload).digest('hex');
  return \`sha256=\${expected}\` === signature;
}

// Headers: X-GFunnel-Signature, X-GFunnel-Event, X-GFunnel-Timestamp`} />

      <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 mt-4 text-xs text-foreground">
        ⚠️ After <strong>10 consecutive delivery failures</strong>, the subscription is automatically disabled.
      </div>
    </div>
  );
}
