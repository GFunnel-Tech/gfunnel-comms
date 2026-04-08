import { ReviewTracking } from '@/data/types';
import { Badge } from '@/components/ui/badge';
import { Star, ExternalLink, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const platformColors: Record<string, string> = {
  google: 'bg-info/20 text-info border-info/30',
  yelp: 'bg-destructive/20 text-destructive border-destructive/30',
  facebook: 'bg-primary/20 text-primary border-primary/30',
  healthgrades: 'bg-success/20 text-success border-success/30',
};

interface ReviewListProps {
  reviews: ReviewTracking[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-foreground">{review.person_name}</span>
                <Badge variant="outline" className={`text-xs ${platformColors[review.platform] || ''}`}>
                  {review.platform}
                </Badge>
                <Badge variant="outline" className={`text-xs ${
                  review.status === 'responded' ? 'bg-success/20 text-success border-success/30' :
                  review.status === 'completed' ? 'bg-info/20 text-info border-info/30' :
                  'bg-warning/20 text-warning border-warning/30'
                }`}>
                  {review.status}
                </Badge>
              </div>
              {review.rating && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < review.rating! ? 'text-warning fill-warning' : 'text-muted'}`}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
              {review.status !== 'responded' && review.rating && (
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MessageSquare className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {review.review_text && (
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">"{review.review_text}"</p>
          )}

          {review.response_text && (
            <div className="bg-secondary rounded-md p-2 text-xs text-secondary-foreground">
              <span className="font-medium">Response:</span> {review.response_text}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
