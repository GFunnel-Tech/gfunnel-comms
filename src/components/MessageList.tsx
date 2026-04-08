import { CommMessage } from '@/data/types';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const statusColors: Record<string, string> = {
  queued: 'bg-muted text-muted-foreground',
  sent: 'bg-secondary text-secondary-foreground',
  delivered: 'bg-info/20 text-info',
  opened: 'bg-primary/20 text-primary',
  replied: 'bg-success/20 text-success',
  bounced: 'bg-destructive/20 text-destructive',
  failed: 'bg-destructive/20 text-destructive',
};

interface MessageListProps {
  messages: CommMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-2">
      {messages.slice(0, 20).map((msg) => (
        <div
          key={msg.id}
          className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-4 hover:border-primary/30 transition-colors"
        >
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            msg.direction === 'inbound' ? 'bg-success/20' : 'bg-secondary'
          }`}>
            {msg.direction === 'inbound' ? (
              <ArrowDownLeft className="w-4 h-4 text-success" />
            ) : (
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-sm text-foreground">{msg.person_name}</span>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[msg.status] || ''}`}>
                {msg.status}
              </Badge>
              <span className="text-[10px] uppercase text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                {msg.channel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{msg.content}</p>
          </div>

          <div className="text-xs text-muted-foreground flex-shrink-0">
            {msg.sent_at ? new Date(msg.sent_at).toLocaleDateString() : '—'}
          </div>
        </div>
      ))}
    </div>
  );
}
