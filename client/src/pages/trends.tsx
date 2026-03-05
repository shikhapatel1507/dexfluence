import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp, Zap, Copy, CheckCircle2, Clock, Radio,
  Package, Music, Target, Flame,
} from "lucide-react";

interface TrendRadarResult {
  niche: string;
  trendingHooks: Array<{ hook: string; trendScore: number; momentum: "rising" | "peak" | "declining"; estimatedViews: string }>;
  trendingProducts: Array<{ product: string; reason: string; urgency: "hot" | "warm" | "watch" }>;
  trendingFormats: Array<{ format: string; description: string; exampleHook: string }>;
  trendingSounds: Array<{ sound: string; type: string; usage: string }>;
  winningAngles: Array<{ angle: string; why: string; estimatedConversion: string }>;
  weeklyInsight: string;
  bestPostingTimes: Array<{ day: string; time: string; reason: string }>;
}

const momentumColors = {
  rising: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  peak: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  declining: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

const urgencyColors = {
  hot: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  warm: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  watch: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

const niches = ["skincare", "fitness supplements", "pet care", "home & kitchen", "beauty", "wellness", "fashion", "tech accessories"];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0" data-testid="button-copy-trend">
      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function TrendRadar() {
  const [niche, setNiche] = useState("");
  const [result, setResult] = useState<TrendRadarResult | null>(null);
  const { toast } = useToast();

  const trendMutation = useMutation({
    mutationFn: async (n: string) => {
      const res = await apiRequest("POST", "/api/ai/trends", { niche: n });
      return res.json() as Promise<TrendRadarResult>;
    },
    onSuccess: (data) => setResult(data),
    onError: (e: any) => toast({ title: "Trend scan failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-trends">
            <Radio className="w-6 h-6 text-rose-500" />
            Trend Radar
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Scan what's trending right now in any niche — hooks, products, formats, and winning angles
          </p>
        </div>
        <Badge variant="secondary" className="gap-1 text-xs">
          <Zap className="w-3 h-3" /> Live AI Scan
        </Badge>
      </div>

      <Card className="border-card-border">
        <CardContent className="p-5">
          <div className="space-y-3">
            <Label>Niche to Scan</Label>
            <div className="flex gap-2">
              <Input
                value={niche}
                onChange={e => setNiche(e.target.value)}
                placeholder="e.g. skincare, fitness, pet care"
                className="flex-1"
                data-testid="input-trend-niche"
                onKeyDown={e => e.key === "Enter" && niche.trim() && trendMutation.mutate(niche.trim())}
              />
              <Button
                onClick={() => trendMutation.mutate(niche.trim())}
                disabled={trendMutation.isPending || !niche.trim()}
                className="gap-2"
                data-testid="button-scan-trends"
              >
                {trendMutation.isPending
                  ? <><Radio className="w-4 h-4 animate-pulse" /> Scanning...</>
                  : <><Radio className="w-4 h-4" /> Scan Trends</>}
              </Button>
            </div>
            <div className="flex gap-1 flex-wrap">
              {niches.map(n => (
                <button key={n} onClick={() => setNiche(n)}
                  className="text-xs px-2 py-0.5 rounded-full border border-border bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid={`chip-niche-${n}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {trendMutation.isPending && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-card-border animate-pulse">
              <CardContent className="p-5 space-y-3">
                <div className="h-4 bg-muted rounded w-36" />
                <div className="space-y-2">{[...Array(3)].map((_, j) => <div key={j} className="h-3 bg-muted rounded" />)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {result && !trendMutation.isPending && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/15 flex items-start gap-3">
            <Flame className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">This Week's Key Insight</p>
              <p className="text-sm">{result.weeklyInsight}</p>
            </div>
          </div>

          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Trending Hooks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.trendingHooks.map((h, i) => (
                <div key={i} className="flex items-center gap-3" data-testid={`trending-hook-${i}`}>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium leading-snug flex-1">"{h.hook}"</p>
                      <CopyBtn text={h.hook} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Progress value={h.trendScore} className="h-1.5 w-20" />
                      <span className="text-xs text-muted-foreground">{h.trendScore}/100</span>
                      <Badge className={`text-xs ${momentumColors[h.momentum]}`}>{h.momentum}</Badge>
                      <span className="text-xs text-muted-foreground">{h.estimatedViews}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4 text-violet-500" /> Trending Products
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.trendingProducts.map((p, i) => (
                  <div key={i} className="space-y-1" data-testid={`trending-product-${i}`}>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${urgencyColors[p.urgency]}`}>{p.urgency}</Badge>
                      <span className="text-sm font-medium">{p.product}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-500" /> Winning Angles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.winningAngles.map((a, i) => (
                  <div key={i} className="space-y-1" data-testid={`winning-angle-${i}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{a.angle}</span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{a.estimatedConversion}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.why}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" /> Trending Formats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.trendingFormats.map((f, i) => (
                  <div key={i} className="space-y-1.5" data-testid={`trending-format-${i}`}>
                    <p className="text-sm font-semibold">{f.format}</p>
                    <p className="text-xs text-muted-foreground">{f.description}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Example:</span>
                      <p className="text-xs italic text-foreground/80">"{f.exampleHook}"</p>
                      <CopyBtn text={f.exampleHook} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Music className="w-4 h-4 text-pink-500" /> Trending Audio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.trendingSounds.map((s, i) => (
                  <div key={i} className="space-y-0.5" data-testid={`trending-sound-${i}`}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{s.type}</Badge>
                      <span className="text-sm font-medium">{s.sound}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.usage}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Best Posting Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap">
                {result.bestPostingTimes.map((t, i) => (
                  <div key={i} className="flex-1 min-w-[160px] p-3 rounded-lg bg-muted/30 space-y-1" data-testid={`posting-time-${i}`}>
                    <p className="text-sm font-semibold">{t.day}</p>
                    <p className="text-xs text-primary font-medium">{t.time}</p>
                    <p className="text-xs text-muted-foreground">{t.reason}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!result && !trendMutation.isPending && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Radio className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Scan any niche for trends</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Get trending hooks, rising products, viral formats, and the best posting times — updated with each scan.
          </p>
        </div>
      )}
    </div>
  );
}
