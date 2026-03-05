import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard, Zap, CheckCircle2, Video, Users, Megaphone,
  TrendingUp, DollarSign, BarChart3, ArrowRight, Sparkles, Tag, X,
} from "lucide-react";

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toString();
}

interface Stats {
  totalVideosGenerated: number;
  activeAgents: number;
  activeCampaigns: number;
  totalGmv: number;
  costSaved: number;
}

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 97,
    period: "month",
    description: "Perfect for launching your first product",
    videosPerDay: 50,
    agents: 3,
    campaigns: 2,
    features: ["50 AI videos/day", "3 AI Agents", "2 Campaigns", "Script Generator", "Basic Analytics"],
    color: "border-border",
    badge: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: 297,
    period: "month",
    description: "For serious content operators",
    videosPerDay: 150,
    agents: 10,
    campaigns: 8,
    features: ["150 AI videos/day", "10 AI Agents", "8 Campaigns", "A/B Hook Tester", "Advanced Analytics", "Priority Kling queue", "Template Library"],
    color: "border-primary",
    badge: "Current Plan",
  },
  {
    id: "scale",
    name: "Scale",
    price: 797,
    period: "month",
    description: "Unlimited content manufacturing",
    videosPerDay: 500,
    agents: 50,
    campaigns: 999,
    features: ["500 AI videos/day", "50 AI Agents", "Unlimited Campaigns", "Everything in Pro", "White-label dashboard", "Dedicated account manager", "Custom integrations"],
    color: "border-violet-500/40",
    badge: "Most Popular",
  },
];

const INVOICE_HISTORY = [
  { date: "Feb 1, 2026", amount: "$297.00", status: "paid", period: "Feb 2026" },
  { date: "Jan 1, 2026", amount: "$297.00", status: "paid", period: "Jan 2026" },
  { date: "Dec 1, 2025", amount: "$297.00", status: "paid", period: "Dec 2025" },
  { date: "Nov 1, 2025", amount: "$297.00", status: "paid", period: "Nov 2025" },
];

interface PromoResult {
  valid: boolean;
  code: string;
  label: string;
  discount: number;
  type: "percent" | "fixed";
  discountAmount: number;
  finalPrice: number;
}

