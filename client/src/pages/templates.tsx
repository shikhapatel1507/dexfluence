import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Search, Copy, Check, Wand2, ArrowRight, Sparkles,
  Flame, Heart, Dumbbell, Dog, Coffee, Leaf,
} from "lucide-react";

interface Template {
  id: string;
  niche: string;
  angle: string;
  hook: string;
  estimatedViews: string;
  difficulty: "easy" | "medium" | "hard";
}

const NICHES = ["All", "Skincare", "Fitness", "Supplements", "Pet Care", "Kitchen", "Beauty"];

const NICHE_ICONS: Record<string, React.ElementType> = {
  Skincare: Leaf,
  Fitness: Dumbbell,
  Supplements: Flame,
  "Pet Care": Dog,
  Kitchen: Coffee,
  Beauty: Heart,
};

const DIFFICULTY_COLORS = {
  easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  hard: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

const TEMPLATES: Template[] = [
  { id: "1", niche: "Skincare", angle: "Transformation Reveal", hook: "POV: I tried this serum for 30 days and my dark spots are GONE", estimatedViews: "80k–280k", difficulty: "easy" },
  { id: "2", niche: "Skincare", angle: "Comparison", hook: "The $30 serum that replaced my $200 one (dermatologist approved)", estimatedViews: "120k–350k", difficulty: "easy" },
  { id: "3", niche: "Skincare", angle: "Problem-Solution", hook: "If you have hyperpigmentation, stop scrolling — this is for you", estimatedViews: "60k–180k", difficulty: "medium" },
  { id: "4", niche: "Skincare", angle: "Day-in-Life", hook: "The morning routine that gave me glass skin in 2 weeks", estimatedViews: "90k–240k", difficulty: "easy" },
  { id: "5", niche: "Skincare", angle: "Honest Review", hook: "Dermatologist approved? I put it to the test for 60 days", estimatedViews: "70k–200k", difficulty: "medium" },
  { id: "6", niche: "Skincare", angle: "Authority", hook: "Why every esthetician recommends THIS vitamin C serum", estimatedViews: "50k–150k", difficulty: "hard" },
  { id: "7", niche: "Fitness", angle: "Results Reveal", hook: "I trained with this pre-workout for 30 days — here's my honest review", estimatedViews: "80k–260k", difficulty: "easy" },
  { id: "8", niche: "Fitness", angle: "Comparison", hook: "Tested 5 pre-workouts — this one hit completely different", estimatedViews: "100k–320k", difficulty: "medium" },
  { id: "9", niche: "Fitness", angle: "Challenge", hook: "30-day transformation using only this supplement — week 4 update", estimatedViews: "140k–400k", difficulty: "hard" },
  { id: "10", niche: "Fitness", angle: "Problem-Solution", hook: "Why you're not getting stronger (and the protein that fixed it for me)", estimatedViews: "60k–180k", difficulty: "medium" },
  { id: "11", niche: "Supplements", angle: "Science Explainer", hook: "The one supplement every doctor says you're probably deficient in", estimatedViews: "90k–300k", difficulty: "hard" },
  { id: "12", niche: "Supplements", angle: "Honest Review", hook: "I took this collagen for 60 days — here's what actually changed", estimatedViews: "80k–220k", difficulty: "easy" },
  { id: "13", niche: "Supplements", angle: "Day-in-Life", hook: "My morning supplement stack that changed everything (backed by labs)", estimatedViews: "70k–190k", difficulty: "medium" },
  { id: "14", niche: "Pet Care", angle: "Dog's Reaction", hook: "My dog literally won't stop begging for these treats", estimatedViews: "150k–500k", difficulty: "easy" },
  { id: "15", niche: "Pet Care", angle: "Vet Approved", hook: "The only grain-free treat my vet actually recommends", estimatedViews: "80k–250k", difficulty: "medium" },
  { id: "16", niche: "Pet Care", angle: "Comparison", hook: "I bought 6 dog treat brands — my golden's reaction says it all", estimatedViews: "200k–600k", difficulty: "easy" },
  { id: "17", niche: "Kitchen", angle: "Morning Ritual", hook: "The coffee upgrade that completely changed my mornings", estimatedViews: "80k–240k", difficulty: "easy" },
  { id: "18", niche: "Kitchen", angle: "Taste Test", hook: "I brew 5 cups a day — this kit makes every single one perfect", estimatedViews: "60k–180k", difficulty: "medium" },
  { id: "19", niche: "Kitchen", angle: "Gift Idea", hook: "The best gift I've ever given a coffee lover (they cried)", estimatedViews: "90k–280k", difficulty: "easy" },
  { id: "20", niche: "Beauty", angle: "Get Ready With Me", hook: "GRWM using only products under $40 — my full makeup routine", estimatedViews: "100k–350k", difficulty: "easy" },
  { id: "21", niche: "Beauty", angle: "Dupe Alert", hook: "I found the $18 dupe for the $85 Charlotte Tilbury blush", estimatedViews: "180k–550k", difficulty: "medium" },
  { id: "22", niche: "Beauty", angle: "Honest Review", hook: "I wore this concealer for 12 hours in Texas heat — honest review", estimatedViews: "80k–260k", difficulty: "easy" },
];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      data-testid="button-copy-hook"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function Templates() {
  const [selectedNiche, setSelectedNiche] = useState("All");
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const filtered = TEMPLATES.filter(t => {
    if (selectedNiche !== "All" && t.niche !== selectedNiche) return false;
    if (search && !t.hook.toLowerCase().includes(search.toLowerCase()) && !t.angle.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function sendToGenerator(template: Template) {
    const params = new URLSearchParams({ hook: template.hook, niche: template.niche.toLowerCase() });
    navigate(`/scripts?${params.toString()}`);
    toast({ title: "Template loaded in Script Generator", description: "Hook pre-filled — add your product and generate." });
  }

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-templates">
            <BookOpen className="w-6 h-6 text-amber-500" />
            Content Template Library
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {TEMPLATES.length} proven hooks organized by niche — one click to load in Script Generator
          </p>
        </div>
        <Badge variant="secondary" className="gap-1 text-xs">
          <Sparkles className="w-3 h-3" /> {TEMPLATES.length} Templates
        </Badge>
      </div>

      {/* Search + Niche Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder="Search hooks or angles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-template-search"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {NICHES.map(niche => {
            const Icon = NICHE_ICONS[niche];
            return (
              <button
                key={niche}
                onClick={() => setSelectedNiche(niche)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${selectedNiche === niche ? "bg-primary text-primary-foreground border-primary" : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-foreground/20"}`}
                data-testid={`filter-niche-${niche.toLowerCase().replace(/\s/g, "-")}`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {niche}
              </button>
            );
          })}
        </div>
        {filtered.length !== TEMPLATES.length && (
          <Badge variant="secondary" className="text-xs ml-auto">{filtered.length} shown</Badge>
        )}
      </div>

      {/* Templates Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="font-semibold mb-1">No templates found</p>
          <p className="text-sm text-muted-foreground">Try clearing your search or picking a different niche</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => {
            const Icon = NICHE_ICONS[t.niche] ?? BookOpen;
            return (
              <Card key={t.id} className="border-card-border hover-elevate group" data-testid={`card-template-${t.id}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold">{t.niche}</span>
                        <p className="text-xs text-muted-foreground leading-tight">{t.angle}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs ${DIFFICULTY_COLORS[t.difficulty]}`}>{t.difficulty}</Badge>
                  </div>

                  <div className="bg-muted/40 rounded-md p-3">
                    <p className="text-sm font-medium leading-snug">{t.hook}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Est. {t.estimatedViews} views</span>
                    <CopyBtn text={t.hook} />
                  </div>

                  <Button
                    size="sm"
                    className="w-full gap-1.5 text-xs h-7"
                    onClick={() => sendToGenerator(t)}
                    data-testid={`button-use-template-${t.id}`}
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Use in Script Generator <ArrowRight className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
