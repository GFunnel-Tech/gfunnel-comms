import { CommTemplate } from '@/data/types';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

const categoryColors: Record<string, string> = {
  recall: 'bg-primary/20 text-primary border-primary/30',
  reminder: 'bg-info/20 text-info border-info/30',
  reactivation: 'bg-warning/20 text-warning border-warning/30',
  review_request: 'bg-success/20 text-success border-success/30',
  post_service: 'bg-destructive/20 text-destructive border-destructive/30',
  nurture: 'bg-accent/20 text-accent-foreground border-accent/30',
};

interface TemplateListProps {
  templates: CommTemplate[];
}

export function TemplateList({ templates }: TemplateListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {templates.map((template) => (
        <div
          key={template.id}
          className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {template.channel === 'email' ? (
                <Mail className="w-4 h-4 text-muted-foreground" />
              ) : (
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
              )}
              <h3 className="font-medium text-foreground text-sm">{template.name}</h3>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Badge variant="outline" className={`text-xs mb-3 ${categoryColors[template.category] || ''}`}>
            {template.category}
          </Badge>

          {template.subject && (
            <p className="text-xs text-muted-foreground mb-1">
              <span className="font-medium">Subject:</span> {template.subject}
            </p>
          )}

          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {template.body}
          </p>
        </div>
      ))}
    </div>
  );
}
