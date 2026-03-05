import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, TrendingUp, Users, DollarSign, Zap, Calendar, Activity, Play, Pause } from "lucide-react";
import type { Campaign, Agent } from "@shared/schema";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

interface Stats {
  totalVideosGenerated: number; totalVideosPosted: number;
  totalViews: number; totalGmv: number; activeAgents: number;
  activeCampaigns: number; dailyVideos: number; costSaved: number;
}
interface ChartData {
  weeklyOutput: Array<{ day: string; videos: number; posted: number }>;
  campaignGmv: Array<{ name: string; gmv: number; views: number }>;
  viewsTrend: Array<{ day: string; views: number }>;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toString();
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  paused: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  inactive: "bg-muted text-muted-foreground",
};

const avatarColors = ["bg-blue-500", "bg-violet-500", "bg-pink-500", "bg-emerald-500",
  "bg-amber-500", "bg-cyan-500", "bg-rose-500", "bg-indigo-500"];

const ACTIVITY_EVENTS = [
  (agent: string) => `${agent} posted a new video to Instagram`,
  (agent: string) => `Kling finished generating video for ${agent}`,
  (agent: string) => `${agent} hit 10k views in 2 hours`,
  (agent: string) => `${agent} earned $340 GMV from latest post`,
  (agent: string) => `${agent} queued 5 new scripts for generation`,
  (agent: string) => `${agent} is now posting in skincare niche`,
];
const AGENT_NAMES = ["Emma Chen", "Alex Rivera", "Sofia Kim", "Jordan Blake", "Maya Patel", "Ryan Torres"];

function makeActivityEvent() {
  const agent = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
  const template = ACTIVITY_EVENTS[Math.floor(Math.random() * ACTIVITY_EVENTS.length)];
  return { id: Math.random().toString(36).slice(2), text: template(agent), time: new Date() };
}

const INITIAL_EVENTS = [
  { id: "1", text: "Emma Chen posted a new video to Instagram", time: new Date(Date.now() - 45000) },
  { id: "2", text: "Kling finished generating video for Alex Rivera", time: new Date(Date.now() - 120000) },
  { id: "3", text: "SkinGlow Serum campaign hit 500 videos this week", time: new Date(Date.now() - 240000) },
  { id: "4", text: "Sofia Kim earned $620 GMV from latest post", time: new Date(Date.now() - 360000) },
  { id: "5", text: "Jordan Blake is now posting in fitness niche", time: new Date(Date.now() - 480000) },
];

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

