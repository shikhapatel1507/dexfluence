import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Agent } from "@shared/schema";
import {
  Megaphone, ArrowRight, ArrowLeft, CheckCircle2, Zap,
  Package, Target, Users, Rocket, TrendingUp,
} from "lucide-react";

const NICHES = [
  { id: "skincare", label: "Skincare", emoji: "🌿" },
  { id: "fitness", label: "Fitness", emoji: "💪" },
  { id: "supplements", label: "Supplements", emoji: "🔥" },
  { id: "pet-care", label: "Pet Care", emoji: "🐾" },
  { id: "kitchen", label: "Home & Kitchen", emoji: "☕" },
  { id: "beauty", label: "Beauty", emoji: "💄" },
  { id: "fashion", label: "Fashion", emoji: "👗" },
  { id: "tech", label: "Tech Gadgets", emoji: "📱" },
];

const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube Shorts" },
];

interface WizardState {
  name: string;
  product: string;
  niche: string;
  platform: string;
  dailyTarget: number;
  costPerVideo: number;
  assignedAgents: string[];
}

const STEPS = [
  { id: 1, label: "Campaign Details", icon: Package },
  { id: 2, label: "Niche & Platform", icon: Target },
  { id: 3, label: "Volume Settings", icon: TrendingUp },
  { id: 4, label: "Assign Agents", icon: Users },
  { id: 5, label: "Launch", icon: Rocket },
];

