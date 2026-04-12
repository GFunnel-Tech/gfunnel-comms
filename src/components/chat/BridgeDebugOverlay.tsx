import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGFunnel } from '@/hooks/useGFunnel';
import { Bug, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogEntry {
  time: string;
  message: string;
  level: 'info' | 'warn' | 'error';
}

export function BridgeDebugOverlay() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { user, isEmbedded, bridgeTimedOut, loading } = useAuth();
  const gfunnel = useGFunnel('chat');

  // Intercept console logs with [GFunnel Bridge] prefix
  useEffect(() => {
    const origInfo = console.info;
    const origWarn = console.warn;
    const origError = console.error;
    const ts = () => new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const push = (msg: string, level: LogEntry['level']) =>
      setLogs((prev) => [...prev.slice(-49), { time: ts(), message: msg, level }]);

    console.info = (...args: unknown[]) => {
      origInfo(...args);
      const s = args.map(String).join(' ');
      if (s.includes('[GFunnel Bridge]')) push(s.replace('[GFunnel Bridge] ', ''), 'info');
    };
    console.warn = (...args: unknown[]) => {
      origWarn(...args);
      const s = args.map(String).join(' ');
      if (s.includes('[GFunnel')) push(s.replace(/\[GFunnel.*?\]\s*/, ''), 'warn');
    };
    console.error = (...args: unknown[]) => {
      origError(...args);
      const s = args.map(String).join(' ');
      if (s.includes('[GFunnel')) push(s.replace(/\[GFunnel.*?\]\s*/, ''), 'error');
    };

    return () => { console.info = origInfo; console.warn = origWarn; console.error = origError; };
  }, []);

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed bottom-3 right-3 z-[9999] p-2 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm border border-border/50"
        title="Bridge Debug"
      >
        <Bug className="w-4 h-4" />
      </button>
    );
  }

  const statusColor = loading
    ? 'bg-yellow-500'
    : bridgeTimedOut
    ? 'bg-red-500'
    : user
    ? 'bg-green-500'
    : 'bg-orange-500';

  const statusLabel = loading
    ? 'Connecting...'
    : bridgeTimedOut
    ? 'Timed out'
    : user
    ? 'Authenticated'
    : 'No session';

  return (
    <div className="fixed bottom-3 right-3 z-[9999] w-80 rounded-lg border border-border bg-background/95 backdrop-blur-md shadow-xl text-xs font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Bug className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-semibold text-foreground text-[11px]">Bridge Debug</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-muted rounded">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
          <button onClick={() => setVisible(false)} className="p-1 hover:bg-muted rounded">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Status grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 px-3 py-2 text-[10px]">
        <Row label="Status" value={<span className="flex items-center gap-1.5"><span className={cn('w-2 h-2 rounded-full', statusColor)} />{statusLabel}</span>} />
        <Row label="Mode" value={isEmbedded ? 'Embedded (iframe)' : 'Standalone'} />
        <Row label="User" value={user?.email?.split('@')[0] ?? '—'} />
        <Row label="Auth" value={isEmbedded ? 'SSO' : user ? 'Direct' : '—'} />
        <Row label="Workspace" value={gfunnel.workspaceId?.slice(0, 8) ?? '—'} />
        <Row label="Bridge ready" value={gfunnel.isReady ? '✓' : '✗'} />
        <Row label="Theme" value={gfunnel.theme} />
        <Row label="Has token" value={gfunnel.authToken ? '✓' : '✗'} />
      </div>

      {/* Log stream */}
      {expanded && (
        <div className="border-t border-border/50 max-h-40 overflow-y-auto px-3 py-2 space-y-0.5">
          {logs.length === 0 && <p className="text-muted-foreground text-[10px]">No bridge events yet</p>}
          {logs.map((l, i) => (
            <div key={i} className={cn('text-[10px] leading-tight', l.level === 'error' ? 'text-red-400' : l.level === 'warn' ? 'text-yellow-400' : 'text-muted-foreground')}>
              <span className="text-muted-foreground/60">{l.time}</span> {l.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground truncate">{value}</span>
    </>
  );
}
