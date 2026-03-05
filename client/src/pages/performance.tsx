import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Eye, Heart, Share2, DollarSign, TrendingUp, Search, Download,
  ChevronUp, ChevronDown, ChevronsUpDown, Target, MessageSquare,
  ExternalLink, Calendar, Award, BarChart3, Instagram, Filter,
} from "lucide-react";
import type { Video, Campaign, Agent } from "@shared/schema";

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toString();
}

function engRate(v: Video): number {
  return v.views > 0 ? ((v.likes + v.shares) / v.views) * 100 : 0;
}

function cpm(v: Video): number {
  return v.views > 0 ? (v.revenue / v.views) * 1000 : 0;
}

type SortKey = "views" | "likes" | "shares" | "revenue" | "engagement" | "cpm" | "date";
type SortDir = "asc" | "desc";

const statusColors: Record<string, string> = {
  posted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  generating: "bg-primary/10 text-primary",
  queued: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  pending: "bg-muted text-muted-foreground",
  scripted: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="w-3 h-3 text-muted-foreground/50" />;
  return dir === "desc"
    ? <ChevronDown className="w-3 h-3 text-primary" />
    : <ChevronUp className="w-3 h-3 text-primary" />;
}

function PostDetailModal({ video, campaign, agent, onClose }: {
  video: Video; campaign?: Campaign; agent?: Agent; onClose: () => void;
}) {
  const er = engRate(video).toFixed(2);
  const cpmVal = cpm(video).toFixed(2);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[video.status] ?? ""}`}>
            {video.status}
          </span>
          {campaign && <Badge variant="outline" className="text-xs">{campaign.name}</Badge>}
          {agent && <Badge variant="secondary" className="text-xs">{agent.name}</Badge>}
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(video.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </span>
      </div>

      <div className="bg-primary/5 border border-primary/15 rounded-lg p-3">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">Hook</p>
        <p className="text-sm font-semibold leading-relaxed">{video.hook}</p>
      </div>

      {video.angle && (
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground">Angle:</span>
          <Badge variant="secondary" className="text-xs">{video.angle}</Badge>
        </div>
      )}

      {video.script && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> Script
          </p>
          <div className="text-xs text-foreground bg-muted/30 rounded-lg px-3 py-2.5 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {video.script}
          </div>
        </div>
      )}

      {video.cta && (
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
            Call to Action
          </p>
          <p className="text-sm font-medium">{video.cta}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Eye, label: "Views", value: fmt(video.views), color: "text-blue-500" },
          { icon: Heart, label: "Likes", value: fmt(video.likes), color: "text-pink-500" },
          { icon: Share2, label: "Shares", value: fmt(video.shares), color: "text-violet-500" },
          { icon: DollarSign, label: "Revenue", value: `$${video.revenue.toFixed(2)}`, color: "text-emerald-500" },
          { icon: TrendingUp, label: "Engagement Rate", value: `${er}%`, color: "text-orange-500" },
          { icon: BarChart3, label: "Revenue / 1k Views", value: `$${cpmVal}`, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 text-center">
            <s.icon className={`w-4 h-4 mx-auto ${s.color}`} />
            <div className="text-xs font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border">
        <Instagram className="w-3.5 h-3.5" />
        <span>Platform: {video.platform}</span>
      </div>
    </div>
  );
}

function exportCsv(videos: Video[], campaigns: Campaign[], agents: Agent[]) {
  const header = ["Hook", "Campaign", "Agent", "Platform", "Status", "Views", "Likes", "Shares", "Revenue ($)", "Engagement Rate (%)", "Revenue/1k Views ($)", "Angle", "Date"];
  const rows = videos.map(v => {
    const c = campaigns.find(x => x.id === v.campaignId);
    const a = agents.find(x => x.id === v.agentId);
    const er = engRate(v).toFixed(2);
    const cp = cpm(v).toFixed(2);
    return [
      `"${v.hook.replace(/"/g, '""')}"`,
      `"${(c?.name ?? "").replace(/"/g, '""')}"`,
      `"${(a?.name ?? "").replace(/"/g, '""')}"`,
      v.platform, v.status, v.views, v.likes, v.shares,
      v.revenue.toFixed(2), er, cp,
      v.angle ?? "",
      new Date(v.createdAt).toLocaleDateString(),
    ].join(",");
  });
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `post-performance-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Performance() {
  const [sortKey, setSortKey] = useState<SortKey>("views");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterCampaign, setFilterCampaign] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Video | null>(null);

  const { data: videos, isLoading } = useQuery<Video[]>({ queryKey: ["/api/videos"] });
  const { data: campaigns } = useQuery<Campaign[]>({ queryKey: ["/api/campaigns"] });
  const { data: agents } = useQuery<Agent[]>({ queryKey: ["/api/agents"] });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = useMemo(() => {
    if (!videos) return [];
    const filtered = videos.filter(v => {
      if (filterCampaign !== "all" && v.campaignId !== filterCampaign) return false;
      if (filterStatus !== "all" && v.status !== filterStatus) return false;
      if (search && !v.hook.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      let av = 0, bv = 0;
      if (sortKey === "views") { av = a.views; bv = b.views; }
      else if (sortKey === "likes") { av = a.likes; bv = b.likes; }
      else if (sortKey === "shares") { av = a.shares; bv = b.shares; }
      else if (sortKey === "revenue") { av = a.revenue; bv = b.revenue; }
      else if (sortKey === "engagement") { av = engRate(a); bv = engRate(b); }
      else if (sortKey === "cpm") { av = cpm(a); bv = cpm(b); }
      else if (sortKey === "date") { av = new Date(a.createdAt).getTime(); bv = new Date(b.createdAt).getTime(); }
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [videos, filterCampaign, filterStatus, search, sortKey, sortDir]);

  const totalViews = sorted.reduce((s, v) => s + v.views, 0);
  const totalRevenue = sorted.reduce((s, v) => s + v.revenue, 0);
  const totalLikes = sorted.reduce((s, v) => s + v.likes, 0);
  const avgEng = sorted.length > 0 ? sorted.reduce((s, v) => s + engRate(v), 0) / sorted.length : 0;
  const topPost = sorted.length > 0 ? [...sorted].sort((a, b) => b.views - a.views)[0] : null;

  const thClass = "text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground transition-colors select-none";
  const tdClass = "px-3 py-2.5 text-xs";

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-performance">
            <BarChart3 className="w-6 h-6 text-emerald-500" />
            Post Performance
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real metrics for every post — views, likes, shares, revenue, and engagement per video
          </p>
        </div>
        <Button
          variant="outline" size="sm" className="gap-1.5"
          onClick={() => exportCsv(sorted, campaigns ?? [], agents ?? [])}
          data-testid="button-export-performance"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Eye, label: "Total Views", value: fmt(totalViews), color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: Heart, label: "Total Likes", value: fmt(totalLikes), color: "text-pink-500", bg: "bg-pink-500/10" },
          { icon: DollarSign, label: "Total Revenue", value: `$${totalRevenue.toFixed(0)}`, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { icon: TrendingUp, label: "Avg Engagement", value: `${avgEng.toFixed(2)}%`, color: "text-orange-500", bg: "bg-orange-500/10" },
        ].map(s => (
          <Card key={s.label} className="border-card-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <div className="text-lg font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Post Banner */}
      {topPost && (
        <Card className="border-card-border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mb-0.5">Best Performing Post</p>
              <p className="text-sm font-medium truncate">{topPost.hook}</p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0 text-right">
              <div>
                <div className="text-xs font-bold">{fmt(topPost.views)}</div>
                <div className="text-xs text-muted-foreground">views</div>
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-500">${topPost.revenue.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">revenue</div>
              </div>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setSelected(topPost)} data-testid="button-view-top-post">
                View <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by hook..."
            className="pl-8 h-9 text-sm"
            data-testid="input-search-posts"
          />
        </div>
        <Select value={filterCampaign} onValueChange={setFilterCampaign}>
          <SelectTrigger className="w-44 h-9" data-testid="select-filter-campaign">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="All Campaigns" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {campaigns?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9" data-testid="select-filter-status">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="posted">Posted</SelectItem>
            <SelectItem value="generating">Generating</SelectItem>
            <SelectItem value="scripted">Scripted</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="text-xs ml-auto">{sorted.length} posts</Badge>
      </div>

      {/* Table */}
      <Card className="border-card-border">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="font-semibold mb-1">No posts found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-border bg-muted/20">
                <tr>
                  <th className={`${thClass} w-full min-w-[220px]`}>Hook</th>
                  <th className={thClass}>Campaign</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass} onClick={() => toggleSort("views")}>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Views <SortIcon col="views" sortKey={sortKey} dir={sortDir} />
                    </span>
                  </th>
                  <th className={thClass} onClick={() => toggleSort("likes")}>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> Likes <SortIcon col="likes" sortKey={sortKey} dir={sortDir} />
                    </span>
                  </th>
                  <th className={thClass} onClick={() => toggleSort("shares")}>
                    <span className="flex items-center gap-1">
                      <Share2 className="w-3 h-3" /> Shares <SortIcon col="shares" sortKey={sortKey} dir={sortDir} />
                    </span>
                  </th>
                  <th className={thClass} onClick={() => toggleSort("engagement")}>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Eng. Rate <SortIcon col="engagement" sortKey={sortKey} dir={sortDir} />
                    </span>
                  </th>
                  <th className={thClass} onClick={() => toggleSort("revenue")}>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Revenue <SortIcon col="revenue" sortKey={sortKey} dir={sortDir} />
                    </span>
                  </th>
                  <th className={thClass} onClick={() => toggleSort("cpm")}>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" /> RPM <SortIcon col="cpm" sortKey={sortKey} dir={sortDir} />
                    </span>
                  </th>
                  <th className={thClass} onClick={() => toggleSort("date")}>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date <SortIcon col="date" sortKey={sortKey} dir={sortDir} />
                    </span>
                  </th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((v, i) => {
                  const campaign = campaigns?.find(c => c.id === v.campaignId);
                  const agent = agents?.find(a => a.id === v.agentId);
                  const er = engRate(v);
                  const isTop = i === 0 && sortKey === "views" && sortDir === "desc";
                  return (
                    <tr
                      key={v.id}
                      className={`border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer ${isTop ? "bg-amber-500/5" : ""}`}
                      onClick={() => setSelected(v)}
                      data-testid={`row-post-${v.id}`}
                    >
                      <td className={`${tdClass} max-w-[260px]`}>
                        <div className="flex items-start gap-2">
                          {isTop && <Award className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />}
                          <p className="text-xs leading-snug line-clamp-2 font-medium">{v.hook}</p>
                        </div>
                        {v.angle && <p className="text-xs text-muted-foreground mt-0.5">{v.angle}</p>}
                      </td>
                      <td className={tdClass}>
                        {campaign && (
                          <span className="text-xs text-muted-foreground truncate max-w-[120px] block">
                            {campaign.name}
                          </span>
                        )}
                      </td>
                      <td className={tdClass}>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[v.status] ?? ""}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className={`${tdClass} font-semibold text-blue-500`}>{fmt(v.views)}</td>
                      <td className={`${tdClass} text-pink-500`}>{fmt(v.likes)}</td>
                      <td className={`${tdClass} text-violet-500`}>{fmt(v.shares)}</td>
                      <td className={tdClass}>
                        <span className={`font-medium ${er >= 3 ? "text-emerald-500" : er >= 1.5 ? "text-amber-500" : "text-muted-foreground"}`}>
                          {er.toFixed(1)}%
                        </span>
                      </td>
                      <td className={`${tdClass} font-semibold text-emerald-500`}>${v.revenue.toFixed(0)}</td>
                      <td className={`${tdClass} text-muted-foreground`}>${cpm(v).toFixed(2)}</td>
                      <td className={`${tdClass} text-muted-foreground whitespace-nowrap`}>
                        {new Date(v.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td className={tdClass}>
                        <Button
                          variant="ghost" size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={e => { e.stopPropagation(); setSelected(v); }}
                          data-testid={`button-view-post-${v.id}`}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Post Detail Modal */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Post Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <PostDetailModal
              video={selected}
              campaign={campaigns?.find(c => c.id === selected.campaignId)}
              agent={agents?.find(a => a.id === selected.agentId)}
              onClose={() => setSelected(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
