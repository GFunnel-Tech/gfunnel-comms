import { useState } from 'react';
import { useChatContext } from './ChatContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { getGFunnelContext } from '@/lib/gfunnel-bridge';

export function AIPanel() {
  const { rightPanel, setRightPanel, channels, activeChannelId, activeWorkspaceName } = useChatContext();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  if (rightPanel !== 'ai') return null;

  const channel = channels.find(c => c.id === activeChannelId);

  const handleAsk = async () => {
    if (!query.trim() || loading) return;
    const q = query.trim();
    const newMessages = [...messages, { role: 'user' as const, content: q }];
    setMessages(newMessages);
    setQuery('');
    setLoading(true);

    // Build conversation history for API
    const apiMessages = newMessages.map(m => ({
      role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
      content: m.content
    }));

    // Build system prompt with real workspace context from bridge
    const gfunnelCtx = getGFunnelContext();
    const workspaceName = gfunnelCtx?.workspace_name ?? activeWorkspaceName ?? 'your workspace';
    const workspaceType = gfunnelCtx?.workspace_type ?? 'personal';

    const systemPrompt = `You are GFunnel AI, a business assistant integrated into GFunnel Chat.
Current workspace: ${workspaceName} (${workspaceType})
Current channel: #${channel?.name ?? 'general'}
${channel?.description ? `Channel description: ${channel.description}` : ''}
${channel?.department ? `Department: ${channel.department}` : ''}

You help with business strategy, operations, sales, marketing, and team communication
within GFunnel's nine-department framework. Be direct, concise, and action-oriented.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: apiMessages,
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`API error: ${response.status}`);
      }

      // Add empty AI message to stream into
      setMessages(prev => [...prev, { role: 'ai', content: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content_block_delta' && data.delta?.text) {
              fullText += data.delta.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'ai', content: fullText };
                return updated;
              });
            }
          } catch { /* skip malformed chunks */ }
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col shrink-0">
      <div className="h-12 px-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-info" />
          <h3 className="font-heading font-semibold text-sm text-foreground">GFunnel AI</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRightPanel('none')}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Context sources */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Context Sources</p>
            <div className="space-y-1 text-xs">
              <label className="flex items-center gap-2 text-foreground/70">
                <input type="checkbox" defaultChecked className="rounded" />
                This channel (last 50 msgs)
              </label>
              <label className="flex items-center gap-2 text-foreground/70">
                <input type="checkbox" defaultChecked className="rounded" />
                Workspace: {getGFunnelContext()?.workspace_name ?? activeWorkspaceName}
              </label>
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="rounded" />
                CRM Pipeline
              </label>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-6">
              <Sparkles className="w-8 h-8 text-info mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">Ask me anything about your workspace</p>
              <div className="space-y-2">
                {[
                  'Summarize the last 20 messages',
                  'What should I focus on today?',
                  'Draft a follow-up message',
                ].map(prompt => (
                  <button key={prompt}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                    onClick={() => { setQuery(prompt); }}>
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'flex justify-end' : ''}>
                <div className={`max-w-full rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-8'
                    : 'bg-info/10 border border-info/20 text-foreground'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content.split(/(\*\*.*?\*\*)/g).map((part, j) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j}>{part.slice(2, -2)}</strong>;
                      }
                      return part;
                    })}
                  </div>
                  {msg.role === 'ai' && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-info/20">
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-info">
                        Insert into channel
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground">
                        Copy
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center gap-2 text-info text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Thinking...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* AI Composer */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
            placeholder="Ask anything..."
            className="flex-1 bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-info"
          />
          <Button size="icon" className="h-9 w-9 bg-info text-white hover:bg-info/80"
            disabled={!query.trim() || loading} onClick={handleAsk}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
