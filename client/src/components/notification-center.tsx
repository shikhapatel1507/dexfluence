import { useState, useEffect } from "react";
import { Bell, X, Video, TrendingUp, Users, DollarSign, Zap, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: "posted" | "generated" | "milestone" | "agent" | "revenue" | "alert";
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
}

const AGENT_NAMES = [
  "Emma Chen", "Alex Rivera", "Sofia Kim", "Jordan Blake",
  "Maya Patel", "Ryan Torres", "Zoe Williams", "Kai Johnson",
];
const CAMPAIGN_NAMES = ["SkinGlow Serum", "FitFuel Pro", "PetPure Organics", "HomeBrewKit"];
const HOOKS = [
  "POV: I tried this serum for 30 days",
  "This $30 product replaced my $200 routine",
  "Morning routine that got me 280k views",
  "Rating viral TikTok products so you don't have to",
];

function makeNotif(type: Notification["type"]): Notification {
  const agent = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
  const campaign = CAMPAIGN_NAMES[Math.floor(Math.random() * CAMPAIGN_NAMES.length)];
  const hook = HOOKS[Math.floor(Math.random() * HOOKS.length)];
  const views = Math.floor(Math.random() * 280 + 20) + "k";
  const revenue = "$" + (Math.random() * 8 + 1).toFixed(2) + "k";

  const alertThresholds = [
    `${campaign} engagement rate dropped below 2% — check hook performance`,
    `${agent}'s last 3 videos averaged under 5k views — consider new angles`,
    `${campaign} daily video target missed by 20% today`,
    `Video cost spike detected — ${campaign} at $8.20/video this hour`,
  ];
  const templates: Record<Notification["type"], { title: string; body: string }> = {
    posted: { title: "Video Posted", body: `${agent} posted "${hook}" on Instagram` },
    generated: { title: "Video Generated", body: `Kling finished generating for ${campaign} campaign` },
    milestone: { title: "Milestone Hit 🎉", body: `${campaign} crossed ${Math.floor(Math.random() * 9 + 1) * 100} videos this week` },
    agent: { title: "Agent Active", body: `${agent} started posting — ${Math.floor(Math.random() * 5 + 1)} videos queued` },
    revenue: { title: "Revenue Update", body: `${campaign} earned ${revenue} GMV in the last hour (${views} views)` },
    alert: { title: "Performance Alert ⚠️", body: alertThresholds[Math.floor(Math.random() * alertThresholds.length)] },
  };

  return {
    id: Math.random().toString(36).slice(2),
    type,
    title: templates[type].title,
    body: templates[type].body,
    timestamp: new Date(),
    read: false,
  };
}

const INITIAL_NOTIFS: Notification[] = [
  { id: "1", type: "milestone", title: "Milestone Hit 🎉", body: "SkinGlow Serum crossed 500 videos this week", timestamp: new Date(Date.now() - 120000), read: false },
  { id: "2", type: "alert", title: "Performance Alert ⚠️", body: "FitFuel Pre-Workout engagement rate dropped below 2% — check hook angles", timestamp: new Date(Date.now() - 240000), read: false },
  { id: "3", type: "posted", title: "Video Posted", body: 'Emma Chen posted "POV: I tried this serum for 30 days" on Instagram', timestamp: new Date(Date.now() - 300000), read: false },
  { id: "4", type: "revenue", title: "Revenue Update", body: "FitFuel Pro earned $2.4k GMV in the last hour (142k views)", timestamp: new Date(Date.now() - 600000), read: true },
  { id: "5", type: "generated", title: "Video Generated", body: "Kling finished generating for PetPure Organics campaign", timestamp: new Date(Date.now() - 900000), read: true },
  { id: "6", type: "agent", title: "Agent Active", body: "Sofia Kim started posting — 3 videos queued", timestamp: new Date(Date.now() - 1800000), read: true },
];

const typeIcon: Record<Notification["type"], React.ElementType> = {
  posted: Video,
  generated: Zap,
  milestone: TrendingUp,
  agent: Users,
  revenue: DollarSign,
  alert: AlertTriangle,
};

const typeColor: Record<Notification["type"], string> = {
  posted: "text-violet-500 bg-violet-500/10",
  generated: "text-primary bg-primary/10",
  milestone: "text-emerald-500 bg-emerald-500/10",
  agent: "text-blue-500 bg-blue-500/10",
  revenue: "text-amber-500 bg-amber-500/10",
  alert: "text-rose-500 bg-rose-500/10",
};

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const TYPES: Notification["type"][] = ["posted", "generated", "milestone", "agent", "revenue", "alert"];

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS);

  useEffect(() => {
    const interval = setInterval(() => {
      const type = TYPES[Math.floor(Math.random() * TYPES.length)];
      setNotifs(prev => [makeNotif(type), ...prev].slice(0, 20));
    }, 18000);
    return () => clearInterval(interval);
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  function dismiss(id: string) {
    setNotifs(prev => prev.filter(n => n.id !== id));
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(o => !o); }}
        className="relative flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors"
        data-testid="button-notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full text-primary-foreground text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-[360px] max-h-[520px] z-50 rounded-xl border border-card-border bg-card shadow-xl overflow-hidden flex flex-col"
            data-testid="panel-notifications"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Notifications</span>
                {unread > 0 && <Badge variant="secondary" className="text-xs">{unread} new</Badge>}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={markAllRead} data-testid="button-mark-all-read">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">All caught up</p>
                  <p className="text-xs text-muted-foreground mt-1">No new notifications</p>
                </div>
              ) : (
                notifs.map(n => {
                  const Icon = typeIcon[n.type];
                  const color = typeColor[n.type];
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors ${n.read ? "" : "bg-primary/3"}`}
                      data-testid={`notification-${n.id}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <span className={`text-xs font-semibold ${n.read ? "text-foreground" : "text-foreground"}`}>
                            {n.title}
                          </span>
                          {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                        <span className="text-xs text-muted-foreground/70 mt-1 block">{timeAgo(n.timestamp)}</span>
                      </div>
                      <button
                        onClick={() => dismiss(n.id)}
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Auto-updates every 18s</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-500">Live</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
