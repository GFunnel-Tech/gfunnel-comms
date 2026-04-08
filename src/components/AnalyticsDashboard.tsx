import { Campaign, ReviewTracking } from '@/data/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsDashboardProps {
  campaigns: Campaign[];
  reviews: ReviewTracking[];
}

const COLORS = ['hsl(24, 95%, 53%)', 'hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)'];

export function AnalyticsDashboard({ campaigns, reviews }: AnalyticsDashboardProps) {
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalSent = campaigns.reduce((s, c) => s + c.total_sent, 0);
  const totalOpened = campaigns.reduce((s, c) => s + c.total_opened, 0);
  const totalResponded = campaigns.reduce((s, c) => s + c.total_responded, 0);
  const openRate = totalSent ? Math.round((totalOpened / totalSent) * 100) : 0;
  const responseRate = totalSent ? Math.round((totalResponded / totalSent) * 100) : 0;

  const completedReviews = reviews.filter(r => r.rating);
  const avgRating = completedReviews.length
    ? (completedReviews.reduce((s, r) => s + r.rating!, 0) / completedReviews.length).toFixed(1)
    : '—';

  const campaignData = campaigns.map(c => ({
    name: c.name.length > 20 ? c.name.slice(0, 20) + '…' : c.name,
    sent: c.total_sent,
    opened: c.total_opened,
    replied: c.total_responded,
  }));

  const reviewByPlatform = reviews.reduce((acc, r) => {
    acc[r.platform] = (acc[r.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(reviewByPlatform).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Active Campaigns" value={activeCampaigns} />
        <KPICard label="Open Rate" value={`${openRate}%`} />
        <KPICard label="Response Rate" value={`${responseRate}%`} />
        <KPICard label="Avg Rating" value={avgRating} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Campaign Performance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={campaignData}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(0, 0%, 100%, 0.4)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(0, 0%, 100%, 0.4)' }} />
              <Tooltip
                contentStyle={{ background: 'hsl(230, 40%, 10%)', border: '1px solid hsl(0, 0%, 100%, 0.1)', borderRadius: 8, color: '#fff' }}
              />
              <Bar dataKey="sent" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="opened" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="replied" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Reviews by Platform</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(230, 40%, 10%)', border: '1px solid hsl(0, 0%, 100%, 0.1)', borderRadius: 8, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
