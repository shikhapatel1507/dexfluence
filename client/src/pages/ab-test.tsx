import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  FlaskConical, Trophy, Eye, Heart, Share2, TrendingUp, Target, DollarSign,
  Zap, BarChart2, RefreshCw, ChevronRight,
} from "lucide-react";
import type { Video, Campaign } from "@shared/schema";

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toString();
}

interface HookStats {
  hook: string;
  views: number;
  likes: number;
  shares: number;
  revenue: number;
  engagementRate: number;
  cpm: number;
  conversionRate: number;
}

function generateStats(hook: string, isWinner: boolean): HookStats {
  const seed = hook.length + hook.charCodeAt(0);
  const base = isWinner ? 1.4 : 1.0;
  const views = Math.floor((seed * 1234 % 60000 + 15000) * base);
  const likes = Math.floor(views * (0.03 + (seed % 20) / 1000) * base);
  const shares = Math.floor(views * (0.006 + (seed % 10) / 2000) * base);
  const revenue = parseFloat((views * (0.004 + (seed % 5) / 1000) * base).toFixed(2));
  const engagementRate = parseFloat(((likes + shares) / views * 100).toFixed(2));
  const cpm = parseFloat((revenue / views * 1000).toFixed(2));
  const conversionRate = parseFloat((revenue / views * 100).toFixed(3));
  return { hook, views, likes, shares, revenue, engagementRate, cpm, conversionRate };
}