export default function CampaignWizard() {
  const [step, setStep] = useState(1);
  const [launched, setLaunched] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [state, setState] = useState<WizardState>({
    name: "",
    product: "",
    niche: "",
    platform: "instagram",
    dailyTarget: 50,
    costPerVideo: 6.5,
    assignedAgents: [],
  });

  const { data: agents } = useQuery<Agent[]>({ queryKey: ["/api/agents"] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/campaigns", {
        name: state.name,
        product: state.product,
        niche: state.niche,
        status: "active",
        videosGenerated: 0,
        videosPosted: 0,
        totalViews: 0,
        gmv: 0,
        costPerVideo: state.costPerVideo,
        dailyTarget: state.dailyTarget,
      });
      return res.json();
    },
    onSuccess: async (campaign) => {
      setCampaignId(campaign.id);
      for (const agentId of state.assignedAgents) {
        await apiRequest("PATCH", `/api/agents/${agentId}`, { campaignId: campaign.id });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setLaunched(true);
    },
    onError: () => toast({ title: "Failed to create campaign", variant: "destructive" }),
  });

  function update<K extends keyof WizardState>(key: K, val: WizardState[K]) {
    setState(prev => ({ ...prev, [key]: val }));
  }

  function toggleAgent(id: string) {
    setState(prev => ({
      ...prev,
      assignedAgents: prev.assignedAgents.includes(id)
        ? prev.assignedAgents.filter(a => a !== id)
        : [...prev.assignedAgents, id],
    }));
  }

  const canNext = () => {
    if (step === 1) return state.name.trim().length >= 2 && state.product.trim().length >= 2;
    if (step === 2) return state.niche !== "";
    if (step === 3) return state.dailyTarget >= 1;
    return true;
  };

  const monthlyVideos = state.dailyTarget * 30;
  const monthlyGmv = Math.round(monthlyVideos * 22.4);
  const monthlyCost = Math.round(monthlyVideos * state.costPerVideo);

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  if (launched) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md w-full animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Campaign Launched! 🎉</h1>
          <p className="text-muted-foreground text-sm mb-2">
            <span className="font-semibold text-foreground">{state.name}</span> is now live and generating content.
          </p>
          <p className="text-xs text-muted-foreground mb-8">
            {state.dailyTarget} videos/day · {state.assignedAgents.length} agent{state.assignedAgents.length !== 1 ? "s" : ""} assigned
          </p>
          <div className="space-y-2">
            <Button className="w-full gap-2" onClick={() => campaignId ? navigate(`/campaigns/${campaignId}`) : navigate("/campaigns")} data-testid="button-view-campaign">
              <Megaphone className="w-4 h-4" /> View Campaign
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/videos")} data-testid="button-go-videos">
              Go to Videos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[700px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-campaign-wizard">
          <Megaphone className="w-6 h-6 text-primary" />
          New Campaign
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Set up your content factory in 5 steps</p>
      </div>

      {/* Step Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {step} of {STEPS.length}</span>
          <span>{STEPS[step - 1].label}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <div className="flex items-center justify-between">
          {STEPS.map(s => {
            const Icon = s.icon;
            const done = s.id < step;
            const active = s.id === step;
            return (
              <div key={s.id} className="flex flex-col items-center gap-1" data-testid={`wizard-step-${s.id}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? "bg-emerald-500 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs hidden sm:block ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="border-card-border">
        <CardContent className="p-6">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-semibold mb-1">Campaign Details</h2>
                <p className="text-sm text-muted-foreground">Name your campaign and specify the product you're promoting</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cw-name">Campaign Name</Label>
                  <Input
                    id="cw-name"
                    value={state.name}
                    onChange={e => update("name", e.target.value)}
                    placeholder="e.g. SkinGlow Serum Launch"
                    data-testid="input-campaign-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cw-product">Product Name</Label>
                  <Input
                    id="cw-product"
                    value={state.product}
                    onChange={e => update("product", e.target.value)}
                    placeholder="e.g. Vitamin C Brightening Serum"
                    data-testid="input-product-name"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-semibold mb-1">Niche & Platform</h2>
                <p className="text-sm text-muted-foreground">Choose the content category and where videos will be posted</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {NICHES.map(n => (
                  <button
                    key={n.id}
                    onClick={() => update("niche", n.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all ${state.niche === n.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/20 text-muted-foreground hover:border-foreground/20 hover:text-foreground"}`}
                    data-testid={`button-niche-${n.id}`}
                  >
                    <span className="text-xl">{n.emoji}</span>
                    {n.label}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Primary Platform</Label>
                <div className="flex gap-2">
                  {PLATFORMS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => update("platform", p.id)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${state.platform === p.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                      data-testid={`button-platform-${p.id}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-semibold mb-1">Volume Settings</h2>
                <p className="text-sm text-muted-foreground">Set your daily video target and cost per video</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Daily Video Target</Label>
                    <span className="text-sm font-bold text-primary">{state.dailyTarget} videos/day</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={500}
                    step={10}
                    value={state.dailyTarget}
                    onChange={e => update("dailyTarget", Number(e.target.value))}
                    className="w-full accent-primary"
                    data-testid="slider-daily-target"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10/day</span>
                    <span>500/day</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cost Per Video</Label>
                  <Select value={String(state.costPerVideo)} onValueChange={v => update("costPerVideo", Number(v))}>
                    <SelectTrigger data-testid="select-cost-per-video"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5.9">$5.90 (Economy)</SelectItem>
                      <SelectItem value="6.5">$6.50 (Standard)</SelectItem>
                      <SelectItem value="7.1">$7.10 (Premium)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Monthly Projections</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold">{monthlyVideos.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Videos</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-500">${monthlyGmv.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Est. GMV</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">${monthlyCost.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Est. Cost</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold mb-1">Assign Agents</h2>
                <p className="text-sm text-muted-foreground">Choose which AI agents will post for this campaign (optional)</p>
              </div>
              {!agents?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No agents available. You can assign them later.</p>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {agents.map(agent => {
                    const checked = state.assignedAgents.includes(agent.id);
                    return (
                      <div
                        key={agent.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${checked ? "border-primary bg-primary/5" : "border-border hover:border-foreground/20"}`}
                        onClick={() => toggleAgent(agent.id)}
                        data-testid={`agent-checkbox-${agent.id}`}
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleAgent(agent.id)} />
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {agent.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">{agent.postsPerDay} posts/day · {agent.status}</p>
                        </div>
                        {checked && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
              {state.assignedAgents.length > 0 && (
                <Badge variant="secondary" className="text-xs">{state.assignedAgents.length} agent{state.assignedAgents.length !== 1 ? "s" : ""} selected</Badge>
              )}
            </div>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-semibold mb-1">Review & Launch</h2>
                <p className="text-sm text-muted-foreground">Confirm your campaign settings before going live</p>
              </div>
              <div className="divide-y divide-border">
                {[
                  { label: "Campaign Name", value: state.name },
                  { label: "Product", value: state.product },
                  { label: "Niche", value: NICHES.find(n => n.id === state.niche)?.label ?? state.niche },
                  { label: "Platform", value: PLATFORMS.find(p => p.id === state.platform)?.label ?? state.platform },
                  { label: "Daily Target", value: `${state.dailyTarget} videos/day` },
                  { label: "Cost Per Video", value: `$${state.costPerVideo.toFixed(2)}` },
                  { label: "Agents Assigned", value: state.assignedAgents.length > 0 ? `${state.assignedAgents.length} agent${state.assignedAgents.length !== 1 ? "s" : ""}` : "None (assign later)" },
                  { label: "Monthly Est. GMV", value: `$${monthlyGmv.toLocaleString()}` },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nav Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => step === 1 ? navigate("/campaigns") : setStep(s => s - 1)}
          data-testid="button-wizard-back"
        >
          <ArrowLeft className="w-4 h-4" /> {step === 1 ? "Cancel" : "Back"}
        </Button>
        {step < 5 ? (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            data-testid="button-wizard-next"
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            className="gap-2"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            data-testid="button-launch-campaign"
          >
            {createMutation.isPending
              ? <><Zap className="w-4 h-4 animate-pulse" /> Launching...</>
              : <><Rocket className="w-4 h-4" /> Launch Campaign</>
            }
          </Button>
        )}
      </div>
    </div>
  );
}
