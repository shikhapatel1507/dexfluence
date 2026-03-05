import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Campaign } from "@shared/schema";
import {
  Globe, Instagram, Wand2, Zap, Copy, CheckCircle2, Package,
  TrendingUp, Tag, ExternalLink, Plus, Search, AlertCircle,
  ShoppingBag,
} from "lucide-react";

interface DiscoveredProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  niche: string;
  tags: string[];
  imageUrl: string | null;
  sourceUrl: string;
  confidence: "high" | "medium" | "low";
  viralPotential: "high" | "medium" | "low";
  suggestedHook: string;
}

interface DiscoveryResult {
  products: DiscoveredProduct[];
  sourceType: "instagram" | "website";
  sourceName: string;
  error?: string;
}

const confidenceColors = {
  high: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low: "bg-muted text-muted-foreground",
};

const viralColors = {
  high: "text-rose-500",
  medium: "text-amber-500",
  low: "text-muted-foreground",
};

const EXAMPLE_SOURCES = [
  { label: "Gymshark", url: "gymshark.com", type: "website" as const },
  { label: "The Ordinary", url: "theordinary.com", type: "website" as const },
  { label: "SKIMS", url: "skims.com", type: "website" as const },
  { label: "@cerave", url: "instagram.com/cerave", type: "instagram" as const },
  { label: "@gymshark", url: "instagram.com/gymshark", type: "instagram" as const },
  { label: "@fashionnova", url: "instagram.com/fashionnova", type: "instagram" as const },
];

