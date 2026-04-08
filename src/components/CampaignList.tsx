import { Campaign } from '@/data/types';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Phone, Send, Eye, MessageCircle, CheckCircle } from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'bg-success/20 text-success border-success/30',
  paused: 'bg-warning/20 text-warning border-warning/30',
  draft: 'bg-muted text-muted-foreground border-border',
  completed: 'bg-info/20 text-info border-info/30',
};

const typeLabels: Record<string, string> = {
  recall: 'Recall',
  reactivation: 'Reactivation',
  reminder: 'Reminder',
  review_request: 'Review Request',
  post_service: 'Post-Service',
  nurture: 'Nurture',
  announcement: 'Announcement',
  promotion: 'Promotion',
};

const channelIcons: Record<string, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />,
  sms: <MessageSquare className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  multi: <Send className="w-4 h-4" />,
};

interface CampaignListProps {
  campaigns: Campaign[];
}

export function CampaignList({ campaigns }: CampaignListProps) {
  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => (
        <div
          key={campaign.id}
          className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">{campaign.name}</h3>
                <Badge variant="outline" className={statusColors[campaign.status]}>
                  {campaign.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  {channelIcons[campaign.channel]}
                  {campaign.channel}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-secondary text-xs">
                  {typeLabels[campaign.type] || campaign.type}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Stat icon={<Send className="w-3.5 h-3.5" />} label="Sent" value={campaign.total_sent} />
            <Stat icon={<Eye className="w-3.5 h-3.5" />} label="Opened" value={campaign.total_opened} />
            <Stat icon={<MessageCircle className="w-3.5 h-3.5" />} label="Replied" value={campaign.total_responded} />
            <Stat icon={<CheckCircle className="w-3.5 h-3.5" />} label="Converted" value={campaign.total_converted} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-semibold text-foreground">{value.toLocaleString()}</p>
    </div>
  );
}
