import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Zap, ArrowRight, ArrowLeft, Check, Sparkles, Loader2,
  Target, Video, Users, DollarSign, TrendingUp, Wand2,
  CheckCircle2, Copy, ChevronRight, Rocket, BarChart2,
  ShoppingBag, Dumbbell, PawPrint, Coffee, Brush, FlaskConical,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface OnboardingData {
  brandName: string;
  yourName: string;
  niche: string;
  product: string;
  platform: string;
  dailyTarget: number;
  costPerVideo: number;
}

interface GeneratedScript {
  hook: string;
  script: string;
  cta: string;
  angle: string;
  estimatedViews: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 5;

const NICHES = [
  { id: "skincare", label: "Skincare", icon: Brush, color: "border-pink-500/30 bg-pink-500/5 text-pink-600 dark:text-pink-400" },
  { id: "fitness", label: "Fitness", icon: Dumbbell, color: "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400" },
  { id: "supplements", label: "Supplements", icon: FlaskConical, color: "border-violet-500/30 bg-violet-500/5 text-violet-600 dark:text-violet-400" },
  { id: "pet products", label: "Pet Products", icon: PawPrint, color: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400" },
  { id: "kitchen", label: "Kitchen & Home", icon: Coffee, color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400" },
  { id: "beauty", label: "Beauty", icon: ShoppingBag, color: "border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400" },
];

const PLATFORMS = [
  { id: "instagram", label: "Instagram Shop", sub: "Best for GMV" },
  { id: "tiktok", label: "TikTok Shop", sub: "Fastest growth" },
  { id: "youtube", label: "YouTube Shorts", sub: "Long-term reach" },
  { id: "all", label: "All Platforms", sub: "Maximum reach" },
];

// ── Progress Bar ───────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  return (
    <div className="w-full bg-muted rounded-full h-1.5 mb-8">
      <div
        className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${((step) / TOTAL_STEPS) * 100}%` }}
      />
    </div>
  );
}

// ── Step 1: Welcome ────────────────────────────────────────────────────────────
function StepWelcome({ data, onChange, onNext }: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
}) {
  const valid = data.brandName.trim().length >= 2 && data.yourName.trim().length >= 2;
  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Rocket className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Welcome to Dexfluence</h1>
        <p className="text-muted-foreground">
          Let's set up your AI content factory in 5 minutes. We'll research your niche, generate your first scripts, and launch your first campaign.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="brandName">Brand / Business Name</Label>
          <Input
            id="brandName"
            placeholder="e.g. GlowLab Skincare"
            value={data.brandName}
            onChange={e => onChange({ brandName: e.target.value })}
            className="h-11"
            data-testid="input-brand-name"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="yourName">Your Name</Label>
          <Input
            id="yourName"
            placeholder="e.g. Sarah Johnson"
            value={data.yourName}
            onChange={e => onChange({ yourName: e.target.value })}
            className="h-11"
            data-testid="input-your-name"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { icon: Video, value: "300+", label: "Videos/day" },
          { icon: DollarSign, value: "$6.50", label: "Cost/video" },
          { icon: TrendingUp, value: "92%", label: "Cost savings" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-card-border bg-muted/30 p-3">
            <s.icon className="w-4 h-4 text-primary mx-auto mb-1" />
            <div className="text-base font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <Button
        className="w-full h-11 gap-2"
        onClick={onNext}
        disabled={!valid}
        data-testid="button-step-welcome-next"
      >
        Let's Get Started <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ── Step 2: Niche ──────────────────────────────────────────────────────────────
function StepNiche({ data, onChange, onNext, onBack }: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const valid = data.niche && data.product.trim().length >= 2;
  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="text-xs">Step 2 of 5</Badge>
        <h2 className="text-2xl font-bold">What are you selling?</h2>
        <p className="text-muted-foreground text-sm">Choose your niche and tell us about your product. Our AI will tailor everything specifically to you.</p>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Product Niche</Label>
        <div className="grid grid-cols-2 gap-3">
          {NICHES.map(n => {
            const Icon = n.icon;
            const selected = data.niche === n.id;
            return (
              <button
                key={n.id}
                onClick={() => onChange({ niche: n.id })}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${selected ? `${n.color} border-current` : "border-border hover:border-border/80 hover:bg-muted/30"}`}
                data-testid={`button-niche-${n.id}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${selected ? "" : "text-muted-foreground"}`} />
                <span className={`text-sm font-medium ${selected ? "" : "text-foreground"}`}>{n.label}</span>
                {selected && <Check className="w-4 h-4 ml-auto flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product">Specific Product Name</Label>
        <Input
          id="product"
          placeholder="e.g. Vitamin C Brightening Serum"
          value={data.product}
          onChange={e => onChange({ product: e.target.value })}
          className="h-11"
          data-testid="input-product-name"
        />
        <p className="text-xs text-muted-foreground">Be specific — this gets used in your AI-generated scripts</p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2" data-testid="button-niche-back">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button className="flex-1 gap-2" onClick={onNext} disabled={!valid} data-testid="button-niche-next">
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 3: Volume & Platform ──────────────────────────────────────────────────
function StepVolume({ data, onChange, onNext, onBack }: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const monthlyVideos = data.dailyTarget * 30;
  const monthlyCost = monthlyVideos * data.costPerVideo;
  const projectedGmv = monthlyVideos * 8500 * 0.018 * 0.105 * 38;

  function fmt(n: number) {
    if (n >= 1000) return "$" + (n / 1000).toFixed(0) + "k";
    return "$" + n.toFixed(0);
  }

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="text-xs">Step 3 of 5</Badge>
        <h2 className="text-2xl font-bold">Set Your Volume</h2>
        <p className="text-muted-foreground text-sm">How many videos do you want to generate daily? You can always change this later.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Daily Video Target</Label>
            <span className="text-2xl font-bold text-primary">{data.dailyTarget}</span>
          </div>
          <input
            type="range" min={10} max={500} step={10}
            value={data.dailyTarget}
            onChange={e => onChange({ dailyTarget: Number(e.target.value) })}
            className="w-full accent-primary h-2"
            data-testid="range-daily-target"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>10 (Starter)</span>
            <span>250 (Growth)</span>
            <span>500 (Scale)</span>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Primary Platform</Label>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map(p => {
              const selected = data.platform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onChange({ platform: p.id })}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${selected ? "border-primary bg-primary/5" : "border-border hover:border-border/70"}`}
                  data-testid={`button-platform-${p.id}`}
                >
                  <div className={`text-sm font-semibold ${selected ? "text-primary" : ""}`}>{p.label}</div>
                  <div className="text-xs text-muted-foreground">{p.sub}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Projection card */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="text-xs font-semibold text-primary uppercase tracking-wider">Your Projected Results</div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-bold">{(monthlyVideos).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Videos/month</div>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-500">{fmt(projectedGmv)}</div>
            <div className="text-xs text-muted-foreground">Projected GMV</div>
          </div>
          <div>
            <div className="text-lg font-bold">{fmt(monthlyCost)}</div>
            <div className="text-xs text-muted-foreground">Monthly cost</div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2" data-testid="button-volume-back">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button className="flex-1 gap-2" onClick={onNext} data-testid="button-volume-next">
          Generate My Scripts <Sparkles className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 4: AI Script Generation ───────────────────────────────────────────────
function StepScripts({ data, onNext, onBack }: {
  data: OnboardingData;
  onNext: (scripts: GeneratedScript[]) => void;
  onBack: () => void;
}) {
  const [scripts, setScripts] = useState<GeneratedScript[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/scripts", {
        product: data.product,
        niche: data.niche,
        tone: "relatable",
        count: 3,
        platform: data.platform === "all" ? "instagram" : data.platform,
      });
      return res.json();
    },
    onSuccess: (d) => setScripts(d.scripts ?? []),
    onError: () => toast({ title: "Generation failed", description: "Check your AI integration.", variant: "destructive" }),
  });

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="text-xs">Step 4 of 5</Badge>
        <h2 className="text-2xl font-bold">Generate Your First Scripts</h2>
        <p className="text-muted-foreground text-sm">
          AI will write 3 viral hooks & scripts for <span className="font-medium text-foreground">{data.product}</span> in the <span className="font-medium text-foreground">{data.niche}</span> niche.
        </p>
      </div>

      {scripts.length === 0 && !generateMutation.isPending && (
        <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Wand2 className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold mb-1">Ready to generate</p>
            <p className="text-sm text-muted-foreground">3 scripts optimized for {data.platform === "all" ? "all platforms" : data.platform} • {data.niche} niche</p>
          </div>
          <Button className="gap-2 px-8" onClick={() => generateMutation.mutate()} data-testid="button-generate-scripts">
            <Sparkles className="w-4 h-4" /> Generate with GPT-5.2
          </Button>
        </div>
      )}

      {generateMutation.isPending && (
        <div className="rounded-2xl border border-card-border bg-card p-10 text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <div>
            <p className="font-semibold mb-1">Analyzing {data.niche} niche...</p>
            <p className="text-sm text-muted-foreground">Writing viral hooks optimized for conversions</p>
          </div>
          <div className="space-y-2 max-w-xs mx-auto">
            {["Researching viral angles", "Writing hooks", "Generating scripts", "Optimizing CTAs"].map((step, i) => (
              <div key={step} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {scripts.length > 0 && (
        <div className="space-y-4">
          {scripts.map((s, i) => (
            <Card key={i} className="border-card-border" data-testid={`script-card-${i}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary" className="text-xs flex-shrink-0">Script {i + 1}</Badge>
                  <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/30">{s.estimatedViews} est. views</Badge>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Hook</p>
                  <p className="text-sm font-semibold leading-snug bg-muted/40 rounded-lg px-3 py-2">{s.hook}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Angle</p>
                  <p className="text-xs text-muted-foreground bg-muted/20 rounded-lg px-3 py-2">{s.angle}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">CTA</p>
                  <p className="text-xs text-primary bg-primary/10 rounded-lg px-3 py-2 font-medium">{s.cta}</p>
                </div>

                <button
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => copy(s.hook + "\n\n" + s.script, `${i}`)}
                >
                  {copied === `${i}` ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy hook + script</>}
                </button>
              </CardContent>
            </Card>
          ))}