function ProductCard({
  product, campaigns, onScripts, onCampaign,
}: {
  product: DiscoveredProduct;
  campaigns: Campaign[];
  onScripts: (p: DiscoveredProduct) => void;
  onCampaign: (p: DiscoveredProduct, campaignId: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState("");

  function copyHook() {
    navigator.clipboard.writeText(product.suggestedHook);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card className="border-card-border hover-elevate flex flex-col" data-testid={`card-product-${product.id}`}>
      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">{product.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{product.price} · {product.category}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge className={`text-xs ${confidenceColors[product.confidence]}`}>
              {product.confidence} confidence
            </Badge>
            <span className={`text-xs font-medium flex items-center gap-1 ${viralColors[product.viralPotential]}`}>
              <TrendingUp className="w-3 h-3" /> {product.viralPotential} viral
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{product.description}</p>

        <div className="flex items-center gap-1 flex-wrap">
          <Badge variant="secondary" className="text-xs">{product.niche}</Badge>
          {product.tags.slice(0, 3).map(t => (
            <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground flex items-center gap-0.5">
              <Tag className="w-2.5 h-2.5" />{t}
            </span>
          ))}
        </div>

        <div className="rounded-md bg-primary/5 border border-primary/15 p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-primary font-medium mb-0.5">Suggested Hook</p>
              <p className="text-xs italic leading-snug">"{product.suggestedHook}"</p>
            </div>
            <button onClick={copyHook} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5" data-testid={`button-copy-hook-${product.id}`}>
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="mt-auto space-y-2 pt-1">
          <Button
            size="sm"
            className="w-full gap-1.5 text-xs h-8"
            onClick={() => onScripts(product)}
            data-testid={`button-generate-scripts-${product.id}`}
          >
            <Wand2 className="w-3.5 h-3.5" /> Generate Scripts
          </Button>

          {campaigns.length > 0 && (
            <div className="flex gap-1.5">
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="h-8 text-xs flex-1" data-testid={`select-campaign-${product.id}`}>
                  <SelectValue placeholder="Pick campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2.5 text-xs gap-1"
                disabled={!selectedCampaign}
                onClick={() => selectedCampaign && onCampaign(product, selectedCampaign)}
                data-testid={`button-add-campaign-${product.id}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductDiscovery() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: campaigns } = useQuery<Campaign[]>({ queryKey: ["/api/campaigns"] });

  const discoverMutation = useMutation({
    mutationFn: async (inputUrl: string) => {
      const res = await apiRequest("POST", "/api/products/discover", { url: inputUrl });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Discovery failed");
      }
      return res.json() as Promise<DiscoveryResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.products.length === 0) {
        toast({ title: "No products found", description: "Try a different URL or check the link is correct.", variant: "destructive" });
      } else {
        toast({ title: `${data.products.length} products discovered`, description: `From ${data.sourceName}` });
      }
    },
    onError: (e: any) => toast({ title: "Discovery failed", description: e.message, variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ product, campaignId }: { product: DiscoveredProduct; campaignId: string }) => {
      const res = await apiRequest("POST", "/api/videos", {
        campaignId,
        hook: product.suggestedHook,
        script: `Product: ${product.name}\n\n${product.description}`,
        angle: "product-showcase",
        cta: "Shop the link in bio!",
        platform: "instagram",
        status: "scripted",
        views: 0, likes: 0, shares: 0, revenue: 0,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({ title: "Added to campaign", description: "Video queued in the selected campaign." });
    },
    onError: () => toast({ title: "Failed to add", variant: "destructive" }),
  });

  function handleScripts(product: DiscoveredProduct) {
    const params = new URLSearchParams({
      product: product.name,
      niche: product.niche,
    });
    navigate(`/scripts?${params.toString()}`);
  }

  function handleSubmit(inputUrl = url) {
    const trimmed = inputUrl.trim();
    if (!trimmed) return;
    setResult(null);
    const normalized = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    discoverMutation.mutate(normalized);
    setUrl(normalized);
  }

  const sourceTypeIcon = result?.sourceType === "instagram" ? Instagram : Globe;
  const SourceIcon = sourceTypeIcon;

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-products">
            <ShoppingBag className="w-6 h-6 text-violet-500" />
            Product Discovery
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Paste any website or Instagram link — AI extracts products and generates content-ready hooks instantly
          </p>
        </div>
        <Badge variant="secondary" className="gap-1 text-xs">
          <Zap className="w-3 h-3" /> AI-Powered
        </Badge>
      </div>

      <Card className="border-card-border">
        <CardContent className="p-5 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {url.includes("instagram.com")
                  ? <Instagram className="w-4 h-4 text-pink-500" />
                  : <Globe className="w-4 h-4 text-muted-foreground" />}
              </div>
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="gymshark.com  or  instagram.com/cerave"
                className="pl-9"
                data-testid="input-product-url"
              />
            </div>
            <Button
              onClick={() => handleSubmit()}
              disabled={discoverMutation.isPending || !url.trim()}
              className="gap-2 shrink-0"
              data-testid="button-discover-products"
            >
              {discoverMutation.isPending
                ? <><Search className="w-4 h-4 animate-pulse" /> Scanning...</>
                : <><Search className="w-4 h-4" /> Discover Products</>}
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Try these examples:</Label>
            <div className="flex gap-2 flex-wrap">
              {EXAMPLE_SOURCES.map(ex => (
                <button
                  key={ex.url}
                  onClick={() => handleSubmit(ex.url)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-muted/80 transition-colors"
                  data-testid={`chip-example-${ex.label.toLowerCase().replace(/[@\s]/g, "-")}`}
                >
                  {ex.type === "instagram"
                    ? <Instagram className="w-3 h-3 text-pink-500" />
                    : <Globe className="w-3 h-3 text-blue-500" />}
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p><span className="font-medium text-foreground">Websites:</span> AI reads the page and extracts real products, prices, and descriptions.</p>
              <p><span className="font-medium text-foreground">Instagram links:</span> AI infers products from the brand handle and niche. Works for any public profile.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {discoverMutation.isPending && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="w-4 h-4 animate-pulse text-violet-500" />
            Scanning {url.includes("instagram.com") ? "Instagram profile" : "website"} for products...
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-card-border animate-pulse">
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="space-y-1.5">
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-4/5" />
                  </div>
                  <div className="h-12 bg-muted/50 rounded-md" />
                  <div className="h-8 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {result && !discoverMutation.isPending && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <SourceIcon className={`w-4 h-4 ${result.sourceType === "instagram" ? "text-pink-500" : "text-blue-500"}`} />
              <span className="font-semibold text-sm">{result.sourceName}</span>
              <Badge variant="secondary" className="text-xs">{result.products.length} products found</Badge>
              {result.sourceType === "instagram" && (
                <Badge variant="outline" className="text-xs gap-1">
                  <AlertCircle className="w-3 h-3" /> AI-inferred
                </Badge>
              )}
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-source-url"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View source
            </a>
          </div>

          {result.products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No products detected</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                This page may not have product listings, or it's blocking automated access. Try the full store URL or a specific product page.
              </p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => setResult(null)} data-testid="button-try-again">
                <Search className="w-4 h-4" /> Try another URL
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {result.products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  campaigns={campaigns ?? []}
                  onScripts={handleScripts}
                  onCampaign={(p, campaignId) => saveMutation.mutate({ product: p, campaignId })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!result && !discoverMutation.isPending && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Paste any link to discover products</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Works with any e-commerce website or Instagram profile. AI reads the page, extracts products,
            and generates viral hooks so you can create content in one click.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>Any website</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground" />
            <div className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-500" />
              <span>Instagram profiles</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground" />
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-violet-500" />
              <span>Instant hooks</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
