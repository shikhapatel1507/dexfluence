import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth, useLogoutMutation } from "@/hooks/use-auth";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Eye, Heart, Share2, DollarSign, TrendingUp, Video, Users,
  ArrowRight, Zap, LogOut, Settings, BarChart3, Play, Star,
} from "lucide-react";
import type { Video as VideoType, Campaign } from "@shared/schema";

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toString();
}

const weeklyData = [
  { day: "Mon", videos: 42, revenue: 1240 },
  { day: "Tue", videos: 58, revenue: 1890 },
  { day: "Wed", videos: 51, revenue: 1520 },
  { day: "Thu", videos: 74, revenue: 2340 },
  { day: "Fri", videos: 88, revenue: 2810 },
  { day: "Sat", videos: 63, revenue: 1960 },
  { day: "Sun", videos: 47, revenue: 1420 },
];

export default function BrandDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const logout = useLogoutMutation();

  const { data: videos, isLoading: videosLoading } = useQuery<VideoType[]>({ queryKey: ["/api/videos"] });
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({ queryKey: ["/api/campaigns"] });
  const { data: brand } = useQuery<{ websiteUrl: string; instagramHandle: string; brandName: string }>({
    queryKey: ["/api/settings/brand"],
  });

  const postedVideos = (videos ?? []).filter(v => v.status === "posted");
  const totalViews = (videos ?? []).reduce((s, v) => s + v.views, 0);
  const totalRevenue = (videos ?? []).reduce((s, v) => s + v.revenue, 0);
  const totalLikes = (videos ?? []).reduce((s, v) => s + v.likes, 0);
  const avgEngagement = postedVideos.length > 0
    ? postedVideos.reduce((s, v) => s + (v.views > 0 ? ((v.likes + v.shares) / v.views) * 100 : 0), 0) / postedVideos.length
    : 0;

  const topPosts = [...(videos ?? [])]
    .filter(v => v.status === "posted" && v.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const displayName = brand?.brandName || user?.username?.split("@")[0] || "Brand";
  const initials = displayName.slice(0, 2).toUpperCase();

  const tooltipStyle = {
    contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 },
    labelStyle: { color: "hsl(var(--foreground))", fontWeight: 600 },
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <div className="text-sm font-bold leading-none">Dexfluence</div>
              <div className="text-xs text-muted-foreground mt-0.5">Brand Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/dashboard")} data-testid="button-go-to-platform">
              <BarChart3 className="w-3.5 h-3.5" /> Platform
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/settings")} data-testid="button-brand-settings">
              <Settings className="w-3.5 h-3.5" /> Settings
            </Button>
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block">{displayName}</span>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={() => logout.mutate()} data-testid="button-logout">
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="heading-brand-dashboard">
              Welcome back, {displayName} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here's how your content is performing across all channels
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {(campaigns ?? []).filter(c => c.status === "active").length} active campaigns
            </Badge>
            <Button className="gap-1.5 text-sm" onClick={() => navigate("/billing")} data-testid="button-upgrade-plan">
              <Zap className="w-3.5 h-3.5" /> Upgrade Plan
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Eye, label: "Total Views", value: fmt(totalViews), color: "text-blue-500", bg: "bg-blue-500/10" },
            { icon: DollarSign, label: "Total Revenue", value: `$${totalRevenue.toFixed(0)}`, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { icon: Video, label: "Posts Published", value: fmt(postedVideos.length), color: "text-violet-500", bg: "bg-violet-500/10" },
            { icon: TrendingUp, label: "Avg Engagement", value: `${avgEngagement.toFixed(1)}%`, color: "text-orange-500", bg: "bg-orange-500/10" },
          ].map(s => (
            <Card key={s.label} className="border-card-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  {videosLoading ? <Skeleton className="h-6 w-16" /> : <div className="text-lg font-bold">{s.value}</div>}
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="border-card-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Weekly Videos Published</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="videos" name="Videos" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-card-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Weekly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${v}`, "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="border-card-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Top Performing Posts
              </CardTitle>
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => navigate("/performance")} data-testid="button-view-all-posts">
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {videosLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : topPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Play className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No posted videos yet. Generate your first batch!
              </div>
            ) : (
              <div className="space-y-2">
                {topPosts.map((v, i) => {
                  const campaign = (campaigns ?? []).find(c => c.id === v.campaignId);
                  const er = v.views > 0 ? ((v.likes + v.shares) / v.views * 100).toFixed(1) : "0";
                  return (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate("/performance")}
                      data-testid={`brand-post-row-${v.id}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{v.hook}</p>
                        {campaign && <p className="text-xs text-muted-foreground">{campaign.name}</p>}
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 text-xs text-right">
                        <div>
                          <div className="font-semibold">{fmt(v.views)}</div>
                          <div className="text-muted-foreground">views</div>
                        </div>
                        <div>
                          <div className="font-semibold text-emerald-500">${v.revenue.toFixed(0)}</div>
                          <div className="text-muted-foreground">revenue</div>
                        </div>
                        <div>
                          <div className="font-semibold text-orange-500">{er}%</div>
                          <div className="text-muted-foreground">eng.</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Active Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
              ) : (
                <div className="space-y-2">
                  {(campaigns ?? []).slice(0, 4).map(c => {
                    const maxGmv = Math.max(...(campaigns ?? []).map(x => x.gmv), 1);
                    const pct = (c.gmv / maxGmv) * 100;
                    return (
                      <div key={c.id} data-testid={`brand-campaign-${c.id}`}>
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="font-medium truncate flex-1 mr-2">{c.name}</span>
                          <span className="text-emerald-500 font-semibold">${fmt(c.gmv)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <Button variant="outline" size="sm" className="w-full text-xs mt-2 gap-1" onClick={() => navigate("/campaigns")} data-testid="button-view-campaigns">
                    Manage campaigns <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-card-border bg-gradient-to-br from-primary/5 to-violet-500/5 border-primary/20">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full gap-3 min-h-[200px]">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Ready to scale?</p>
                <p className="text-xs text-muted-foreground mt-1">Upgrade to generate 500+ videos/day with 50 AI agents</p>
              </div>
              <Button className="gap-1.5 text-sm" onClick={() => navigate("/billing")} data-testid="button-brand-upgrade">
                <ArrowRight className="w-3.5 h-3.5" /> View Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
