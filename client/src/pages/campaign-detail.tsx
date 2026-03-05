import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Video, TrendingUp, DollarSign, Target, Users,
  Eye, Heart, Share2, Play, Pause, Megaphone, GitBranch,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import type { Campaign, Agent, Video as VideoType, PipelineJob } from "@shared/schema";

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toString();
}
function fmtCurrency(n: number): string {
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(1) + "k";
  return "$" + n.toFixed(0);
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  paused: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  completed: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  draft: "bg-muted text-muted-foreground",
};

const videoStatusColors: Record<string, string> = {
  posted: "text-emerald-500",
  generating: "text-blue-500",
  queued: "text-amber-500",
  scripted: "text-violet-500",
  pending: "text-muted-foreground",
};

const avatarColors = ["bg-blue-500", "bg-violet-500", "bg-pink-500", "bg-emerald-500", "bg-amber-500", "bg-cyan-500", "bg-rose-500", "bg-indigo-500"];

// Generate realistic 7-day chart data for a campaign
function generateDailyData(campaign: Campaign) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day, i) => ({
    day,
    videos: Math.floor((campaign.dailyTarget * (0.8 + Math.sin(i * 0.9) * 0.15)) * (0.9 + Math.random() * 0.2)),
    gmv: Math.floor((campaign.gmv / 7) * (0.8 + Math.sin(i) * 0.2)),
    views: Math.floor((campaign.totalViews / 7) * (0.8 + Math.sin(i * 1.2) * 0.2)),
  }));
}

export default function CampaignDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: campaign, isLoading } = useQuery<Campaign>({
    queryKey: ["/api/campaigns", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${params.id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const { data: allAgents } = useQuery<Agent[]>({ queryKey: ["/api/agents"] });
  const { data: allVideos } = useQuery<VideoType[]>({ queryKey: ["/api/videos"] });
  const { data: allJobs } = useQuery<PipelineJob[]>({ queryKey: ["/api/pipeline"] });

  const toggleMutation = useMutation({
    mutationFn: async () =>
      apiRequest("PATCH", `/api/campaigns/${params.id}`, {
        status: campaign?.status === "active" ? "paused" : "active",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", params.id] });
      toast({ title: `Campaign ${campaign?.status === "active" ? "paused" : "resumed"}` });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-[1200px]">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!campaign) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-20 text-center">
        <p className="font-semibold mb-2">Campaign not found</p>
        <Button variant="outline" onClick={() => navigate("/campaigns")}>Back to Campaigns</Button>
      </div>
    );
  }

  const agents = allAgents?.filter(a => a.campaignId === campaign.id) ?? [];
  const videos = allVideos?.filter(v => v.campaignId === campaign.id) ?? [];
  const jobs = allJobs?.filter(j => j.campaignId === campaign.id) ?? [];
  const dailyData = generateDailyData(campaign);

  const postedVideos = videos.filter(v => v.status === "posted");
  const generatingVideos = videos.filter(v => v.status === "generating");
  const cvr = campaign.totalViews > 0 ? ((campaign.gmv / (campaign.totalViews * 0.015)) * 100).toFixed(1) : "0";
  const roas = campaign.gmv > 0 ? (campaign.gmv / (campaign.videosGenerated * campaign.costPerVideo)).toFixed(1) : "0";

  const stageProgress = ["Research", "Scripting", "Generating", "Review", "Posted"];
  const stageCount = stageProgress.map(s => jobs.filter(j => j.stage === s).length);
  const totalJobCount = jobs.length || 1;

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <button
        onClick={() => navigate("/campaigns")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        data-testid="button-back-campaigns"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Campaigns
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold" data-testid="heading-campaign-detail">{campaign.name}</h1>
            <Badge variant="outline" className={`text-xs border ${statusColors[campaign.status] ?? statusColors.draft}`}>
              {campaign.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Megaphone className="w-3.5 h-3.5" /> {campaign.product}</span>
            <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {campaign.niche}</span>
            <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" /> {campaign.dailyTarget} videos/day target</span>
          </div>
        </div>
        <Button
          variant={campaign.status === "active" ? "outline" : "default"}
          size="sm"
          className="gap-2"
          onClick={() => toggleMutation.mutate()}
          disabled={toggleMutation.isPending}
          data-testid="button-toggle-campaign"
        >
          {campaign.status === "active" ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Resume</>}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Videos Generated", value: fmt(campaign.videosGenerated), sub: `${fmt(campaign.videosPosted)} posted`, icon: Video, color: "text-violet-500" },
          { label: "Total Views", value: fmt(campaign.totalViews), sub: "Organic", icon: TrendingUp, color: "text-blue-500" },
          { label: "GMV", value: fmtCurrency(campaign.gmv), sub: `${roas}x ROAS`, icon: DollarSign, color: "text-emerald-500" },
          { label: "Agents", value: agents.length.toString(), sub: `${agents.filter(a => a.status === "active").length} active`, icon: Users, color: "text-orange-500" },
        ].map(s => (
          <Card key={s.label} className="border-card-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                </div>
                <s.icon className={`w-4 h-4 mt-1 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Daily Video Output (7-day)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} labelStyle={{ fontWeight: 600 }} />
                <Bar dataKey="videos" name="Videos" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Daily GMV (7-day)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="gmvGradDetail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `$${fmt(v)}`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`$${fmt(v)}`, "GMV"]} labelStyle={{ fontWeight: 600 }} />
                <Area type="monotone" dataKey="gmv" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gmvGradDetail)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline funnel */}
      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" /> Pipeline Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stageProgress.map((stage, i) => {
              const count = stageCount[i];
              const pct = totalJobCount > 0 ? (count / totalJobCount) * 100 : 0;
              const colors = ["text-blue-500", "text-violet-500", "text-pink-500", "text-amber-500", "text-emerald-500"];
              return (
                <div key={stage} className="flex items-center gap-3" data-testid={`funnel-stage-${stage.toLowerCase()}`}>
                  <div className={`w-20 text-xs font-medium ${colors[i]}`}>{stage}</div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all bg-current ${colors[i]}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                  <div className="w-8 text-xs text-right text-muted-foreground">{count}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Agents assigned */}
      {agents.length > 0 && (
        <Card className="border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" />
              Assigned Agents
              <Badge variant="secondary" className="text-xs ml-auto">{agents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {agents.map((agent, i) => {
                const initials = agent.name.split(" ").map(n => n[0]).join("").slice(0, 2);
                return (
                  <div key={agent.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30" data-testid={`agent-chip-${agent.id}`}>
                    <div className={`w-8 h-8 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.postsPerDay} posts/day</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Videos */}
      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Video className="w-4 h-4 text-violet-500" />
            Recent Videos
            <Badge variant="secondary" className="text-xs ml-auto">{videos.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No videos yet for this campaign</p>
          ) : (
            <div className="space-y-2">
              {videos.slice(0, 8).map(v => (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 text-sm" data-testid={`video-row-${v.id}`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 bg-current ${videoStatusColors[v.status] ?? "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium">{v.hook}</p>
                    {v.angle && <p className="text-xs text-muted-foreground">{v.angle}</p>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{fmt(v.views)}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{fmt(v.likes)}</span>
                    <span className="font-medium text-foreground">${v.revenue.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