          <button
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center justify-center gap-1.5"
            onClick={() => { setScripts([]); generateMutation.reset(); }}
            data-testid="button-regenerate"
          >
            <Sparkles className="w-3.5 h-3.5" /> Regenerate scripts
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2" data-testid="button-scripts-back">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          className="flex-1 gap-2"
          onClick={() => onNext(scripts)}
          disabled={scripts.length === 0}
          data-testid="button-scripts-next"
        >
          Launch My Campaign <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 5: Launch ─────────────────────────────────────────────────────────────
function StepLaunch({ data, scripts, onFinish }: {
  data: OnboardingData;
  scripts: GeneratedScript[];
  onFinish: () => void;
}) {
  const [launched, setLaunched] = useState(false);
  const { toast } = useToast();

  const monthlyVideos = data.dailyTarget * 30;
  const projectedGmv = monthlyVideos * 8500 * 0.018 * 0.105 * 38;

  const launchMutation = useMutation({
    mutationFn: async () => {
      const campaign = await apiRequest("POST", "/api/campaigns", {
        name: `${data.brandName} — ${data.niche.charAt(0).toUpperCase() + data.niche.slice(1)}`,
        product: data.product,
        niche: data.niche,
        status: "active",
        dailyTarget: data.dailyTarget,
        videosGenerated: 0,
        videosPosted: 0,
        totalViews: 0,
        gmv: 0,
        costPerVideo: data.costPerVideo,
      });
      const campaignData = await campaign.json();

      // Save the generated scripts as videos
      for (const script of scripts) {
        await apiRequest("POST", "/api/videos", {
          hook: script.hook,
          script: script.script,
          cta: script.cta,
          angle: script.angle,
          platform: data.platform === "all" ? "instagram" : data.platform,
          status: "scripted",
          views: 0, likes: 0, shares: 0, revenue: 0,
          campaignId: campaignData.id,
        });
      }

      return campaignData;
    },
    onSuccess: () => {
      setLaunched(true);
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => toast({ title: "Launch failed", description: "Please try again.", variant: "destructive" }),
  });

  if (launched) {
    return (
      <div className="space-y-8 max-w-lg mx-auto text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-2">You're live! 🎉</h2>
            <p className="text-muted-foreground">
              Your AI content factory is up and running. {scripts.length} scripts are ready to generate videos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Campaign Created", value: data.brandName, color: "text-primary" },
            { label: "Scripts Ready", value: `${scripts.length} videos`, color: "text-violet-500" },
            { label: "Daily Target", value: `${data.dailyTarget} videos`, color: "text-blue-500" },
            { label: "Projected GMV", value: `$${(projectedGmv / 1000).toFixed(0)}k/mo`, color: "text-emerald-500" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-card-border bg-card/50 p-4">
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2 text-left">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What's next</p>
          {[
            { icon: Video, text: "Go to Videos and click 'Generate with Kling' on your scripts" },
            { icon: Users, text: "Visit Agents to deploy AI creators to post your content" },
            { icon: BarChart2, text: "Monitor your GMV and views in Analytics" },
          ].map(item => (
            <div key={item.text} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <item.icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm">{item.text}</p>
            </div>
          ))}
        </div>

        <Button className="w-full h-11 gap-2" onClick={onFinish} data-testid="button-go-to-dashboard">
          Open My Dashboard <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="text-xs">Step 5 of 5</Badge>
        <h2 className="text-2xl font-bold">Ready to Launch</h2>
        <p className="text-muted-foreground text-sm">
          Review your setup and launch your first AI campaign.
        </p>
      </div>

      <div className="rounded-2xl border border-card-border bg-card/50 divide-y divide-border">
        {[
          { label: "Brand", value: data.brandName },
          { label: "Product", value: data.product },
          { label: "Niche", value: data.niche.charAt(0).toUpperCase() + data.niche.slice(1) },
          { label: "Platform", value: data.platform === "all" ? "All Platforms" : data.platform.charAt(0).toUpperCase() + data.platform.slice(1) },
          { label: "Daily target", value: `${data.dailyTarget} videos/day` },
          { label: "Cost per video", value: `$${data.costPerVideo.toFixed(2)}` },
          { label: "Scripts ready", value: `${scripts.length} scripts written` },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between px-4 py-3" data-testid={`review-${row.label.replace(/\s+/g, "-").toLowerCase()}`}>
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span className="text-sm font-semibold">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Projected Month 1 Results</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-base font-bold">{(data.dailyTarget * 30).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Videos</div>
          </div>
          <div>
            <div className="text-base font-bold text-emerald-500">${(projectedGmv / 1000).toFixed(0)}k</div>
            <div className="text-xs text-muted-foreground">Est. GMV</div>
          </div>
          <div>
            <div className="text-base font-bold">${(data.dailyTarget * 30 * data.costPerVideo / 1000).toFixed(1)}k</div>
            <div className="text-xs text-muted-foreground">Total Cost</div>
          </div>
        </div>
      </div>

      <Button
        className="w-full h-11 gap-2"
        onClick={() => launchMutation.mutate()}
        disabled={launchMutation.isPending}
        data-testid="button-launch-campaign"
      >
        {launchMutation.isPending
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Launching...</>
          : <><Rocket className="w-4 h-4" /> Launch My Content Factory</>
        }
      </Button>
    </div>
  );
}

// ── Main Onboarding Page ───────────────────────────────────────────────────────
export default function Onboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [scripts, setScripts] = useState<GeneratedScript[]>([]);
  const [data, setData] = useState<OnboardingData>({
    brandName: "",
    yourName: "",
    niche: "",
    product: "",
    platform: "instagram",
    dailyTarget: 100,
    costPerVideo: 6.5,
  });

  function update(partial: Partial<OnboardingData>) {
    setData(prev => ({ ...prev, ...partial }));
  }

  function next() { setStep(s => Math.min(s + 1, TOTAL_STEPS)); }
  function back() { setStep(s => Math.max(s - 1, 1)); }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">Dexfluence</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-skip-onboarding"
          >
            Skip setup →
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 pt-6 max-w-xl mx-auto w-full">
        <ProgressBar step={step} />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all ${i + 1 < step ? "w-5 h-5 bg-primary flex items-center justify-center" : i + 1 === step ? "w-2 h-2 bg-primary" : "w-2 h-2 bg-muted"}`}
          >
            {i + 1 < step && <Check className="w-3 h-3 text-primary-foreground" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 px-6 pb-12 overflow-y-auto">
        {step === 1 && <StepWelcome data={data} onChange={update} onNext={next} />}
        {step === 2 && <StepNiche data={data} onChange={update} onNext={next} onBack={back} />}
        {step === 3 && <StepVolume data={data} onChange={update} onNext={next} onBack={back} />}
        {step === 4 && (
          <StepScripts
            data={data}
            onNext={(s) => { setScripts(s); next(); }}
            onBack={back}
          />
        )}
        {step === 5 && (
          <StepLaunch
            data={data}
            scripts={scripts}
            onFinish={() => navigate("/dashboard")}
          />
        )}
      </div>
    </div>
  );
}
