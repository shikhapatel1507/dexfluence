import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Agent, Campaign } from "@shared/schema";
import { insertAgentSchema } from "@shared/schema";
import { z } from "zod";
import { Plus, Users, TrendingUp, Video, Trash2, ChevronRight, AtSign, Star } from "lucide-react";
import { useState } from "react";

interface BrandSettings { websiteUrl: string; instagramHandle: string; brandName: string; }

function fmt(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  paused: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  inactive: "bg-muted text-muted-foreground",
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

const avatarColors = [
  "bg-blue-500", "bg-violet-500", "bg-pink-500", "bg-emerald-500",
  "bg-amber-500", "bg-cyan-500", "bg-rose-500", "bg-indigo-500",
];

const formSchema = insertAgentSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  postsPerDay: z.coerce.number().min(0),
});

function CreateAgentDialog({ campaigns, onClose }: { campaigns: Campaign[]; onClose: () => void }) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", platform: "instagram", postsPerDay: 10, followers: 0, totalVideos: 0, totalViews: 0, status: "active", campaignId: undefined },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/agents", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Agent created" });
      onClose();
    },
    onError: () => toast({ title: "Error", description: "Failed to create agent.", variant: "destructive" }),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Agent Name</FormLabel>
            <FormControl><Input placeholder="e.g. Sophia Chen" {...field} data-testid="input-agent-name" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="platform" render={({ field }) => (
            <FormItem>
              <FormLabel>Platform</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-agent-platform"><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube Shorts</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="postsPerDay" render={({ field }) => (
            <FormItem>
              <FormLabel>Posts Per Day</FormLabel>
              <FormControl><Input type="number" min={0} {...field} data-testid="input-agent-posts" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="campaignId" render={({ field }) => (
          <FormItem>
            <FormLabel>Assign to Campaign</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value ?? ""}>
              <FormControl>
                <SelectTrigger data-testid="select-agent-campaign">
                  <SelectValue placeholder="Select campaign (optional)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-agent">
          {createMutation.isPending ? "Creating..." : "Create Agent"}
        </Button>
      </form>
    </Form>
  );
}

export default function Agents() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: agents, isLoading } = useQuery<Agent[]>({ queryKey: ["/api/agents"] });
  const { data: campaigns } = useQuery<Campaign[]>({ queryKey: ["/api/campaigns"] });
  const { data: brandSettings } = useQuery<BrandSettings>({ queryKey: ["/api/settings/brand"] });
  const brandHandle = brandSettings?.instagramHandle
    ? (brandSettings.instagramHandle.startsWith("@") ? brandSettings.instagramHandle : `@${brandSettings.instagramHandle}`)
    : null;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/agents/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Agent removed" });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete agent.", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/agents/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const activeAgents = agents?.filter(a => a.status === "active").length ?? 0;
  const totalPosts = agents?.reduce((s, a) => s + a.postsPerDay, 0) ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-agents">Creators</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Influencer profiles generating shoppable content 24/7 — click any creator to view their profile</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-create-agent">
              <Plus className="w-4 h-4" /> Deploy Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Deploy New AI Agent</DialogTitle></DialogHeader>
            <CreateAgentDialog campaigns={campaigns ?? []} onClose={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Creators", value: activeAgents, icon: Users, color: "text-primary" },
          { label: "Daily Posts", value: totalPosts, icon: Video, color: "text-emerald-500" },
          { label: "Total Creators", value: agents?.length ?? 0, icon: TrendingUp, color: "text-violet-500" },
        ].map((s) => (
          <Card key={s.label} className="border-card-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : agents?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">No agents deployed</h3>
          <p className="text-sm text-muted-foreground mb-6">Deploy AI creator agents to start manufacturing content at scale.</p>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Deploy First Agent
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agents?.map((agent, idx) => {
            const campaign = campaigns?.find(c => c.id === agent.campaignId);
            const colorClass = avatarColors[idx % avatarColors.length];
            return (
              <Card
                key={agent.id}
                className="border-card-border hover-elevate cursor-pointer"
                onClick={() => navigate(`/agents/${agent.id}`)}
                data-testid={`card-agent-${agent.id}`}
              >
                <CardContent className="p-0">
                  {/* Cover + Avatar */}
                  <div className="relative h-16 rounded-t-lg bg-gradient-to-br from-pink-400/30 via-violet-400/20 to-blue-400/30 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                    <div className="absolute -bottom-6 left-4">
                      <div className="relative">
                        <Avatar className="w-14 h-14 ring-2 ring-background">
                          <AvatarImage src={agent.avatarUrl ?? undefined} alt={agent.name} className="object-cover" />
                          <AvatarFallback className={`${colorClass} text-white font-semibold text-sm`}>
                            {getInitials(agent.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background ${agent.status === "active" ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                      </div>
                    </div>
                    <div className="absolute top-2 right-3 flex items-center gap-1">
                      {agent.followers >= 500000 && (
                        <span className="text-xs bg-amber-400/20 text-amber-600 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-semibold backdrop-blur-sm flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" /> Mega
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                    </div>
                  </div>

                  <div className="pt-8 px-4 pb-4">
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm">{agent.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColors[agent.status] ?? ""}`}>
                          {agent.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        @{agent.name.toLowerCase().replace(" ", "_")} · {agent.platform}
                      </div>
                      {campaign && <div className="text-xs text-muted-foreground mt-0.5 truncate">{campaign.name}</div>}
                      {brandHandle && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="text-xs bg-pink-500/10 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                            <AtSign className="w-2.5 h-2.5" />
                            {brandHandle.replace("@", "")}
                          </span>
                        </div>
                      )}
                    </div>
                  <div className="grid grid-cols-3 gap-1 mb-4 text-center">
                    <div>
                      <div className="text-sm font-bold">{agent.postsPerDay}</div>
                      <div className="text-xs text-muted-foreground">posts/day</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold">{fmt(agent.followers)}</div>
                      <div className="text-xs text-muted-foreground">followers</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold">{fmt(agent.totalViews)}</div>
                      <div className="text-xs text-muted-foreground">views</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      data-testid={`button-toggle-agent-${agent.id}`}
                      onClick={() => toggleMutation.mutate({ id: agent.id, status: agent.status === "active" ? "paused" : "active" })}
                    >
                      {agent.status === "active" ? "Pause" : "Resume"}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      data-testid={`button-delete-agent-${agent.id}`}
                      onClick={() => deleteMutation.mutate(agent.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
