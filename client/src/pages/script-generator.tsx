import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Wand2, Copy, Check, Eye, Zap, ChevronDown, ChevronUp, Sparkles, Save, CheckCircle2,
} from "lucide-react";
import type { Campaign } from "@shared/schema";

interface GeneratedScript {
  hook: string;
  script: string;
  cta: string;
  angle: string;
  estimatedViews: string;
}

const toneOptions = [
  { value: "relatable", label: "Relatable / Casual" },
  { value: "excited", label: "Excited / Hype" },
  { value: "educational", label: "Educational / Informative" },
  { value: "funny", label: "Funny / Comedic" },
  { value: "emotional", label: "Emotional / Storytelling" },
  { value: "authoritative", label: "Expert / Authority" },
];

const countOptions = [3, 5, 10, 15, 20];

const exampleProducts = [
  { product: "Vitamin C Serum", niche: "skincare" },
  { product: "Pre-Workout Powder", niche: "fitness supplements" },
  { product: "Organic Dog Treats", niche: "pet care" },
  { product: "Specialty Coffee Kit", niche: "home & kitchen" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <Button size="icon" variant="ghost" onClick={copy} className="h-7 w-7 flex-shrink-0" data-testid="button-copy">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );
}

function ScriptCard({
  script, index, onSave, savedCampaignId, isSaving, isSaved,
}: {
  script: GeneratedScript;
  index: number;
  onSave: (s: GeneratedScript) => void;
  savedCampaignId: string;
  isSaving: boolean;
  isSaved: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-card-border" data-testid={`card-script-${index}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
            <Badge variant="outline" className="text-xs">{script.angle}</Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Eye className="w-3 h-3" /> {script.estimatedViews}
            </span>
          </div>
          <CopyButton text={`HOOK: ${script.hook}\n\nSCRIPT:\n${script.script}\n\nCTA: ${script.cta}`} />
        </div>

        <div className="space-y-3">
          <div className="bg-primary/10 rounded-md p-3 border border-primary/20">
            <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">Hook</div>
            <p className="text-sm font-medium leading-snug">{script.hook}</p>
          </div>

          {expanded && (
            <>
              <div className="bg-muted/40 rounded-md p-3">
                <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Full Script</div>
                <p className="text-sm leading-relaxed whitespace-pre-line">{script.script}</p>
              </div>
              <div className="bg-emerald-500/10 rounded-md p-3 border border-emerald-500/20">
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1 uppercase tracking-wide">CTA</div>
                <p className="text-sm font-medium">{script.cta}</p>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground w-full justify-center py-1 rounded-md hover-elevate"
          >
            {expanded
              ? <><ChevronUp className="w-3.5 h-3.5" /> Hide full script</>
              : <><ChevronDown className="w-3.5 h-3.5" /> View full script</>
            }
          </button>

          {savedCampaignId && (
            <Button
              size="sm"
              variant={isSaved ? "secondary" : "outline"}
              className="w-full gap-1.5 text-xs h-7"
              onClick={() => onSave(script)}
              disabled={isSaving || isSaved}
              data-testid={`button-save-script-${index}`}
            >
              {isSaved
                ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Saved to campaign</>
                : isSaving
                  ? "Saving..."
                  : <><Save className="w-3.5 h-3.5" /> Save to Campaign</>
              }
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ScriptGenerator() {
  const [product, setProduct] = useState("");
  const [niche, setNiche] = useState("");
  const [tone, setTone] = useState("relatable");
  const [count, setCount] = useState(5);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [scripts, setScripts] = useState<GeneratedScript[]>([]);
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: campaigns } = useQuery<Campaign[]>({ queryKey: ["/api/campaigns"] });

  const generateMutation = useMutation({
    mutationFn: async (params: { product: string; niche: string; tone: string; count: number }) => {
      const res = await apiRequest("POST", "/api/ai/scripts", params);
      return res.json() as Promise<{ scripts: GeneratedScript[] }>;
    },
    onSuccess: (data) => {
      setScripts(data.scripts ?? []);
      setSavedIndices(new Set());
      if (data.scripts?.length === 0) {
        toast({ title: "No scripts generated", description: "Try adjusting your product or niche.", variant: "destructive" });
      }
    },
    onError: (e: any) => {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ script, campaignId }: { script: GeneratedScript; campaignId: string }) => {
      const res = await apiRequest("POST", "/api/videos", {
        campaignId,
        hook: script.hook,
        script: script.script,
        angle: script.angle,
        cta: script.cta,
        platform: "instagram",
        status: "scripted",
        views: 0, likes: 0, shares: 0, revenue: 0,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    },
    onError: (e: any) => {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    },
  });

  async function handleSaveScript(script: GeneratedScript, index: number) {
    if (!selectedCampaign) return;
    setSavingIndex(index);
    try {
      await saveMutation.mutateAsync({ script, campaignId: selectedCampaign });
      setSavedIndices(prev => new Set(prev).add(index));
      toast({ title: "Script saved to campaign", description: "Ready to generate with Kling in Videos." });
    } finally {
      setSavingIndex(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product.trim() || !niche.trim()) return;
    setScripts([]);
    generateMutation.mutate({ product: product.trim(), niche: niche.trim(), tone, count });
  }

  function applyExample(ex: { product: string; niche: string }) {
    setProduct(ex.product);
    setNiche(ex.niche);
  }

  const copyAll = () => {
    const text = scripts.map((s, i) =>
      `--- Script ${i + 1} (${s.angle}) ---\nHOOK: ${s.hook}\n\nSCRIPT:\n${s.script}\n\nCTA: ${s.cta}\n`
    ).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "All scripts copied to clipboard" });
  };

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-script-generator">
            <Wand2 className="w-6 h-6 text-violet-500" />
            Script Generator
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate viral hooks and full video scripts — save them to a campaign to generate with Kling
          </p>
        </div>
        <Badge variant="secondary" className="gap-1 text-xs">
          <Sparkles className="w-3 h-3" />
          Powered by GPT
        </Badge>
      </div>

      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Generate Scripts</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sg-product">Product Name</Label>
                <Input
                  id="sg-product"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g. Vitamin C Brightening Serum"
                  data-testid="input-sg-product"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sg-niche">Niche / Category</Label>
                <Input
                  id="sg-niche"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. skincare, fitness, pet care"
                  data-testid="input-sg-niche"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tone / Style</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger data-testid="select-sg-tone"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {toneOptions.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Number of Scripts</Label>
                <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                  <SelectTrigger data-testid="select-sg-count"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {countOptions.map((n) => <SelectItem key={n} value={String(n)}>{n} scripts</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Save to Campaign</Label>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger data-testid="select-sg-campaign"><SelectValue placeholder="Choose campaign (optional)" /></SelectTrigger>
                  <SelectContent>
                    {campaigns?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
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
                  data-testid={`button-sg-example-${ex.product.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {ex.product}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                className="gap-2"
                disabled={generateMutation.isPending || !product.trim() || !niche.trim()}
                data-testid="button-generate-scripts"
              >
                {generateMutation.isPending
                  ? <><Wand2 className="w-4 h-4 animate-spin" /> Generating {count} scripts...</>
                  : <><Wand2 className="w-4 h-4" /> Generate {count} Scripts</>
                }
              </Button>
              {scripts.length > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={copyAll} className="gap-1" data-testid="button-copy-all">
                  <Copy className="w-3.5 h-3.5" /> Copy All
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {generateMutation.isPending && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(count > 6 ? 6 : count)].map((_, i) => (
            <Card key={i} className="border-card-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-24" /></div>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {scripts.length > 0 && !generateMutation.isPending && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm">{scripts.length} Scripts Generated</h2>
              <Badge variant="secondary" className="text-xs">{product} · {niche}</Badge>
            </div>
            <div className="flex items-center gap-3">
              {selectedCampaign && (
                <span className="text-xs text-muted-foreground">
                  {savedIndices.size}/{scripts.length} saved
                </span>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="w-3 h-3 text-primary" />
                Ready for Kling
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scripts.map((script, i) => (
              <ScriptCard
                key={i}
                script={script}
                index={i}
                onSave={(s) => handleSaveScript(s, i)}
                savedCampaignId={selectedCampaign}
                isSaving={savingIndex === i}
                isSaved={savedIndices.has(i)}
              />
            ))}
          </div>
        </div>
      )}

      {scripts.length === 0 && !generateMutation.isPending && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Wand2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Ready to generate scripts</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Enter your product and niche, pick a campaign to save scripts to, then hit Generate. GPT writes the hooks and scripts — save them to queue for Kling video generation.
          </p>
        </div>
      )}
    </div>
  );
}
