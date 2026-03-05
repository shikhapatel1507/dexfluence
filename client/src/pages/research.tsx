import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart2, TrendingUp, Lightbulb, Target,
  Flame, Eye, ChevronRight, Search, Sparkles, BookOpen,
} from "lucide-react";

interface ResearchResult {
  viralHooks: string[];
  topAngles: Array<{ angle: string; avgViews: string; conversionRate: string }>;
  trendingFormats: string[];
  competitorInsights: Array<{ hook: string; views: string; platform: string; why: string }>;
  recommendations: string[];
  niche: string;
  product: string;
}

const exampleProducts = [
  { product: "Vitamin C Serum", niche: "skincare" },
  { product: "Pre-Workout Powder", niche: "fitness supplements" },
  { product: "Organic Dog Treats", niche: "pet care" },
  { product: "Pour-Over Coffee Kit", niche: "home & kitchen" },
];

export default function Research() {
  const [product, setProduct] = useState("");
  const [niche, setNiche] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const { toast } = useToast();

  const researchMutation = useMutation({
    mutationFn: async ({ product, niche }: { product: string; niche: string }) => {
      const res = await apiRequest("POST", "/api/ai/research", { product, niche });
      return res.json() as Promise<ResearchResult>;
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (e: any) => {
      toast({ title: "Research failed", description: e.message, variant: "destructive" });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product.trim() || !niche.trim()) return;
    researchMutation.mutate({ product: product.trim(), niche: niche.trim() });
  }

  function applyExample(ex: { product: string; niche: string }) {
    setProduct(ex.product);
    setNiche(ex.niche);
  }

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-research">
            <BarChart2 className="w-6 h-6 text-blue-500" />
            Market Research
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-powered research — viral hooks, top angles, competitor content, and actionable strategy
          </p>
        </div>
        <Badge variant="secondary" className="gap-1 text-xs">
          <Sparkles className="w-3 h-3" />
          Powered by GPT
        </Badge>
      </div>

      <Card className="border-card-border">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="research-product">Product Name</Label>
                <Input
                  id="research-product"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g. Vitamin C Brightening Serum"
                  data-testid="input-research-product"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="research-niche">Niche / Category</Label>
                <Input
                  id="research-niche"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. skincare, fitness, pet care"
                  data-testid="input-research-niche"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Try:</span>
              {exampleProducts.map((ex) => (
                <button
                  key={ex.product}
                  type="button"
                  onClick={() => applyExample(ex)}
                  className="text-xs px-2 py-1 rounded-full border border-border bg-muted/50 text-muted-foreground hover-elevate cursor-pointer"
                  data-testid={`button-example-${ex.product.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {ex.product}
                </button>
              ))}
            </div>

            <Button
              type="submit"
              className="gap-2 w-full sm:w-auto"
              disabled={researchMutation.isPending || !product.trim() || !niche.trim()}
              data-testid="button-run-research"
            >
              {researchMutation.isPending ? (
                <><Search className="w-4 h-4 animate-pulse" /> Researching market...</>
              ) : (
                <><Search className="w-4 h-4" /> Run Research</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {researchMutation.isPending && (
        <div className="grid lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-card-border">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-8 w-full" />)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {result && !researchMutation.isPending && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground px-2">
              Results for <strong>{result.product}</strong> in <strong>{result.niche}</strong>
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-card-border" data-testid="card-viral-hooks">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Viral Hooks
                  <Badge variant="secondary" className="text-xs ml-auto">{result.viralHooks.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.viralHooks.map((hook, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2.5 rounded-md bg-muted/40 text-sm"
                    data-testid={`hook-item-${i}`}
                  >
                    <span className="text-xs text-muted-foreground mt-0.5 w-4 flex-shrink-0">{i + 1}.</span>
                    <span className="flex-1 leading-snug">{hook}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-card-border" data-testid="card-top-angles">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-500" />
                  Top Performing Angles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.topAngles.map((angle, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-md border border-card-border bg-card/30"
                    data-testid={`angle-item-${i}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-sm">{angle.angle}</span>
                      <Badge variant="outline" className="text-xs">{angle.conversionRate} CVR</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3" />
                      {angle.avgViews} avg views
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-card-border" data-testid="card-competitor-insights">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Competitor Content Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.competitorInsights.map((insight, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-md bg-muted/30 space-y-1.5"
                    data-testid={`insight-item-${i}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-xs">{insight.platform}</Badge>
                      <span className="text-xs font-medium text-primary">{insight.views} views</span>
                    </div>
                    <p className="text-sm font-medium leading-snug">"{insight.hook}"</p>
                    <p className="text-xs text-muted-foreground">{insight.why}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-card-border" data-testid="card-trending-formats">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    Trending Video Formats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {result.trendingFormats.map((format, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm py-1.5 border-b border-border/50 last:border-0"
                      data-testid={`format-item-${i}`}
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      {format}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-card-border border-primary/20 bg-primary/5" data-testid="card-recommendations">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {result.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm py-1"
                      data-testid={`rec-item-${i}`}
                    >
                      <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                        {i + 1}
                      </span>
                      {rec}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {!result && !researchMutation.isPending && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <BarChart2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Ready to research your market</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Enter your product and niche. GPT will surface viral hooks, top content angles, competitor examples, and strategic recommendations.
          </p>
        </div>
      )}
    </div>
  );
}
