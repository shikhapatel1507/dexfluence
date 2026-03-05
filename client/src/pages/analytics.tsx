import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, FunnelChart, Funnel, LabelList,
} from "recharts";
import type { Campaign, Video } from "@shared/schema";
import { TrendingUp, DollarSign, Video as VideoIcon, Users, Flame, Award, Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function exportAnalyticsCsv(campaigns: Campaign[], videos: Video[]) {
  const campHeader = ["Campaign", "Product", "Niche", "Status", "Videos Generated", "Videos Posted", "Total Views", "GMV", "Daily Target"];
  const campRows = campaigns.map(c => [
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.product.replace(/"/g, '""')}"`,
    c.niche, c.status, c.videosGenerated, c.videosPosted, c.totalViews,
    c.gmv.toFixed(2), c.dailyTarget,
  ].join(","));
  const vidHeader = ["Hook", "Status", "Views", "Likes", "Shares", "Revenue", "Engagement Rate"];
  const vidRows = videos.map(v => {
    const eng = v.views > 0 ? ((v.likes + v.shares) / v.views * 100).toFixed(2) : "0";
    return [`"${v.hook.replace(/"/g, '""')}"`, v.status, v.views, v.likes, v.shares, v.revenue.toFixed(2), eng].join(",");
  });
  const csv = [
    "=== CAMPAIGNS ===",
    campHeader.join(","), ...campRows,
    "", "=== VIDEOS ===",
    vidHeader.join(","), ...vidRows,
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dexfluence-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toString();
}
function fmtCurrency(n: number): string {
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(1) + "k";
  return "$" + n.toFixed(0);
}

const weeklyData = [
  { day: "Mon", videos: 280, views: 420000, gmv: 12400, engagement: 3.1 },
  { day: "Tue", videos: 320, views: 510000, gmv: 15800, engagement: 3.4 },
  { day: "Wed", videos: 295, views: 390000, gmv: 11200, engagement: 2.9 },
  { day: "Thu", videos: 380, views: 680000, gmv: 21600, engagement: 3.8 },
  { day: "Fri", videos: 410, views: 720000, gmv: 24100, engagement: 4.1 },
  { day: "Sat", videos: 290, views: 480000, gmv: 14800, engagement: 3.3 },
  { day: "Sun", videos: 260, views: 360000, gmv: 10900, engagement: 2.8 },
];

const monthlyGmv = [
  { month: "Sep", gmv: 42000 }, { month: "Oct", gmv: 68000 },
  { month: "Nov", gmv: 91000 }, { month: "Dec", gmv: 118000 },
  { month: "Jan", gmv: 134000 }, { month: "Feb", gmv: 156000 },
];

const funnelData = [
  { name: "Videos Generated", value: 3538, fill: "hsl(var(--primary))" },
  { name: "Videos Posted", value: 3190, fill: "hsl(var(--primary) / 0.8)" },
  { name: "Views", value: 2640000, fill: "hsl(var(--primary) / 0.6)" },
  { name: "Clicks to Shop", value: 52800, fill: "hsl(var(--primary) / 0.4)" },
  { name: "Purchases", value: 5640, fill: "hsl(var(--primary) / 0.25)" },
];

const topHooks = [
  { rank: 1, hook: "POV: I tried this serum for 30 days and my dark spots are GONE", views: "284k", cvr: "4.2%", revenue: "$8,420" },
  { rank: 2, hook: "The $30 serum that replaced my $200 one", views: "196k", cvr: "3.8%", revenue: "$6,100" },
  { rank: 3, hook: "Dermatologist approved? I put it to the test", views: "178k", cvr: "3.6%", revenue: "$5,340" },
  { rank: 4, hook: "This pre-workout hit different — my honest review", views: "152k", cvr: "3.1%", revenue: "$4,890" },
  { rank: 5, hook: "Morning routine that gave me glass skin in 2 weeks", views: "134k", cvr: "2.9%", revenue: "$4,200" },
  { rank: 6, hook: "Why every girl needs this in their skincare routine", views: "118k", cvr: "2.7%", revenue: "$3,840" },
  { rank: 7, hook: "Rating viral TikTok products so you don't have to", views: "104k", cvr: "2.4%", revenue: "$3,120" },
];

const hourlyEngagement = [
  { hour: "6am", rate: 2.1 }, { hour: "8am", rate: 2.8 },
  { hour: "10am", rate: 3.2 }, { hour: "12pm", rate: 3.6 },
  { hour: "2pm", rate: 3.1 }, { hour: "4pm", rate: 3.8 },
  { hour: "6pm", rate: 4.4 }, { hour: "8pm", rate: 4.1 },
  { hour: "10pm", rate: 3.3 }, { hour: "12am", rate: 2.2 },
];

const dayEngagement = [
  { day: "Mon", rate: 3.1 }, { day: "Tue", rate: 3.4 },
  { day: "Wed", rate: 2.9 }, { day: "Thu", rate: 3.8 },
  { day: "Fri", rate: 4.1 }, { day: "Sat", rate: 3.3 },
  { day: "Sun", rate: 2.8 },
];

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalVideosGenerated: number; totalVideosPosted: number;
    totalViews: number; totalGmv: number; activeAgents: number;
    activeCampaigns: number; dailyVideos: number; costSaved: number;
  }>({ queryKey: ["/api/stats"] });
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({ queryKey: ["/api/campaigns"] });
  const { data: videos } = useQuery<Video[]>({ queryKey: ["/api/videos"] });

  const totalCostPaid = (stats?.totalVideosGenerated ?? 0) * 6.5;
  const roas = stats?.totalGmv && totalCostPaid ? (stats.totalGmv / totalCostPaid).toFixed(1) : "0";
  const topVideo = videos?.sort((a, b) => b.views - a.views)[0];

  const chartTooltipStyle = {
    contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 },
    labelStyle: { color: "hsl(var(--foreground))", fontWeight: 600 },
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-analytics">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Deep performance metrics across all campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportAnalyticsCsv(campaigns ?? [], videos ?? [])} data-testid="button-export-analytics">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
          <Badge variant="secondary" className="text-xs">Last 30 days</Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: VideoIcon, label: "Videos Generated", value: statsLoading ? null : fmt(stats?.totalVideosGenerated ?? 0), sub: "All time", color: "text-primary" },
          { icon: TrendingUp, label: "Total Views", value: statsLoading ? null : fmt(stats?.totalViews ?? 0), sub: "Organic reach", color: "text-violet-500" },
          { icon: DollarSign, label: "Total GMV", value: statsLoading ? null : fmtCurrency(stats?.totalGmv ?? 0), sub: "Revenue attributed", color: "text-emerald-500" },
          { icon: Users, label: "ROAS", value: statsLoading ? null : `${roas}x`, sub: "Return on ad spend", color: "text-amber-500" },
        ].map((s) => (
          <Card key={s.label} className="border-card-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                  {s.value === null ? <Skeleton className="h-7 w-20" /> : <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>}
                  <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
                </div>
                <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Output + GMV Growth */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-card-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Weekly Videos Generated</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltipStyle} />
                <Bar dataKey="videos" name="Videos" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Monthly GMV Growth</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyGmv}>
                <defs>
                  <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
                <Tooltip {...chartTooltipStyle} formatter={(v: number) => [`$${(v / 1000).toFixed(1)}k`, "GMV"]} />
                <Area type="monotone" dataKey="gmv" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gmvGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {funnelData.map((step, i) => {
              const pct = i === 0 ? 100 : (step.value / funnelData[0].value) * 100;
              const dropoff = i > 0 ? (((funnelData[i - 1].value - step.value) / funnelData[i - 1].value) * 100).toFixed(0) : null;
              return (
                <div key={step.name} className="flex items-center gap-3" data-testid={`funnel-${step.name.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className="w-32 text-xs text-right text-muted-foreground">{step.name}</div>
                  <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden relative">
                    <div
                      className="h-full rounded-full flex items-center justify-end pr-3 transition-all"
                      style={{ width: `${Math.max(pct, 2)}%`, background: `hsl(var(--primary) / ${1 - i * 0.15})` }}
                    >
                      <span className="text-xs font-medium text-white">{fmt(step.value)}</span>
                    </div>
                  </div>
                  <div className="w-16 text-xs text-right">
                    {dropoff && <span className="text-destructive">-{dropoff}%</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-0.5">Post Rate</div>
              <div className="font-bold text-emerald-500">90.2%</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-0.5">Click-Through Rate</div>
              <div className="font-bold text-primary">2.0%</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-0.5">Purchase CVR</div>
              <div className="font-bold text-violet-500">10.7%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Hooks */}
      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" /> Top Performing Hooks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 w-8">#</th>
                  <th className="text-left pb-2">Hook</th>
                  <th className="text-right pb-2 px-3">Views</th>
                  <th className="text-right pb-2 px-3">CVR</th>
                  <th className="text-right pb-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topHooks.map((h) => (
                  <tr key={h.rank} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors" data-testid={`hook-row-${h.rank}`}>
                    <td className="py-2.5">
                      {h.rank <= 3
                        ? <Award className={`w-3.5 h-3.5 ${h.rank === 1 ? "text-amber-500" : h.rank === 2 ? "text-slate-400" : "text-amber-700"}`} />
                        : <span className="text-xs text-muted-foreground">{h.rank}</span>
                      }
                    </td>
                    <td className="py-2.5 pr-4 max-w-[280px]">
                      <p className="text-xs leading-snug truncate">{h.hook}</p>
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs font-medium">{h.views}</td>
                    <td className="py-2.5 px-3 text-right">
                      <Badge variant="secondary" className="text-xs">{h.cvr}</Badge>
                    </td>
                    <td className="py-2.5 text-right text-xs font-semibold text-emerald-500">{h.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Engagement by Hour + Day */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> Engagement Rate by Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={hourlyEngagement}>
                <defs>
                  <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip {...chartTooltipStyle} formatter={(v: number) => [`${v}%`, "Engagement"]} />
                <Area type="monotone" dataKey="rate" name="Engagement Rate" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#hourGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-500" /> Engagement Rate by Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dayEngagement} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 5]} />
                <Tooltip {...chartTooltipStyle} formatter={(v: number) => [`${v}%`, "Engagement"]} />
                <Bar dataKey="rate" name="Engagement Rate" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance + Cost Efficiency */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-card-border">
          <CardHeader><CardTitle className="text-sm font-semibold">Campaign GMV Performance</CardTitle></CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : (
              <div className="space-y-3">
                {campaigns?.map((c) => {
                  const maxGmv = Math.max(...(campaigns?.map(x => x.gmv) ?? [1]));
                  const pct = maxGmv > 0 ? (c.gmv / maxGmv) * 100 : 0;
                  return (
                    <div key={c.id} data-testid={`analytics-row-${c.id}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-medium truncate flex-1 mr-2">{c.name}</div>
                        <div className="text-xs font-bold text-primary">{fmtCurrency(c.gmv)}</div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-2 bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader><CardTitle className="text-sm font-semibold">Cost Efficiency Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Avg. Cost / Video", value: "$6.50", sub: "vs $75 human creator", color: "text-primary" },
                { label: "Total Spend", value: fmtCurrency(totalCostPaid), sub: "All videos generated", color: "text-foreground" },
                { label: "Budget Saved", value: fmtCurrency(stats?.costSaved ?? 0), sub: "vs. traditional content", color: "text-emerald-500" },
                { label: "Cost Reduction", value: "91%", sub: "Cheaper than human UGC", color: "text-violet-500" },
              ].map((m) => (
                <div key={m.label} className="bg-muted/30 rounded-md p-3">
                  <div className="text-xs text-muted-foreground mb-1">{m.label}</div>
                  <div className={`text-lg font-bold ${m.color}`}>{m.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.sub}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
