import { useState } from 'react';
import { useGFunnel } from '@/hooks/useGFunnel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CampaignList } from '@/components/CampaignList';
import { TemplateList } from '@/components/TemplateList';
import { MessageList } from '@/components/MessageList';
import { ReviewList } from '@/components/ReviewList';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { demoCampaigns, demoMessages, demoTemplates, demoReviews, defaultDentalConfig } from '@/data/demo-data';
import { Button } from '@/components/ui/button';
import { Megaphone, FileText, MessageSquare, Star, BarChart3, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Index = () => {
  const { isReady, isEmbedded, workspaceId } = useGFunnel('communication-hub');
  const [searchQuery, setSearchQuery] = useState('');

  if (isEmbedded && !isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const config = defaultDentalConfig;
  const personLabel = config.labels.person || 'Person';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Communication Hub</h1>
            <p className="text-sm text-muted-foreground">
              Manage outreach, reminders, reviews & {personLabel.toLowerCase()} engagement
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-1" />
              New Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
              <Megaphone className="w-4 h-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
              <FileText className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
              <MessageSquare className="w-4 h-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
              <Star className="w-4 h-4" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <CampaignList campaigns={demoCampaigns} />
          </TabsContent>

          <TabsContent value="templates">
            <TemplateList templates={demoTemplates} />
          </TabsContent>

          <TabsContent value="messages">
            <MessageList messages={demoMessages} />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewList reviews={demoReviews} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard campaigns={demoCampaigns} reviews={demoReviews} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
