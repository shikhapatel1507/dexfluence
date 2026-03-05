import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap, TrendingUp, Users, Video, ArrowRight, Check,
  Play, Layers, Bot, Send, BarChart2, Star, ChevronDown,
  Calculator, DollarSign, Clock, Shield,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(current));
        }, 2000 / steps);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{prefix}{count >= 1000 ? (count / 1000).toFixed(count >= 10000 ? 0 : 1) + "k" : count}{suffix}</span>;
}

const steps = [
  { icon: BarChart2, tool: "OpenAI", color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/20", iconColor: "text-blue-400", title: "Research & Analyze", desc: "AI scrapes viral hooks and angles in your niche. Competitor research, trend analysis, and winning formats extracted automatically." },
  { icon: Bot, tool: "GPT-5.2", color: "from-violet-500/20 to-violet-600/10", border: "border-violet-500/20", iconColor: "text-violet-400", title: "Script & Hook Generation", desc: "AI generates hundreds of unique scripts, viral hooks, and creator angles optimized for Instagram Shop conversions." },
  { icon: Video, tool: "Kling 2.6", color: "from-pink-500/20 to-pink-600/10", border: "border-pink-500/20", iconColor: "text-pink-400", title: "AI Video Creation", desc: "Motion control AI generates full product videos with your creator avatars. No actors, no shoots, no waiting." },
  { icon: Send, tool: "Auto-Post", color: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/20", iconColor: "text-emerald-400", title: "Auto-Post at Scale", desc: "Agents automatically post 300+ videos daily across hundreds of creator profiles. GMV compounds 24/7." },
];

const pricing = [
  { name: "Starter", price: 97, videos: "Up to 30 videos/day", agents: "5 AI Agents", campaigns: "2 Campaigns", features: ["AI Market Research", "AI Hook Generation", "Script Generator", "Basic Analytics", "Email Support"], cta: "Start Free Trial", highlight: false },
  { name: "Growth", price: 297, videos: "Up to 150 videos/day", agents: "25 AI Agents", campaigns: "10 Campaigns", features: ["All Starter Features", "Kling Video Generation", "Kanban Pipeline", "Multi-Platform Posting", "Priority Support", "Custom Avatars"], cta: "Get Growth", highlight: true },
  { name: "Scale", price: 697, videos: "Unlimited videos/day", agents: "Unlimited Agents", campaigns: "Unlimited", features: ["All Growth Features", "Dedicated Infrastructure", "White-label Option", "24/7 Slack Support", "Strategy Calls", "Custom Integrations"], cta: "Contact Sales", highlight: false },
];

const testimonials = [
  { name: "Marcus D.", brand: "GlowLab Skincare", gmv: "$142k", timeframe: "in 60 days", text: "We went from 2 videos/week to 200/day. Our GMV exploded. This is the Instagram Shop advantage I was looking for." },
  { name: "Priya S.", brand: "FitNation Supplements", gmv: "$88k", timeframe: "in 45 days", text: "Replaced a $30k/month influencer spend with a $300 AI workflow. The ROI is insane." },
  { name: "Jake T.", brand: "PetPure Organics", gmv: "$56k", timeframe: "in 30 days", text: "The content quality is unreal. Our customers genuinely can't tell the difference from human creators." },
];

const faqItems = [
  { q: "How long does it take to set up?", a: "Most brands are fully operational within 24 hours. You connect your Instagram Shop, choose your product niche, and the AI starts generating scripts and videos immediately. Our onboarding team handles the technical setup." },
  { q: "Are the AI videos detectable as AI-generated?", a: "No. Kling 2.6 produces photorealistic motion video with natural creator behavior. Our customers consistently report that their audiences can't distinguish between human UGC and AI-generated content." },
  { q: "What niches work best?", a: "Skincare, supplements, fitness, pet products, kitchen gadgets, and beauty consistently perform best on Instagram Shop. Our AI market research tool identifies the highest-converting angles for your specific product." },
  { q: "Do I need any technical experience?", a: "Zero. The platform is fully managed. You provide the product and we handle research, scripting, video generation, and posting. No coding, no editing, no hiring." },
  { q: "Can I use my own creator profiles?", a: "Yes. You can connect existing creator accounts or let us spin up fresh AI profiles. Both approaches work well — existing accounts get immediate traction from their followers." },
  { q: "What's the cancellation policy?", a: "Cancel anytime, no questions asked. We don't lock you into contracts because our results speak for themselves. Most customers see positive GMV within the first 2 weeks." },
];

const beforeAfter = [
  { aspect: "Content Volume", before: "2–5 videos/week", after: "300+ videos/day" },
  { aspect: "Cost Per Video", before: "$75–150 (human UGC)", after: "$6.50 (AI)" },
  { aspect: "Production Time", before: "3–7 days per video", after: "~4 minutes" },
  { aspect: "Creator Management", before: "Full team required", after: "Zero human oversight" },
  { aspect: "A/B Testing", before: "1–2 angles at a time", after: "100+ simultaneous angles" },
  { aspect: "Monthly Cost", before: "$15k–50k", after: "$97–697" },
];

const NICHES: Record<string, { cvrMultiplier: number; avgOrderValue: number }> = {
  "Skincare": { cvrMultiplier: 1.2, avgOrderValue: 38 },
  "Supplements": { cvrMultiplier: 1.1, avgOrderValue: 52 },
  "Pet Products": { cvrMultiplier: 1.0, avgOrderValue: 34 },
  "Fitness": { cvrMultiplier: 0.95, avgOrderValue: 67 },
  "Kitchen": { cvrMultiplier: 0.9, avgOrderValue: 45 },
  "Beauty": { cvrMultiplier: 1.15, avgOrderValue: 41 },
};

function RoiCalculator() {
  const [niche, setNiche] = useState("Skincare");
  const [videosPerDay, setVideosPerDay] = useState(100);
  const [avgOrderValue, setAvgOrderValue] = useState(38);

  const viewsPerVideo = 8500;
  const ctr = 0.018;
  const cvr = 0.105 * (NICHES[niche]?.cvrMultiplier ?? 1);
  const costPerVideo = 6.5;

  const monthlyVideos = videosPerDay * 30;
  const monthlyViews = monthlyVideos * viewsPerVideo;
  const monthlyClicks = monthlyViews * ctr;
  const monthlyOrders = monthlyClicks * cvr;
  const monthlyGmv = monthlyOrders * avgOrderValue;
  const monthlyCost = monthlyVideos * costPerVideo;
  const roas = monthlyGmv / monthlyCost;
  const humanCost = monthlyVideos * 75;
  const savings = humanCost - monthlyCost;

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-card-border rounded-2xl p-8 max-w-3xl mx-auto">
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="space-y-2">
          <label className="text-sm font-medium">Product Niche</label>
          <select
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={niche}
            onChange={e => { setNiche(e.target.value); setAvgOrderValue(NICHES[e.target.value]?.avgOrderValue ?? 38); }}
            data-testid="select-roi-niche"
          >
            {Object.keys(NICHES).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Videos Per Day: <span className="text-primary font-bold">{videosPerDay}</span></label>
          <input
            type="range" min={10} max={500} step={10}
            value={videosPerDay}
            onChange={e => setVideosPerDay(Number(e.target.value))}
            className="w-full accent-primary"
            data-testid="range-roi-videos"
          />
          <div className="flex justify-between text-xs text-muted-foreground"><span>10</span><span>500</span></div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Avg Order Value: <span className="text-primary font-bold">${avgOrderValue}</span></label>
          <input
            type="range" min={10} max={200} step={5}
            value={avgOrderValue}
            onChange={e => setAvgOrderValue(Number(e.target.value))}
            className="w-full accent-primary"
            data-testid="range-roi-aov"
          />
          <div className="flex justify-between text-xs text-muted-foreground"><span>$10</span><span>$200</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Monthly Videos", value: monthlyVideos.toLocaleString(), color: "text-primary" },
          { label: "Monthly GMV", value: `$${monthlyGmv >= 1000 ? (monthlyGmv / 1000).toFixed(0) + "k" : monthlyGmv.toFixed(0)}`, color: "text-emerald-400" },
          { label: "ROAS", value: `${roas.toFixed(1)}x`, color: "text-violet-400" },
          { label: "Savings vs. UGC", value: `$${(savings / 1000).toFixed(0)}k/mo`, color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="bg-background/60 rounded-xl p-4 text-center border border-border/50">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Projections based on platform averages: {(viewsPerVideo / 1000).toFixed(0)}k views/video, {(ctr * 100).toFixed(1)}% CTR, {(cvr * 100).toFixed(1)}% CVR for {niche}
      </p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(o => !o)}
        data-testid={`faq-${q.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`}
      >
        <span className="font-medium text-sm pr-4">{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</div>
      )}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-base">Dexfluence</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#roi-calculator" className="hover:text-foreground transition-colors">ROI Calculator</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard"><Button variant="ghost" size="sm" data-testid="link-nav-login">Dashboard</Button></Link>
            <Link href="/onboarding"><Button size="sm" data-testid="button-nav-cta">Start Free Trial</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-violet-600/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/6 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">
          <Badge variant="secondary" className="mb-6 text-xs font-medium" data-testid="badge-hero-tag">
            <Zap className="w-3 h-3 mr-1" /> AI Content Manufacturing Engine — 2026
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            300+ Shoppable Videos<br />
            <span className="text-primary">Generated Daily.</span><br />
            Automatically.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            No actors. No shoots. No ghost creators. Just an AI system that manufactures hundreds of Instagram Shop videos every day — at $6/video instead of $75.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link href="/onboarding">
              <Button size="lg" className="gap-2 text-base px-8" data-testid="button-hero-cta">Launch Your Factory <ArrowRight className="w-4 h-4" /></Button>
            </Link>
            <Button variant="outline" size="lg" className="gap-2 text-base px-8" data-testid="button-hero-demo">
              <Play className="w-4 h-4" /> Watch Demo
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { label: "Videos Generated Daily", value: 300, suffix: "+" },
              { label: "Cost Per Video", value: 6, prefix: "$", suffix: "–8" },
              { label: "Avg. Monthly GMV", value: 128, prefix: "$", suffix: "k+" },
              { label: "Brands Scaling", value: 2400, suffix: "+" },
            ].map((stat) => (
              <Card key={stat.label} className="border-card-border bg-card/50 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold"><AnimatedCounter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} /></div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="border-y border-border/40 bg-muted/20 py-4 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-8 text-sm text-muted-foreground flex-wrap justify-center">
            {["Trusted by 2,400+ brands", "300+ videos/day average", "$128k avg. monthly GMV", "92% cost reduction", "24/7 AI automation"].map(t => (
              <div key={t} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Before / After Comparison */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs">The Shift</Badge>
            <h2 className="text-4xl font-bold mb-4">Traditional vs. AI Content Factory</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Everything that used to take a team and a budget now takes a workflow and $300/mo.</p>
          </div>
          <div className="rounded-2xl border border-card-border overflow-hidden">
            <div className="grid grid-cols-3 bg-muted/50 border-b border-border">
              <div className="p-4 text-sm font-semibold text-muted-foreground">Metric</div>
              <div className="p-4 text-sm font-semibold text-destructive border-l border-border text-center">Traditional UGC</div>
              <div className="p-4 text-sm font-semibold text-emerald-500 border-l border-border text-center">Dexfluence AI</div>
            </div>
            {beforeAfter.map((row, i) => (
              <div key={row.aspect} className={`grid grid-cols-3 border-b border-border/50 last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`} data-testid={`comparison-row-${i}`}>
                <div className="p-4 text-sm font-medium">{row.aspect}</div>
                <div className="p-4 text-sm text-destructive/80 border-l border-border/50 text-center">{row.before}</div>
                <div className="p-4 text-sm text-emerald-500 font-semibold border-l border-border/50 text-center">{row.after}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-xs">The Workflow</Badge>
            <h2 className="text-4xl font-bold mb-4">Four Steps. Infinite Content.</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">The complete AI pipeline from research to revenue — fully automated.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={step.title} className={`relative rounded-lg border ${step.border} bg-gradient-to-br ${step.color} p-6 hover-elevate`} data-testid={`card-step-${i + 1}`}>
                <div className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">{i + 1}</div>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-10 h-10 rounded-md bg-background/60 flex items-center justify-center ${step.iconColor}`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-xs">{step.tool}</Badge>
                </div>
                <h3 className="font-semibold text-sm mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key advantages */}
      <section className="py-24 bg-card/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { icon: TrendingUp, label: "Lower CPMs", value: "vs. paid ads", sub: "Organic volume beats ad spend" },
              { icon: Users, label: "AI Creator Profiles", value: "Hundreds", sub: "Each optimized for shoppable content" },
              { icon: Layers, label: "Cost vs. influencers", value: "92% less", sub: "$6/video vs $75+ for human content" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="font-semibold text-sm">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section id="roi-calculator" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs"><Calculator className="w-3 h-3 mr-1" /> Interactive Tool</Badge>
            <h2 className="text-4xl font-bold mb-4">Calculate Your ROI</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Adjust your niche, video volume, and order value to see your projected monthly GMV.</p>
          </div>
          <RoiCalculator />
        </div>
      </section>

      {/* Testimonials */}
      <section id="results" className="py-24 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-xs">Real Results</Badge>
            <h2 className="text-4xl font-bold mb-4">Brands Scaling on Instagram Shop</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-card-border hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />)}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.brand}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{t.gmv}</div>
                      <div className="text-xs text-muted-foreground">{t.timeframe}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-xs">Simple Pricing</Badge>
            <h2 className="text-4xl font-bold mb-4">Replace a $50k Budget for $300/mo</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">No per-video fees. No hidden costs. One flat price, unlimited upside.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricing.map((plan) => (
              <Card key={plan.name} className={`border-card-border hover-elevate ${plan.highlight ? "ring-2 ring-primary relative" : ""}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="text-xs">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="mb-6">
                    <div className="text-sm font-medium text-muted-foreground mb-1">{plan.name}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground text-sm">/month</span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><Video className="w-3.5 h-3.5 text-primary" />{plan.videos}</div>
                    <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-primary" />{plan.agents}</div>
                    <div className="flex items-center gap-2"><BarChart2 className="w-3.5 h-3.5 text-primary" />{plan.campaigns}</div>
                  </div>
                  <div className="space-y-2 mb-8">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link href={plan.name === "Scale" ? "/dashboard" : "/onboarding"}>
                    <Button className="w-full" variant={plan.highlight ? "default" : "outline"} data-testid={`button-pricing-${plan.name.toLowerCase()}`}>
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pricing trust badges */}
          <div className="flex items-center justify-center gap-8 mt-10 flex-wrap text-sm text-muted-foreground">
            {[
              { icon: Shield, text: "Cancel anytime" },
              { icon: Clock, text: "Live in 24 hours" },
              { icon: DollarSign, text: "No per-video fees" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs">FAQ</Badge>
            <h2 className="text-4xl font-bold mb-4">Common Questions</h2>
          </div>
          <div className="space-y-3">
            {faqItems.map((item) => <FaqItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Manufacturing Content?</h2>
          <p className="text-muted-foreground text-lg mb-10">Join brands generating millions in GMV with AI-powered Instagram Shop content.</p>
          <Link href="/onboarding">
            <Button size="lg" className="gap-2 text-base px-10" data-testid="button-footer-cta">
              Launch Your AI Content Factory <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/40 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span>Dexfluence — AI Content Factory</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <span>© 2026 All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