function CheckoutModal({
  plan, billingCycle, onClose,
}: {
  plan: typeof PLANS[0]; billingCycle: "monthly" | "annual"; onClose: () => void;
}) {
  const { toast } = useToast();
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<PromoResult | null>(null);
  const [promoError, setPromoError] = useState("");
  const basePrice = billingCycle === "annual" ? Math.round(plan.price * 0.8) : plan.price;
  const finalPrice = promo ? promo.finalPrice : basePrice;

  const promoMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/auth/promo", { code, planPrice: basePrice });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Invalid promo code");
      }
      return res.json() as Promise<PromoResult>;
    },
    onSuccess: (data) => {
      setPromo(data);
      setPromoError("");
      toast({ title: `Promo applied!`, description: `${data.label} — saving $${data.discountAmount}` });
    },
    onError: (e: any) => {
      setPromoError(e.message || "Invalid promo code");
      setPromo(null);
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card border border-card-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-bold text-base">Checkout — {plan.name} Plan</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{billingCycle === "annual" ? "Billed annually (20% off)" : "Billed monthly"}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" data-testid="button-close-checkout">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="space-y-2">
            {plan.features.map(f => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Promo Code
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter promo code"
                value={promoInput}
                onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                className="text-sm font-mono"
                disabled={!!promo}
                data-testid="input-promo-code"
              />
              {promo ? (
                <Button variant="outline" size="sm" onClick={() => { setPromo(null); setPromoInput(""); }} data-testid="button-remove-promo">
                  Remove
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!promoInput.trim() || promoMutation.isPending}
                  onClick={() => promoMutation.mutate(promoInput.trim())}
                  data-testid="button-apply-promo"
                >
                  {promoMutation.isPending ? "..." : "Apply"}
                </Button>
              )}
            </div>
            {promoError && (
              <p className="text-xs text-destructive" data-testid="text-promo-error">{promoError}</p>
            )}
            {promo && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-md" data-testid="text-promo-applied">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{promo.label} — {promo.type === "percent" ? `${promo.discount}% off` : `$${promo.discount} off`}</span>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{plan.name} ({billingCycle})</span>
              <span>${basePrice}/mo</span>
            </div>
            {promo && (
              <div className="flex justify-between text-sm text-emerald-500">
                <span>Promo ({promo.code})</span>
                <span>-${promo.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
              <span>Total</span>
              <span data-testid="text-checkout-total">${finalPrice}/mo</span>
            </div>
          </div>

          <Button className="w-full gap-2" size="lg" data-testid="button-confirm-checkout">
            <CreditCard className="w-4 h-4" />
            {finalPrice === 0 ? "Start Free — Enter Payment Later" : `Pay $${finalPrice}/month`}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Secured by Stripe. Cancel anytime. 14-day money-back guarantee.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Billing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [checkoutPlan, setCheckoutPlan] = useState<typeof PLANS[0] | null>(null);
  const { data: stats } = useQuery<Stats>({ queryKey: ["/api/stats"] });

  const currentPlan = PLANS.find(p => p.id === "pro")!;
  const videosUsedThisMonth = stats?.totalVideosGenerated ?? 0;
  const videosLimit = currentPlan.videosPerDay * 30;
  const usagePct = Math.min(100, Math.round((videosUsedThisMonth / videosLimit) * 100));
  const costPerVideo = 6.5;
  const totalSpend = videosUsedThisMonth * costPerVideo;
  const humanCost = videosUsedThisMonth * 75;
  const savings = humanCost - totalSpend;

  return (
    <div className="p-6 space-y-6 max-w-[1000px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-billing">
            <CreditCard className="w-6 h-6 text-primary" />
            Billing & Usage
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your plan, track usage, and view invoice history</p>
        </div>
        <Badge variant="secondary" className="gap-1 text-xs">
          <Sparkles className="w-3 h-3" /> Pro Plan
        </Badge>
      </div>

      {/* Current Plan Strip */}
      <Card className="border-primary/30 bg-primary/3" data-testid="card-current-plan">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg">Pro Plan</span>
                <Badge className="text-xs">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground">$297 / month · Renews March 1, 2026</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" data-testid="button-manage-plan">Manage Plan</Button>
              <Button size="sm" className="gap-1.5" data-testid="button-upgrade-plan">
                <Zap className="w-3.5 h-3.5" /> Upgrade to Scale
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Meters */}
      <div className="grid sm:grid-cols-3 gap-4" data-testid="section-usage">
        {[
          {
            icon: Video, label: "Videos Generated", color: "text-violet-500",
            used: videosUsedThisMonth, limit: videosLimit,
            display: `${fmt(videosUsedThisMonth)} / ${fmt(videosLimit)}`,
            pct: usagePct,
          },
          {
            icon: Users, label: "AI Agents", color: "text-blue-500",
            used: stats?.activeAgents ?? 0, limit: 10,
            display: `${stats?.activeAgents ?? 0} / 10`,
            pct: Math.round(((stats?.activeAgents ?? 0) / 10) * 100),
          },
          {
            icon: Megaphone, label: "Campaigns", color: "text-orange-500",
            used: stats?.activeCampaigns ?? 0, limit: 8,
            display: `${stats?.activeCampaigns ?? 0} / 8`,
            pct: Math.round(((stats?.activeCampaigns ?? 0) / 8) * 100),
          },
        ].map(m => (
          <Card key={m.label} className="border-card-border" data-testid={`usage-${m.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <m.icon className={`w-4 h-4 ${m.color}`} />
                <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
              </div>
              <div className="text-xl font-bold mb-2">{m.display}</div>
              <Progress value={m.pct} className="h-1.5 mb-1" />
              <p className="text-xs text-muted-foreground">{m.pct}% of limit used</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cost Breakdown */}
      <Card className="border-card-border" data-testid="card-cost-breakdown">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" /> This Month's Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Subscription</p>
              <p className="text-xl font-bold">$297.00</p>
              <p className="text-xs text-muted-foreground">Pro flat fee</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Videos × $6.50</p>
              <p className="text-xl font-bold">${totalSpend.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-muted-foreground">{fmt(videosUsedThisMonth)} videos</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Human Creator Cost</p>
              <p className="text-xl font-bold text-muted-foreground line-through">${humanCost.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-muted-foreground">@ $75/video</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Savings</p>
              <p className="text-xl font-bold text-emerald-500">${savings.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-emerald-500">vs human creators</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">Plans</h2>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              className={`text-xs px-3 py-1 rounded-md transition-colors ${billingCycle === "monthly" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
              onClick={() => setBillingCycle("monthly")}
              data-testid="button-billing-monthly"
            >
              Monthly
            </button>
            <button
              className={`text-xs px-3 py-1 rounded-md transition-colors ${billingCycle === "annual" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
              onClick={() => setBillingCycle("annual")}
              data-testid="button-billing-annual"
            >
              Annual <span className="text-emerald-500 font-medium">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const isCurrent = plan.id === "pro";
            const price = billingCycle === "annual" ? Math.round(plan.price * 0.8) : plan.price;
            return (
              <Card
                key={plan.id}
                className={`border-2 relative ${plan.color} ${isCurrent ? "shadow-md" : ""}`}
                data-testid={`plan-card-${plan.id}`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2`}>
                    <Badge className={`text-xs ${plan.id === "pro" ? "" : "bg-violet-600"}`}>{plan.badge}</Badge>
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="mb-4">
                    <p className="font-bold text-base">{plan.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">${price}</span>
                    <span className="text-sm text-muted-foreground"> / {plan.period}</span>
                    {billingCycle === "annual" && (
                      <p className="text-xs text-emerald-500 mt-0.5">Billed ${price * 12}/year</p>
                    )}
                  </div>
                  <ul className="space-y-1.5 mb-5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full gap-1.5"
                    variant={isCurrent ? "secondary" : "default"}
                    disabled={isCurrent}
                    onClick={() => !isCurrent && setCheckoutPlan(plan)}
                    data-testid={`button-select-plan-${plan.id}`}
                  >
                    {isCurrent ? "Current Plan" : <><ArrowRight className="w-3.5 h-3.5" /> Select {plan.name}</>}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {checkoutPlan && (
        <CheckoutModal plan={checkoutPlan} billingCycle={billingCycle} onClose={() => setCheckoutPlan(null)} />
      )}

      {/* Invoice History */}
      <Card className="border-card-border" data-testid="card-invoices">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {INVOICE_HISTORY.map(inv => (
              <div key={inv.date} className="flex items-center justify-between py-3 text-sm" data-testid={`invoice-row-${inv.period.replace(/\s/g, "-")}`}>
                <div>
                  <p className="font-medium text-sm">{inv.period}</p>
                  <p className="text-xs text-muted-foreground">{inv.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{inv.amount}</span>
                  <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{inv.status}</Badge>
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2" data-testid={`button-download-invoice-${inv.period.replace(/\s/g, "-")}`}>
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
