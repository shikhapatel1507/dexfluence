import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Users, Video, Eye, Heart, TrendingUp, Instagram,
  Calendar, Clock, Pause, Play, BarChart3, AtSign, Star, MessageSquare,
} from "lucide-react";

import type { Agent, Campaign, Video as VideoType } from "@shared/schema";

interface BrandSettings { websiteUrl: string; instagramHandle: string; brandName: string; }

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toString();
}

function avatarColor(name: string): string {
  const colors = [
    "bg-violet-500", "bg-blue-500", "bg-emerald-500",
    "bg-orange-500", "bg-pink-500", "bg-amber-500",
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  paused: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  inactive: "bg-muted text-muted-foreground",
};

const videoStatusColors: Record<string, string> = {
  posted: "text-emerald-500",
  generating: "text-blue-500",
  queued: "text-amber-500",
  pending: "text-muted-foreground",
  scripted: "text-violet-500",
};

const SCHEDULE_HOURS = [9, 11, 13, 15, 17, 19, 21];

export default function AgentProfile() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: agent, isLoading: agentLoading } = useQuery<Agent>({
    queryKey: ["/api/agents", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${params.id}`);
      if (!res.ok) throw new Error("Agent not found");
      return res.json();
    },
  });

  const { data: campaigns } = useQuery<Campaign[]>({ queryKey: ["/api/campaigns"] });
  const { data: brandSettings } = useQuery<BrandSettings>({ queryKey: ["/api/settings/brand"] });
  const brandHandle = brandSettings?.instagramHandle
    ? (brandSettings.instagramHandle.startsWith("@") ? brandSettings.instagramHandle : `@${brandSettings.instagramHandle}`)
    : null;
  const { data: videos } = useQuery<VideoType[]>({
    queryKey: ["/api/videos", agent?.campaignId],
    queryFn: async () => {
      if (!agent?.campaignId) return [];
      const res = await fetch(`/api/videos?campaignId=${agent.campaignId}`);
      return res.json();
    },
    enabled: !!agent?.campaignId,
  });

  const toggleMutation = useMutation({
    mutationFn: async () =>
      apiRequest("PATCH", `/api/agents/${params.id}`, {
        status: agent?.status === "active" ? "paused" : "active",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents", params.id] });
      toast({ title: `Agent ${agent?.status === "active" ? "paused" : "resumed"}` });
    },
  });

  const campaign = campaigns?.find(c => c.id === agent?.campaignId);
  const agentVideos = videos?.filter(v => v.agentId === params.id) ?? [];

  if (agentLoading) {
    return (
      <div className="p-6 space-y-6 max-w-[900px]">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-20 text-center">
        <p className="font-semibold mb-2">Agent not found</p>
        <Button variant="outline" onClick={() => navigate("/agents")}>Back to Agents</Button>
      </div>
    );
  }

  const initials = agent.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const scheduleSlots = SCHEDULE_HOURS.slice(0, agent.postsPerDay || 3);
  const handle = "@" + agent.name.toLowerCase().replace(" ", "_");

  return (
    <div className="p-6 space-y-6 max-w-[900px]">
      <button
        onClick={() => navigate("/agents")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        data-testid="button-back-agents"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Creators
      </button>

      {/* Profile hero card */}
      <Card className="border-card-border overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-pink-500/30 via-violet-500/20 to-blue-500/30" />
        <CardContent className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4 flex-wrap">
            {agent.avatarUrl ? (
              <img
                src={agent.avatarUrl}
                alt={agent.name}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-background flex-shrink-0"
              />
            ) : (
              <div className={`w-20 h-20 rounded-full ${avatarColor(agent.name)} flex items-center justify-center text-white font-bold text-2xl ring-4 ring-background flex-shrink-0`}>
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0 pt-10 sm:pt-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold" data-testid="heading-agent-name">{agent.name}</h1>
                {agent.followers >= 500000 && (
                  <span className="text-xs bg-amber-400/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> Mega Influencer
                  </span>
                )}
                <Badge variant="outline" className={`text-xs border ${statusColors[agent.status] ?? statusColors.inactive}`}>
                  {agent.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                <span className="font-medium text-foreground/70">{handle}</span>
                <span className="flex items-center gap-1"><Instagram className="w-3.5 h-3.5" /> {agent.platform}</span>
                {campaign && <span className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" /> {campaign.name}</span>}
                {brandHandle && (
                  <span className="flex items-center gap-1 text-pink-500 dark:text-pink-400 font-medium">
                    <AtSign className="w-3 h-3" />{brandHandle.replace("@", "")}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant={agent.status === "active" ? "outline" : "default"}
              size="sm"
              className="gap-2 mt-10 sm:mt-0"
              onClick={() => toggleMutation.mutate()}
              disabled={toggleMutation.isPending}
              data-testid="button-toggle-status"
            >
              {agent.status === "active"
                ? <><Pause className="w-3.5 h-3.5" /> Pause</>
                : <><Play className="w-3.5 h-3.5" /> Resume</>
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Videos", value: fmt(agent.totalVideos), icon: Video, color: "text-violet-500" },
          { label: "Total Views", value: fmt(agent.totalViews), icon: Eye, color: "text-blue-500" },
          { label: "Followers", value: fmt(agent.followers), icon: Users, color: "text-orange-500" },
          { label: "Posts / Day", value: agent.postsPerDay.toString(), icon: TrendingUp, color: "text-emerald-500" },
        ].map(s => (
          <Card key={s.label} className="border-card-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <div className="text-xl font-bold" data-testid={`stat-agent-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Daily Posting Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {scheduleSlots.map((hour, i) => {
              const ampm = hour >= 12 ? "PM" : "AM";
              const h = hour > 12 ? hour - 12 : hour;
              return (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-md bg-muted/30 text-sm" data-testid={`schedule-slot-${i}`}>
                  <div className="w-16 text-xs font-mono text-muted-foreground">{h}:00 {ampm}</div>
                  <div className="flex-1 text-xs">Post #{i + 1}</div>
                  <Badge variant="secondary" className="text-xs">Scheduled</Badge>
                </div>
              );
            })}
            {agent.postsPerDay === 0 && (
              <p className="text-xs text-muted-foreground py-2">No schedule configured</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" /> Engagement Estimates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Avg Views per Video", value: agent.totalVideos > 0 ? fmt(Math.floor(agent.totalViews / agent.totalVideos)) : "–" },
              { label: "Est. Engagement Rate", value: "3.2%" },
              { label: "Avg Likes per Post", value: fmt(Math.floor(agent.totalViews * 0.032)) },
              { label: "Monthly Reach", value: fmt(agent.postsPerDay * 30 * Math.floor(agent.totalViews / Math.max(agent.totalVideos, 1))) },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground text-xs">{m.label}</span>
                <span className="font-semibold text-sm">{m.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Video className="w-4 h-4 text-violet-500" />
            Recent Videos
            <Badge variant="secondary" className="text-xs ml-auto">{agentVideos.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agentVideos.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No videos assigned to this agent yet</p>
          ) : (
            <div className="space-y-2">
              {agentVideos.slice(0, 8).map((v) => (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 text-sm" data-testid={`video-row-${v.id}`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${videoStatusColors[v.status] ?? "bg-muted-foreground"} bg-current`} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium">{v.hook}</p>
                    {v.angle && <p className="text-xs text-muted-foreground">{v.angle}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-medium">{fmt(v.views)} views</div>
                    <div className="text-xs text-muted-foreground">${v.revenue.toFixed(0)}</div>
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
