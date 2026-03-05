import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Video, Campaign, Agent } from "@shared/schema";
import { insertVideoSchema } from "@shared/schema";
import { z } from "zod";
import {
  Plus, Video as VideoIcon, DollarSign, Heart, Share2, Eye,
  Film, Loader2, CheckSquare, Square, Zap, X, TrendingUp,
  MessageSquare, Target, Calendar, ExternalLink, Download,
} from "lucide-react";
import { useState, useCallback } from "react";

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toString();
}

function exportVideoCsv(videos: Video[], campaigns: Campaign[]) {
  const header = ["Hook", "Status", "Platform", "Campaign", "Views", "Likes", "Shares", "Revenue", "Angle", "CTA", "Date"];
  const rows = videos.map(v => {
    const campaign = campaigns.find(c => c.id === v.campaignId);
    return [
      `"${v.hook.replace(/"/g, '""')}"`,
      v.status,
      v.platform,
      `"${(campaign?.name ?? "").replace(/"/g, '""')}"`,
      v.views,
      v.likes,
      v.shares,
      v.revenue.toFixed(2),
      v.angle ?? "",
      `"${(v.cta ?? "").replace(/"/g, '""')}"`,
      new Date(v.createdAt).toLocaleDateString(),
    ].join(",");
  });
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dexfluence-videos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const statusColors: Record<string, string> = {
  posted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  generating: "bg-primary/10 text-primary",
  queued: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  pending: "bg-muted text-muted-foreground",
  scripted: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  failed: "bg-destructive/10 text-destructive",
};

const formSchema = insertVideoSchema.extend({
  hook: z.string().min(5, "Hook must be at least 5 characters"),
  campaignId: z.string().min(1, "Campaign is required"),
});

function CreateVideoDialog({ campaigns, agents, onClose }: {
  campaigns: Campaign[]; agents: Agent[]; onClose: () => void;
}) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { hook: "", script: "", platform: "instagram", status: "queued", views: 0, likes: 0, shares: 0, revenue: 0, campaignId: "", agentId: undefined },
  });
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/videos", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({ title: "Video added to queue" });
      onClose();
    },
    onError: () => toast({ title: "Error", description: "Failed to create video.", variant: "destructive" }),
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
        <FormField control={form.control} name="campaignId" render={({ field }) => (
          <FormItem><FormLabel>Campaign</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger data-testid="select-video-campaign"><SelectValue placeholder="Select campaign" /></SelectTrigger></FormControl>
              <SelectContent>{campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="hook" render={({ field }) => (
          <FormItem><FormLabel>Video Hook</FormLabel>
            <FormControl><Input placeholder="e.g. POV: I tried this for 30 days and..." {...field} data-testid="input-video-hook" /></FormControl>
            <FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="script" render={({ field }) => (
          <FormItem><FormLabel>Script (Optional)</FormLabel>
            <FormControl><Textarea placeholder="Full video script..." {...field} value={field.value ?? ""} data-testid="input-video-script" /></FormControl>
            <FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="platform" render={({ field }) => (
            <FormItem><FormLabel>Platform</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger data-testid="select-video-platform"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube Shorts</SelectItem>
                </SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="agentId" render={({ field }) => (
            <FormItem><FormLabel>Agent</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value ?? ""}>
                <FormControl><SelectTrigger data-testid="select-video-agent"><SelectValue placeholder="Select agent" /></SelectTrigger></FormControl>
                <SelectContent>{agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
        </div>
        <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-video">
          {createMutation.isPending ? "Adding..." : "Add to Queue"}
        </Button>
      </form>
    </Form>
  );
}

function VideoDetailModal({ video, campaign, agent, onClose }: {
  video: Video; campaign?: Campaign; agent?: Agent; onClose: () => void;
}) {
  const engagementRate = video.views > 0 ? ((video.likes + video.shares) / video.views * 100).toFixed(1) : "0";
  const cpm = video.views > 0 ? ((video.revenue / video.views) * 1000).toFixed(2) : "0";

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[video.status] ?? ""}`}>{video.status}</span>
          <p className="text-xs text-muted-foreground mt-1">{new Date(video.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {campaign && <Badge variant="outline" className="text-xs">{campaign.name}</Badge>}
          {agent && <Badge variant="secondary" className="text-xs">{agent.name}</Badge>}
        </div>
      </div>

      {/* Hook */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hook</p>
        <p className="text-sm font-semibold leading-relaxed bg-muted/30 rounded-lg px-3 py-2.5">{video.hook}</p>
      </div>

      {/* Angle */}
      {video.angle && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Target className="w-3 h-3" /> Angle</p>
          <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2.5">{video.angle}</p>
        </div>
      )}

      {/* Script */}
      {video.script && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Script</p>
          <div className="text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2.5 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">{video.script}</div>
        </div>
      )}

      {/* CTA */}
      {video.cta && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Call to Action</p>
          <p className="text-sm bg-primary/10 text-primary rounded-lg px-3 py-2.5 font-medium">{video.cta}</p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Eye, label: "Views", value: fmt(video.views), color: "text-blue-500" },
          { icon: Heart, label: "Likes", value: fmt(video.likes), color: "text-pink-500" },
          { icon: Share2, label: "Shares", value: fmt(video.shares), color: "text-violet-500" },
          { icon: DollarSign, label: "Revenue", value: `$${video.revenue.toFixed(2)}`, color: "text-emerald-500" },
          { icon: TrendingUp, label: "Engagement Rate", value: `${engagementRate}%`, color: "text-orange-500" },
          { icon: Target, label: "Revenue / 1k views", value: `$${cpm}`, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/30">
            <s.icon className={`w-4 h-4 flex-shrink-0 ${s.color}`} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-sm font-semibold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground border-t border-border">
        <Calendar className="w-3.5 h-3.5" />
        <span>Platform: {video.platform}</span>
        {video.status === "generating" && (
          <><span>·</span><span className="text-primary">Generating with Kling...</span></>
        )}
      </div>
    </div>
  );
}

export default function Videos() {
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCampaign, setFilterCampaign] = useState<string>("all");
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [genProgress, setGenProgress] = useState<Record<string, number>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [detailVideo, setDetailVideo] = useState<Video | null>(null);
  const { toast } = useToast();

  const { data: videos, isLoading } = useQuery<Video[]>({ queryKey: ["/api/videos"], refetchInterval: 4000 });
  const { data: campaigns } = useQuery<Campaign[]>({ queryKey: ["/api/campaigns"] });
  const { data: agents } = useQuery<Agent[]>({ queryKey: ["/api/agents"] });

  const generateMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const res = await apiRequest("POST", `/api/videos/${videoId}/generate`, {});
      return res.json();
    },
    onSuccess: (_, videoId) => {
      setGeneratingIds(prev => new Set(prev).add(videoId));
      simulateProgress(videoId);
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    },
    onError: () => toast({ title: "Generation failed", variant: "destructive" }),
  });

  const simulateProgress = useCallback((videoId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 18 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setGeneratingIds(prev => { const next = new Set(prev); next.delete(videoId); return next; });
          setGenProgress(prev => { const next = { ...prev }; delete next[videoId]; return next; });
          queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
          toast({ title: "Video generated!", description: "Video is now posted and live." });
        }, 800);
      }
      setGenProgress(prev => ({ ...prev, [videoId]: Math.min(100, progress) }));
    }, 600);
  }, []);

  async function handleBulkGenerate() {
    const generatable = filtered.filter(v =>
      selectedIds.has(v.id) && (v.status === "scripted" || v.status === "queued" || v.status === "pending")
    );
    if (generatable.length === 0) {
      toast({ title: "No eligible videos selected", variant: "destructive" });
      return;
    }
    setBulkGenerating(true);
    toast({ title: `Sending ${generatable.length} videos to Kling...`, description: "Batch generation started." });
    generatable.forEach((v, i) => setTimeout(() => generateMutation.mutate(v.id), i * 800));
    setTimeout(() => { setBulkGenerating(false); setSelectedIds(new Set()); }, generatable.length * 800 + 500);
  }

  const filtered = (videos ?? []).filter(v => {
    if (filterStatus !== "all" && v.status !== filterStatus) return false;
    if (filterCampaign !== "all" && v.campaignId !== filterCampaign) return false;
    return true;
  });

  const generatableInView = filtered.filter(v => v.status === "scripted" || v.status === "queued" || v.status === "pending");
  const allGeneratableSelected = generatableInView.length > 0 && generatableInView.every(v => selectedIds.has(v.id));

  function toggleSelectAll() {
    allGeneratableSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(generatableInView.map(v => v.id)));
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  const totalViews = (videos ?? []).reduce((s, v) => s + v.views, 0);
  const totalRevenue = (videos ?? []).reduce((s, v) => s + v.revenue, 0);
  const selectedGeneratable = filtered.filter(v => selectedIds.has(v.id) && (v.status === "scripted" || v.status === "queued" || v.status === "pending"));

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-videos">Videos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Click a card to view full details — select videos for bulk generation</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportVideoCsv(videos ?? [], campaigns ?? [])} data-testid="button-export-videos">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-video"><Plus className="w-4 h-4" /> Add Video</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Video to Queue</DialogTitle></DialogHeader>
            <CreateVideoDialog campaigns={campaigns ?? []} agents={agents ?? []} onClose={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: VideoIcon, label: "Total Videos", value: (videos?.length ?? 0).toString(), color: "text-primary" },
          { icon: Eye, label: "Total Views", value: fmt(totalViews), color: "text-violet-500" },
          { icon: DollarSign, label: "Total Revenue", value: `$${totalRevenue.toFixed(0)}`, color: "text-emerald-500" },
        ].map((s) => (
          <Card key={s.label} className="border-card-border">
            <div className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <div className="text-lg font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters + Bulk */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setSelectedIds(new Set()); }}>
          <SelectTrigger className="w-40" data-testid="select-filter-status"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="posted">Posted</SelectItem>
            <SelectItem value="generating">Generating</SelectItem>
            <SelectItem value="scripted">Scripted</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCampaign} onValueChange={v => { setFilterCampaign(v); setSelectedIds(new Set()); }}>
          <SelectTrigger className="w-48" data-testid="select-filter-campaign"><SelectValue placeholder="All Campaigns" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {campaigns?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {generatableInView.length > 0 && (
          <>
            <div className="h-5 w-px bg-border" />
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={toggleSelectAll} data-testid="button-select-all">
              {allGeneratableSelected ? <CheckSquare className="w-3.5 h-3.5 text-primary" /> : <Square className="w-3.5 h-3.5" />}
              {allGeneratableSelected ? "Deselect all" : `Select all (${generatableInView.length})`}
            </button>
          </>
        )}
        {selectedIds.size > 0 && (
          <Button size="sm" className="gap-1.5 h-8 ml-auto" onClick={handleBulkGenerate} disabled={bulkGenerating || selectedGeneratable.length === 0} data-testid="button-bulk-generate">
            {bulkGenerating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</> : <><Zap className="w-3.5 h-3.5" /> Generate {selectedGeneratable.length} Selected</>}
          </Button>
        )}
        {filtered.length !== (videos?.length ?? 0) && (
          <Badge variant="secondary" className="text-xs ml-auto">{filtered.length} of {videos?.length} videos</Badge>
        )}
      </div>

      {/* Video Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(9)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <VideoIcon className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">No videos found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or add a new video to the queue.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => {
            const campaign = campaigns?.find(c => c.id === v.campaignId);
            const agent = agents?.find(a => a.id === v.agentId);
            const isGenerating = generatingIds.has(v.id) || v.status === "generating";
            const progress = genProgress[v.id];
            const canGenerate = v.status === "scripted" || v.status === "queued" || v.status === "pending";
            const isSelected = selectedIds.has(v.id);
            return (
              <Card
                key={v.id}
                className={`border-card-border hover-elevate transition-all cursor-pointer ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                onClick={() => setDetailVideo(v)}
                data-testid={`card-video-item-${v.id}`}
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {canGenerate && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(v.id)}
                          onClick={e => e.stopPropagation()}
                          data-testid={`checkbox-video-${v.id}`}
                          className="h-3.5 w-3.5"
                        />
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[v.status] ?? ""}`}>{v.status}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-medium leading-snug line-clamp-2">{v.hook}</p>
                  {v.angle && <p className="text-xs text-muted-foreground line-clamp-1">{v.angle}</p>}
                  {(campaign || agent) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {campaign && <Badge variant="outline" className="text-xs max-w-[120px] truncate">{campaign.name}</Badge>}
                      {agent && <Badge variant="secondary" className="text-xs">{agent.name}</Badge>}
                    </div>
                  )}
                  {isGenerating && progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Generating with Kling...</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div><div className="flex items-center justify-center mb-0.5"><Eye className="w-3 h-3 text-muted-foreground" /></div><div className="text-xs font-medium">{fmt(v.views)}</div></div>
                    <div><div className="flex items-center justify-center mb-0.5"><Heart className="w-3 h-3 text-muted-foreground" /></div><div className="text-xs font-medium">{fmt(v.likes)}</div></div>
                    <div><div className="flex items-center justify-center mb-0.5"><Share2 className="w-3 h-3 text-muted-foreground" /></div><div className="text-xs font-medium">{fmt(v.shares)}</div></div>
                  </div>
                  {canGenerate && !isGenerating && (
                    <Button size="sm" className="w-full gap-1.5 text-xs h-7" onClick={e => { e.stopPropagation(); generateMutation.mutate(v.id); }} disabled={generateMutation.isPending} data-testid={`button-generate-video-${v.id}`}>
                      <Film className="w-3.5 h-3.5" /> Generate with Kling
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Video Detail Modal */}
      <Dialog open={!!detailVideo} onOpenChange={o => !o && setDetailVideo(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <VideoIcon className="w-4 h-4 text-primary" />
              Video Details
            </DialogTitle>
          </DialogHeader>
          {detailVideo && (
            <VideoDetailModal
              video={detailVideo}
              campaign={campaigns?.find(c => c.id === detailVideo.campaignId)}
              agent={agents?.find(a => a.id === detailVideo.agentId)}
              onClose={() => setDetailVideo(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
