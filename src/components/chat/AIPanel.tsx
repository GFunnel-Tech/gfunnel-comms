import { useState } from 'react';
import { useChatContext } from './ChatContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';

export function AIPanel() {
  const { rightPanel, setRightPanel, channels, activeChannelId } = useChatContext();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  if (rightPanel !== 'ai') return null;

  const channel = channels.find(c => c.id === activeChannelId);

  const handleAsk = () => {
    if (!query.trim()) return;
    const q = query.trim();
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setQuery('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: `Based on the recent activity in #${channel?.name}, here's what I found:\n\n**Summary:** The team has been focused on shipping the Q2 dashboard updates, resolving a Redis caching issue, and preparing for the AI Assistant module launch next week.\n\n**Key Action Items:**\n• Review the design system docs at /docs/design\n• Test the AI Assistant on staging\n• Follow up on the Meta Ads campaign budget increase`
      }]);
      setLoading(false);
    }, 1500);
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
                Workspace: Acme Corp
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