function StatBar({ label, valA, valB, higherIsBetter = true }: {
  label: string; valA: number; valB: number; higherIsBetter?: boolean;
}) {
  const max = Math.max(valA, valB);
  const pctA = max > 0 ? (valA / max) * 100 : 50;
  const pctB = max > 0 ? (valB / max) * 100 : 50;
  const aWins = higherIsBetter ? valA >= valB : valA <= valB;
  return (
    <div className="space-y-1" data-testid={`stat-bar-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{typeof valA === "number" && valA < 10 ? valA.toFixed(2) : fmt(Math.round(valA))}</span>
            {aWins && <Trophy className="w-3 h-3 text-amber-500" />}
          </div>
          <Progress value={pctA} className={`h-1.5 ${aWins ? "" : "opacity-50"}`} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            {!aWins && <Trophy className="w-3 h-3 text-amber-500" />}
            <span className={`font-medium ${!aWins ? "ml-auto" : ""}`}>{typeof valB === "number" && valB < 10 ? valB.toFixed(2) : fmt(Math.round(valB))}</span>
          </div>
          <Progress value={pctB} className={`h-1.5 ${!aWins ? "" : "opacity-50"}`} />
        </div>
      </div>
    </div>
  );
}

export default function AbTest() {
  const [hookA, setHookA] = useState("POV: I tried this serum for 30 days and my dark spots are GONE");
  const [hookB, setHookB] = useState("The $30 serum that replaced my $200 one");
  const [sourceA, setSourceA] = useState<string>("custom");
  const [sourceB, setSourceB] = useState<string>("custom");
  const [results, setResults] = useState<{ a: HookStats; b: HookStats } | null>(null);
  const [running, setRunning] = useState(false);

  const { data: videos } = useQuery<Video[]>({ queryKey: ["/api/videos"] });
  const { data: campaigns } = useQuery<Campaign[]>({ queryKey: ["/api/campaigns"] });

  const postedVideos = (videos ?? []).filter(v => v.status === "posted");

  function runTest() {
    if (!hookA.trim() || !hookB.trim()) return;
    setRunning(true);
    setResults(null);
    setTimeout(() => {
      const aWins = hookA.length > hookB.length ? Math.random() > 0.4 : Math.random() > 0.6;
      setResults({
        a: generateStats(hookA, aWins),
        b: generateStats(hookB, !aWins),
      });
      setRunning(false);
    }, 1800);
  }

  function pickFromLibrary(side: "a" | "b", videoId: string) {
    const video = postedVideos.find(v => v.id === videoId);
    if (!video) return;
    if (side === "a") { setHookA(video.hook); setSourceA(videoId); }
    else { setHookB(video.hook); setSourceB(videoId); }
  }

  const winner = results
    ? results.a.views > results.b.views ? "A" : "B"
    : null;

  return (
    <div className="p-6 space-y-6 max-w-[1000px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-ab-test">
            <FlaskConical className="w-6 h-6 text-violet-500" />
            A/B Hook Tester
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compare two hooks side-by-side to find your highest-performing angle
          </p>
        </div>
        <Badge variant="secondary" className="gap-1 text-xs">
          <BarChart2 className="w-3 h-3" /> Data-driven
        </Badge>
      </div>

      {/* Hook Input Panels */}
      <div className="grid sm:grid-cols-2 gap-4">
        {(["a", "b"] as const).map(side => {
          const hook = side === "a" ? hookA : hookB;
          const setHook = side === "a" ? setHookA : setHookB;
          const source = side === "a" ? sourceA : sourceB;
          const label = side === "a" ? "Hook A" : "Hook B";
          const color = side === "a" ? "text-blue-500 border-blue-500/30 bg-blue-500/5" : "text-violet-500 border-violet-500/30 bg-violet-500/5";
          const winnerBorder = winner === side.toUpperCase() ? (side === "a" ? "border-blue-500" : "border-violet-500") : "";
          return (
            <Card key={side} className={`border-2 ${winnerBorder || "border-card-border"}`} data-testid={`card-hook-${side}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>{label}</span>
                  {winner === side.toUpperCase() && (
                    <Badge className="ml-auto gap-1 text-xs bg-amber-500 hover:bg-amber-500">
                      <Trophy className="w-3 h-3" /> Winner
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {postedVideos.length > 0 && (
                  <Select
                    value={source}
                    onValueChange={v => v !== "custom" ? pickFromLibrary(side, v) : (side === "a" ? setSourceA("custom") : setSourceB("custom"))}
                  >
                    <SelectTrigger className="h-8 text-xs" data-testid={`select-hook-source-${side}`}>
                      <SelectValue placeholder="Pick from video library" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom hook</SelectItem>
                      {postedVideos.slice(0, 10).map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          <span className="text-xs truncate">{v.hook.slice(0, 48)}…</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Textarea
                  value={hook}
                  onChange={e => setHook(e.target.value)}
                  placeholder={`Enter hook ${label}...`}
                  className="text-sm resize-none min-h-[100px]"
                  data-testid={`input-hook-${side}`}
                />
                <div className="text-xs text-muted-foreground">
                  {hook.length} characters · {hook.split(" ").filter(Boolean).length} words
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Run Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          className="gap-2 px-8"
          onClick={runTest}
          disabled={running || !hookA.trim() || !hookB.trim()}
          data-testid="button-run-ab-test"
        >
          {running
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Running simulation...</>
            : <><FlaskConical className="w-4 h-4" /> Run A/B Test <ChevronRight className="w-4 h-4" /></>
          }
        </Button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
          {/* Winner Banner */}
          <Card className={`border-2 ${winner === "A" ? "border-blue-500 bg-blue-500/5" : "border-violet-500 bg-violet-500/5"}`} data-testid="card-winner">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${winner === "A" ? "bg-blue-500" : "bg-violet-500"}`}>
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Hook {winner} wins!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {winner === "A"
                      ? `+${Math.round((results.a.views / results.b.views - 1) * 100)}% more views than Hook B`
                      : `+${Math.round((results.b.views / results.a.views - 1) * 100)}% more views than Hook A`
                    }
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Est. top-line views</p>
                  <p className="font-bold">{fmt(winner === "A" ? results.a.views : results.b.views)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stat Comparison */}
          <Card className="border-card-border" data-testid="card-comparison">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Head-to-Head Comparison</CardTitle>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-xs text-center px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">Hook A</div>
                <div className="text-xs text-center px-2 py-1 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium">Hook B</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatBar label="Views" valA={results.a.views} valB={results.b.views} />
              <StatBar label="Likes" valA={results.a.likes} valB={results.b.likes} />
              <StatBar label="Shares" valA={results.a.shares} valB={results.b.shares} />
              <StatBar label="Revenue ($)" valA={results.a.revenue} valB={results.b.revenue} />
              <StatBar label="Engagement Rate (%)" valA={results.a.engagementRate} valB={results.b.engagementRate} />
              <StatBar label="Revenue / 1k Views ($)" valA={results.a.cpm} valB={results.b.cpm} />
            </CardContent>
          </Card>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Eye, label: "Views A vs B", valA: results.a.views, valB: results.b.views, color: "text-blue-500" },
              { icon: TrendingUp, label: "Engagement A vs B", valA: results.a.engagementRate, valB: results.b.engagementRate, color: "text-violet-500" },
              { icon: DollarSign, label: "Revenue A vs B", valA: results.a.revenue, valB: results.b.revenue, color: "text-emerald-500" },
              { icon: Target, label: "CPM A vs B", valA: results.a.cpm, valB: results.b.cpm, color: "text-orange-500" },
            ].map(s => (
              <Card key={s.label} className="border-card-border">
                <CardContent className="p-3">
                  <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="font-bold text-blue-500">{s.valA < 10 ? s.valA.toFixed(2) : fmt(Math.round(s.valA))}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="font-bold text-violet-500">{s.valB < 10 ? s.valB.toFixed(2) : fmt(Math.round(s.valB))}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setResults(null)} data-testid="button-reset-test">
              <RefreshCw className="w-3.5 h-3.5" /> Run Another Test
            </Button>
          </div>
        </div>
      )}

      {!results && !running && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <FlaskConical className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Enter two hooks and run the test</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Paste your hooks above or pull from your video library. The simulator projects views, engagement, and revenue for each.
          </p>
        </div>
      )}
    </div>
  );
}