const POSTING_SCHEDULE = [
  { hour: "9am", agents: ["Emma Chen", "Alex Rivera"] },
  { hour: "11am", agents: ["Sofia Kim"] },
  { hour: "1pm", agents: ["Jordan Blake", "Maya Patel"] },
  { hour: "3pm", agents: ["Emma Chen", "Ryan Torres"] },
  { hour: "6pm", agents: ["Sofia Kim", "Alex Rivera", "Jordan Blake"] },
  { hour: "9pm", agents: ["Maya Patel", "Emma Chen"] },
];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({ queryKey: ["/api/stats"] });
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({ queryKey: ["/api/campaigns"] });
  const { data: chartData, isLoading: chartLoading } = useQuery<ChartData>({ queryKey: ["/api/chart-data"] });
  const { data: agents, isLoading: agentsLoading } = useQuery<Agent[]>({ queryKey: ["/api/agents"] });

  const [activityEvents, setActivityEvents] = useState(INITIAL_EVENTS);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivityEvents(prev => [makeActivityEvent(), ...prev].slice(0, 10));
    }, 8000);
    const tickerInterval = setInterval(() => setTicker(t => t + 1), 1000);
    return () => { clearInterval(interval); clearInterval(tickerInterval); };
  }, []);

  const statCards = stats ? [
    { label: "Videos Generated", value: fmt(stats.totalVideosGenerated), sub: `${fmt(stats.totalVideosPosted)} posted`, icon: Video, color: "text-violet-500" },
    { label: "Total Views", value: fmt(stats.totalViews), sub: "Organic reach", icon: TrendingUp, color: "text-blue-500" },
    { label: "Total GMV", value: `$${fmt(stats.totalGmv)}`, sub: "Revenue attributed", icon: DollarSign, color: "text-emerald-500" },
    { label: "Active Agents", value: stats.activeAgents.toString(), sub: `${stats.activeCampaigns} campaigns`, icon: Users, color: "text-orange-500" },
  ] : [];

  const tooltipStyle = {
    contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 },
    labelStyle: { color: "hsl(var(--foreground))", fontWeight: 600 },
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-dashboard">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">AI Content Factory — real-time performance overview</p>
        </div>
        <Badge variant="secondary" className="gap-1 text-xs">
          <Zap className="w-3 h-3 text-primary" /> Live
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : statCards.map((card) => (
            <Card key={card.label} className="border-card-border" data-testid={`stat-${card.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center ${card.color}`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      {/* Cost efficiency strip */}
      {stats && (
        <Card className="border-card-border bg-gradient-to-r from-primary/5 to-violet-500/5 border-primary/15">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Daily Target</p>
                <p className="text-xl font-bold">{fmt(stats.dailyVideos)}</p>
                <p className="text-xs text-muted-foreground">videos/day</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cost Per Video</p>
                <p className="text-xl font-bold">$6.50</p>
                <p className="text-xs text-muted-foreground">vs $75 human avg</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cheaper Than Human</p>
                <p className="text-xl font-bold text-emerald-500">91%</p>
                <p className="text-xs text-muted-foreground">cost reduction</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Cost Saved</p>
                <p className="text-xl font-bold">${fmt(stats.costSaved)}</p>
                <p className="text-xs text-muted-foreground">vs human creators</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Status Grid */}
      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" />
            Agent Status
            <div className="flex items-center gap-1 ml-auto">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-500 font-normal">Live</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agentsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {agents?.map((agent, i) => {
                const initials = agent.name.split(" ").map(n => n[0]).join("").slice(0, 2);
                const isActive = agent.status === "active";
                return (
                  <div
                    key={agent.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/30 ${isActive ? "border-emerald-500/20 bg-emerald-500/5" : "border-card-border bg-muted/10"}`}
                    onClick={() => navigate(`/agents/${agent.id}`)}
                    data-testid={`agent-status-${agent.id}`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-9 h-9 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold`}>
                        {initials}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${isActive ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.postsPerDay} posts/day</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {isActive
                          ? <><Play className="w-2.5 h-2.5 text-emerald-500" /><span className="text-xs text-emerald-500">Posting</span></>
                          : <><Pause className="w-2.5 h-2.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Paused</span></>
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Posting Schedule */}
      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            Today's Posting Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 overflow-x-auto pb-2">
            {POSTING_SCHEDULE.map((slot, i) => {
              const isPast = i < 3;
              const isCurrent = i === 3;
              return (
                <div key={slot.hour} className={`flex-shrink-0 rounded-lg border p-3 min-w-[90px] ${isCurrent ? "border-primary bg-primary/5" : isPast ? "border-border/50 bg-muted/20 opacity-60" : "border-card-border"}`} data-testid={`schedule-slot-${slot.hour}`}>
                  <div className={`text-xs font-semibold mb-2 ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>{slot.hour}</div>
                  <div className="space-y-1">
                    {slot.agents.map(a => (
                      <div key={a} className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCurrent ? "bg-primary animate-pulse" : isPast ? "bg-muted-foreground/40" : "bg-foreground/40"}`} />
                        <span className="text-xs truncate">{a.split(" ")[0]}</span>
                      </div>
                    ))}
                  </div>
                  {isCurrent && <Badge variant="secondary" className="text-xs mt-2 px-1">Now</Badge>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-card-border" data-testid="chart-weekly-output">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Weekly Video Output</CardTitle></CardHeader>
          <CardContent>
            {chartLoading ? <Skeleton className="h-52 w-full" /> : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={chartData?.weeklyOutput} barSize={14} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="videos" name="Generated" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="posted" name="Posted" fill="hsl(var(--primary) / 0.35)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-card-border" data-testid="chart-views-trend">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Weekly Views Trend</CardTitle></CardHeader>
          <CardContent>
            {chartLoading ? <Skeleton className="h-52 w-full" /> : (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={chartData?.viewsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [fmt(v), "Views"]} />
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-card-border lg:col-span-2" data-testid="chart-campaign-gmv">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Revenue by Campaign (GMV)</CardTitle></CardHeader>
          <CardContent>
            {chartLoading ? <Skeleton className="h-52 w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData?.campaignGmv} barSize={28} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `$${fmt(v)}`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${fmt(v)}`, "GMV"]} />
                  <Bar dataKey="gmv" name="GMV" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Campaigns + Live Activity Feed */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-card-border" data-testid="card-top-campaigns">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Top Campaigns</CardTitle></CardHeader>
          <CardContent>
            {campaignsLoading
              ? <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              : (
                <div className="space-y-2">
                  {campaigns?.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover-elevate cursor-pointer"
                      onClick={() => navigate(`/campaigns/${c.id}`)}
                      data-testid={`campaign-row-${c.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{c.name}</span>
                          <Badge variant="outline" className={`text-xs border ${statusColors[c.status] ?? statusColors.inactive}`}>{c.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{c.product}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold">${fmt(c.gmv)}</div>
                        <div className="text-xs text-muted-foreground">{fmt(c.totalViews)} views</div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card className="border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Live Activity Feed
              <div className="flex items-center gap-1 ml-auto">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-500 font-normal">Live</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {activityEvents.map((event, i) => (
                <div
                  key={event.id}
                  className={`flex items-start gap-2.5 text-xs transition-all ${i === 0 ? "animate-in fade-in-0 slide-in-from-top-2" : ""}`}
                  data-testid={`activity-event-${event.id}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground leading-snug">{event.text}</p>
                    <p className="text-muted-foreground mt-0.5">{timeAgo(event.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
