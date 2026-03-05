import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Campaign } from "@shared/schema";
import { insertCampaignSchema } from "@shared/schema";
import { z } from "zod";
import {
  Plus, Video, TrendingUp, DollarSign, Target, Pause, Play, Trash2, Megaphone, ChevronRight, Wand2,
} from "lucide-react";
import { useState } from "react";

function fmt(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}
function fmtCurrency(n: number): string {
  if (n >= 1000) return "$" + (n / 1000).toFixed(1) + "k";
  return "$" + n.toFixed(0);
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  paused: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  completed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  draft: "bg-muted text-muted-foreground",
};

const formSchema = insertCampaignSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  product: z.string().min(2, "Product must be at least 2 characters"),
  niche: z.string().min(2, "Niche is required"),
  dailyTarget: z.coerce.number().min(1).max(1000),
});

function CreateCampaignDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", product: "", niche: "", status: "active", dailyTarget: 100, videosGenerated: 0, videosPosted: 0, totalViews: 0, gmv: 0, costPerVideo: 6.5 },
  });
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/campaigns", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Campaign created", description: "Your new campaign is live." });
      onClose();
    },
    onError: () => toast({ title: "Error", description: "Failed to create campaign.", variant: "destructive" }),
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Campaign Name</FormLabel><FormControl><Input placeholder="e.g. SkinGlow Launch" {...field} data-testid="input-campaign-name" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="product" render={({ field }) => (
            <FormItem><FormLabel>Product</FormLabel><FormControl><Input placeholder="e.g. Vitamin C Serum" {...field} data-testid="input-campaign-product" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="niche" render={({ field }) => (
            <FormItem><FormLabel>Niche</FormLabel><FormControl><Input placeholder="e.g. skincare" {...field} data-testid="input-campaign-niche" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="dailyTarget" render={({ field }) => (
            <FormItem><FormLabel>Daily Video Target</FormLabel><FormControl><Input type="number" min={1} max={1000} {...field} data-testid="input-campaign-daily" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger data-testid="select-campaign-status"><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-campaign">
          {createMutation.isPending ? "Creating..." : "Create Campaign"}
        </Button>
      </form>
    </Form>
  );
}

export default function Campaigns() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: campaigns, isLoading } = useQuery<Campaign[]>({ queryKey: ["/api/campaigns"] });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/campaigns/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to update campaign.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/campaigns/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Campaign deleted" });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete campaign.", variant: "destructive" }),
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-campaigns">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Click a campaign to view details — manage your AI content manufacturing campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/campaigns/new")} data-testid="button-campaign-wizard">
            <Wand2 className="w-4 h-4" /> Wizard
          </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-create-campaign"><Plus className="w-4 h-4" /> New Campaign</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Campaign</DialogTitle></DialogHeader>
            <CreateCampaignDialog onClose={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-52" />)}</div>
      ) : campaigns?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Megaphone className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">No campaigns yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Create your first AI content campaign to start manufacturing videos.</p>
          <Button onClick={() => setOpen(true)} className="gap-2" data-testid="button-empty-create">
            <Plus className="w-4 h-4" /> Create Campaign
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {campaigns?.map((c) => (
            <Card
              key={c.id}
              className="border-card-border hover-elevate cursor-pointer"
              onClick={() => navigate(`/campaigns/${c.id}`)}
              data-testid={`card-campaign-${c.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">{c.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.product}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status] ?? ""}`}>{c.status}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: Video, label: "Generated", value: fmt(c.videosGenerated) },
                    { icon: TrendingUp, label: "Views", value: fmt(c.totalViews) },
                    { icon: DollarSign, label: "GMV", value: fmtCurrency(c.gmv) },
                    { icon: Target, label: "Daily", value: fmt(c.dailyTarget) },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-sm font-bold">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{c.niche}</Badge>
                  <Badge variant="outline" className="text-xs">${c.costPerVideo}/video</Badge>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <Button
                    size="sm" variant="outline" className="flex-1 gap-1"
                    data-testid={`button-toggle-${c.id}`}
                    onClick={() => toggleMutation.mutate({ id: c.id, status: c.status === "active" ? "paused" : "active" })}
                    disabled={toggleMutation.isPending}
                  >
                    {c.status === "active" ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Resume</>}
                  </Button>
                  <Button size="icon" variant="outline" data-testid={`button-delete-${c.id}`}
                    onClick={() => deleteMutation.mutate(c.id)} disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
