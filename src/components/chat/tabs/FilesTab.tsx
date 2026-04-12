import { useMemo } from 'react';
import { useChatContext } from '../ChatContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Image, Film, Music, Archive, File, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function getFileIcon(fileType?: string) {
  if (!fileType) return <File className="w-5 h-5" />;
  if (fileType.startsWith('image/')) return <Image className="w-5 h-5" />;
  if (fileType.startsWith('video/')) return <Film className="w-5 h-5" />;
  if (fileType.startsWith('audio/')) return <Music className="w-5 h-5" />;
  if (fileType.includes('pdf')) return <FileText className="w-5 h-5" />;
  if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="w-5 h-5" />;
  return <File className="w-5 h-5" />;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// Generate demo files from messages that have context_links or specific content
function generateDemoFiles(channelId: string) {
  const demoFiles = [
    { id: 'f1', name: 'Q2-Dashboard-Mockup.png', type: 'image/png', size: 2457600, sharedBy: 'Sarah Chen', date: '2026-04-12T07:05:00Z', channelId: 'ch-general' },
    { id: 'f2', name: 'Design-System-Docs.pdf', type: 'application/pdf', size: 1843200, sharedBy: 'Sarah Chen', date: '2026-04-12T08:00:00Z', channelId: 'ch-general' },
    { id: 'f3', name: 'Redis-Config-Update.json', type: 'application/json', size: 4096, sharedBy: 'Jordan Lee', date: '2026-04-12T07:25:00Z', channelId: 'ch-general' },
    { id: 'f4', name: 'Onboarding-Flow-v2.fig', type: 'application/fig', size: 5242880, sharedBy: 'Cameron G.', date: '2026-04-12T08:15:00Z', channelId: 'ch-general' },
    { id: 'f5', name: 'CRM-Pipeline-Q2.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 358400, sharedBy: 'Cameron G.', date: '2026-04-12T05:30:00Z', channelId: 'ch-revenue' },
    { id: 'f6', name: 'Meta-Ads-Report.pdf', type: 'application/pdf', size: 921600, sharedBy: 'Tim Miller', date: '2026-04-12T05:45:00Z', channelId: 'ch-revenue' },
    { id: 'f7', name: 'v2.4.1-release-notes.md', type: 'text/markdown', size: 8192, sharedBy: 'Jordan Lee', date: '2026-04-12T06:30:00Z', channelId: 'ch-tech' },
    { id: 'f8', name: 'integration-test-results.log', type: 'text/plain', size: 16384, sharedBy: 'Alex Rivera', date: '2026-04-12T06:45:00Z', channelId: 'ch-tech' },
    { id: 'f9', name: 'Company-All-Hands-Deck.pptx', type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 12582912, sharedBy: 'Cameron G.', date: '2026-04-10T09:00:00Z', channelId: 'ch-announce' },
    { id: 'f10', name: 'board-game-night.jpg', type: 'image/jpeg', size: 614400, sharedBy: 'Tim Miller', date: '2026-04-11T12:10:00Z', channelId: 'ch-random' },
  ];
  return demoFiles.filter(f => f.channelId === channelId);
}

export function FilesTab() {
  const { activeChannelId } = useChatContext();

  const files = useMemo(() => generateDemoFiles(activeChannelId), [activeChannelId]);

  if (files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-muted flex items-center justify-center">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No files shared</p>
          <p className="text-xs text-muted-foreground max-w-[240px]">
            Files shared in this channel will appear here for easy access.
          </p>
        </div>
      </div>
    );
  }

  const images = files.filter(f => f.type.startsWith('image/'));
  const documents = files.filter(f => !f.type.startsWith('image/'));

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-5">
        {/* Images section */}
        {images.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Images ({images.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {images.map(file => (
                <div key={file.id} className="group relative aspect-square rounded-lg bg-muted border border-border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <Image className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate">{file.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents section */}
        {documents.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Documents ({documents.length})
            </p>
            <div className="space-y-1">
              {documents.map(file => (
                <div key={file.id} className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    file.type.includes('pdf') ? 'bg-destructive/10 text-destructive' :
                    file.type.includes('spreadsheet') || file.type.includes('xlsx') ? 'bg-green-500/10 text-green-600' :
                    file.type.includes('presentation') || file.type.includes('pptx') ? 'bg-orange-500/10 text-orange-600' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {file.sharedBy} · {formatFileSize(file.size)} · {format(new Date(file.date), 'MMM d')}
                    </p>
                  </div>
                  <Download className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
