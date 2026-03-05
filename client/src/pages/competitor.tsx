import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Eye, AlertTriangle, CheckCircle2, Target, Copy,
  Zap, TrendingUp, Lightbulb, Shield, ChevronRight,
} from "lucide-react";

interface CompetitorResult {
  competitor: string;
  niche: string;
  topHooks: Array<{ hook: string; estimatedViews: string; angle: string; why: string }>;
  contentGaps: Array<{ gap: string; opportunity: string; difficulty: "easy" | "medium" | "hard" }>;
  postingPatterns: Array<{ insight: string; detail: string }>;
  stealTheseAngles: Array<{ angle: string; template: string; tip: string }>;
  weaknesses: string[];
  strengths: string[];
  summary: string;
}

const difficultyColors = {
  easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  hard: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

const exampleNiches = ["skincare", "fitness supplements", "pet care", "home & kitchen", "beauty"];
const exampleCompetitors = ["The Ordinary", "GNC", "PetSmart", "Ninja Kitchen", "e.l.f. Cosmetics"];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
      data-testid="button-copy-hook"
    >
      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function CompetitorIntelligence() {
  const [niche, setNiche] = useState("");
  const [competitor, setCompetitor] = useState("");
  const [result, setResult] = useState<CompetitorResult | null>(null);
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (params: { niche: string; competitor: string }) => {
      const res = await apiRequest("POST", "/api/ai/competitor", params);
      return res.json() as Promise<CompetitorResult>;
    },
    onSuccess: (data) => setResult(data),
    onError: (e: any) => toast({ title: "Analysis failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-competitor">
            <Search className="w-6 h-6 text-blue-500" />
            Competitor Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Analyze any competitor and extract their winning hooks, gaps, and angles you can steal
          </p>
        </div>
        <Badge variant="secondary" className="gap-1 text-xs">
          <Zap className="w-3 h-3" /> GPT-Powered
        </Badge>
      </div>

      <Card className="border-card-border">
        <CardContent className="p-5">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Your Niche</Label>
              <Input
                value={niche}
                onChange={e => setNiche(e.target.value)}
                placeholder="e.g. skincare, fitness supplements"
                data-testid="input-competitor-niche"
              />
              <div className="flex gap-1 flex-wrap">
                {exampleNiches.map(n => (
                  <button key={n} type="button" onClick={() => setNiche(n)}
                    className="text-xs px-2 py-0.5 rounded-full border border-border bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`chip-niche-${n}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Competitor Brand / Creator</Label>
              <Input
                value={competitor}
                onChange={e => setCompetitor(e.target.value)}
                placeholder="e.g. The Ordinary, CeraVe"
                data-testid="input-competitor-name"
              />
              <div className="flex gap-1 flex-wrap">
                {exampleCompetitors.map(c => (
                  <button key={c} type="button" onClick={() => setCompetitor(c)}
                    className="text-xs px-2 py-0.5 rounded-full border border-border bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`chip-competitor-${c.toLowerCase().replace(/\s/g, "-")}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button
            onClick={() => analyzeMutation.mutate({ niche: niche.trim(), competitor: competitor.trim() })}
            disabled={analyzeMutation.isPending || !niche.trim() || !competitor.trim()}
            className="gap-2"
            data-testid="button-analyze-competitor"
          >
            {analyzeMutation.isPending
              ? <><Search className="w-4 h-4 animate-pulse" /> Analyzing...</>
              : <><Search className="w-4 h-4" /> Analyze Competitor</>}
          </Button>
        </CardContent>
      </Card>

      {analyzeMutation.isPending && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-card-border animate-pulse">
              <CardContent className="p-5 space-y-3">
                <div className="h-4 bg-muted rounded w-32" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => <div key={j} className="h-3 bg-muted rounded" />)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {result && !analyzeMutation.isPending && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
            <p className="text-sm leading-relaxed">{result.summary}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" /> Their Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{s}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Their Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{w}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" /> Their Top Performing Hooks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.topHooks.map((h, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30 space-y-2" data-testid={`hook-row-${i}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug flex-1">"{h.hook}"</p>
                    <CopyBtn text={h.hook} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{h.angle}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {h.estimatedViews}
                    </span>
                    <span className="text-xs text-muted-foreground">· {h.why}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-emerald-500" /> Steal These Angles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.stealTheseAngles.map((a, i) => (
                <div key={i} className="p-3 rounded-lg border border-emerald-500/10 bg-emerald-500/5 space-y-2" data-testid={`angle-row-${i}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{a.angle}</span>
                    <CopyBtn text={a.template} />
                  </div>
                  <p className="text-sm font-mono bg-background/60 rounded px-2 py-1.5 text-muted-foreground">{a.template}</p>
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5" /> {a.tip}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-500" /> Content Gaps to Exploit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.contentGaps.map((g, i) => (
                  <div key={i} className="space-y-1" data-testid={`gap-row-${i}`}>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${difficultyColors[g.difficulty]}`}>{g.difficulty}</Badge>
                      <span className="text-xs font-medium">{g.gap}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-1">{g.opportunity}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" /> Their Posting Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.postingPatterns.map((p, i) => (
                  <div key={i} className="space-y-0.5" data-testid={`pattern-row-${i}`}>
                    <p className="text-xs font-semibold">{p.insight}</p>
                    <p className="text-xs text-muted-foreground">{p.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!result && !analyzeMutation.isPending && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Enter a competitor to analyze</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            GPT will surface their best hooks, content gaps you can exploit, and exact angles you can adapt for your brand.
          </p>
        </div>
      )}
    </div>
  );
}
