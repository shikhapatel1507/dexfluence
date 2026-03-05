import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Settings as SettingsIcon, Instagram, Zap, Bell, DollarSign, Clock,
  CheckCircle2, AlertCircle, Link, Unlink, Globe, AtSign,
} from "lucide-react";
import { SiTiktok, SiYoutube } from "react-icons/si";

interface PlatformConfig {
  connected: boolean;
  accountName?: string;
}

const DEFAULT_PLATFORMS: Record<string, PlatformConfig> = {
  instagram: { connected: true, accountName: "@dexfluence_official" },
  tiktok: { connected: false },
  youtube: { connected: false },
};

interface CostConfig {
  costPerVideo: string;
  dailyBudget: string;
  monthlyBudget: string;
}

interface NotifConfig {
  videoPosted: boolean;
  generationComplete: boolean;
  campaignMilestone: boolean;
  agentError: boolean;
  weeklyReport: boolean;
}

interface PostingConfig {
  defaultPlatform: string;
  postingFrequency: string;
  optimalTiming: boolean;
  autoHashtags: boolean;
  autoCaption: boolean;
}

interface BrandSettings {
  websiteUrl: string;
  instagramHandle: string;
}

export default function Settings() {
  const { toast } = useToast();
  const [platforms, setPlatforms] = useState(DEFAULT_PLATFORMS);
  const [costs, setCosts] = useState<CostConfig>({
    costPerVideo: "6.50",
    dailyBudget: "2000",
    monthlyBudget: "50000",
  });
  const [notifs, setNotifs] = useState<NotifConfig>({
    videoPosted: true,
    generationComplete: true,
    campaignMilestone: true,
    agentError: true,
    weeklyReport: false,
  });
  const [posting, setPosting] = useState<PostingConfig>({
    defaultPlatform: "instagram",
    postingFrequency: "auto",
    optimalTiming: true,
    autoHashtags: true,
    autoCaption: false,
  });
  const [saved, setSaved] = useState(false);
  const [brand, setBrand] = useState<BrandSettings>({ websiteUrl: "", instagramHandle: "" });
  const [brandSaved, setBrandSaved] = useState(false);

  useQuery<BrandSettings>({
    queryKey: ["/api/settings/brand"],
    queryFn: async () => {
      const res = await fetch("/api/settings/brand");
      const data = await res.json();
      setBrand(data);
      return data;
    },
  });

  const brandMutation = useMutation({
    mutationFn: async (data: BrandSettings) => {
      const res = await apiRequest("PUT", "/api/settings/brand", data);
      return res.json() as Promise<BrandSettings>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/settings/brand"], data);
      setBrandSaved(true);
      toast({ title: "Brand profile saved", description: "Scripts will now include your website link and Instagram tag." });
      setTimeout(() => setBrandSaved(false), 2500);
    },
    onError: () => toast({ title: "Failed to save brand profile", variant: "destructive" }),
  });

  function handleSave() {
    setSaved(true);
    toast({ title: "Settings saved", description: "Your configuration has been updated." });
    setTimeout(() => setSaved(false), 2000);
  }

  function togglePlatform(platform: string) {
    setPlatforms(prev => ({
      ...prev,
      [platform]: { ...prev[platform], connected: !prev[platform].connected },
    }));
    toast({
      title: platforms[platform].connected ? "Platform disconnected" : "Platform connected",
      description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} has been ${platforms[platform].connected ? "disconnected" : "connected"}.`,
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-[900px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-settings">
            <SettingsIcon className="w-6 h-6 text-primary" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure platform connections, costs, posting defaults, and notifications
          </p>
        </div>
        <Button onClick={handleSave} className="gap-2" data-testid="button-save-settings">
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : "Save Changes"}
        </Button>
      </div>

      {/* Brand Profile */}
      <Card className="border-card-border border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> Brand Profile
          </CardTitle>
          <CardDescription className="text-xs">
            Your website and Instagram handle will be automatically included in every generated script's CTA and caption
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-500" /> Website URL
              </Label>
              <Input
                value={brand.websiteUrl}
                onChange={e => setBrand(b => ({ ...b, websiteUrl: e.target.value }))}
                placeholder="https://yourstore.com"
                data-testid="input-brand-website"
              />
              <p className="text-xs text-muted-foreground">Added as "link in bio" in every video CTA</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-pink-500" /> Instagram Handle
              </Label>
              <Input
                value={brand.instagramHandle}
                onChange={e => setBrand(b => ({ ...b, instagramHandle: e.target.value }))}
                placeholder="@yourbrand"
                data-testid="input-brand-instagram"
              />
              <p className="text-xs text-muted-foreground">Tagged in every generated caption</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="gap-2"
              onClick={() => brandMutation.mutate(brand)}
              disabled={brandMutation.isPending}
              data-testid="button-save-brand"
            >
              {brandSaved
                ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</>
                : brandMutation.isPending
                  ? "Saving..."
                  : "Save Brand Profile"}
            </Button>
            {brand.websiteUrl && brand.instagramHandle && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Scripts will include your link and tag
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Platform Connections */}
      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Link className="w-4 h-4 text-primary" /> Platform Connections
          </CardTitle>
          <CardDescription className="text-xs">Connect your social media accounts for auto-posting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "instagram", label: "Instagram", icon: Instagram, iconClass: "text-pink-500", description: "Instagram Shop & Reels" },
            { key: "tiktok", label: "TikTok", icon: SiTiktok, iconClass: "text-foreground", description: "TikTok Shop & Videos" },
            { key: "youtube", label: "YouTube Shorts", icon: SiYoutube, iconClass: "text-red-500", description: "YouTube Shorts & Shopping" },
          ].map(({ key, label, icon: Icon, iconClass, description }) => {
            const config = platforms[key];
            return (
              <div key={key} className="flex items-center justify-between p-4 rounded-lg border border-card-border bg-card/30" data-testid={`platform-${key}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-5 h-5 ${iconClass}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{label}</span>
                      {config.connected && (
                        <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Connected</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{config.connected && config.accountName ? config.accountName : description}</p>
                  </div>
                </div>
                <Button
                  variant={config.connected ? "outline" : "default"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => togglePlatform(key)}
                  data-testid={`button-toggle-platform-${key}`}
                >
                  {config.connected
                    ? <><Unlink className="w-3.5 h-3.5" /> Disconnect</>
                    : <><Link className="w-3.5 h-3.5" /> Connect</>
                  }
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Cost Configuration */}
      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" /> Cost Configuration
          </CardTitle>
          <CardDescription className="text-xs">Set your video cost targets and budget limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { key: "costPerVideo", label: "Cost Per Video ($)", placeholder: "6.50" },
              { key: "dailyBudget", label: "Daily Budget ($)", placeholder: "2000" },
              { key: "monthlyBudget", label: "Monthly Budget ($)", placeholder: "50000" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-2">
                <Label className="text-xs">{label}</Label>
                <Input
                  type="number"
                  value={costs[key as keyof CostConfig]}
                  onChange={e => setCosts(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  data-testid={`input-cost-${key}`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Posting Defaults */}
      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" /> Posting Defaults
          </CardTitle>
          <CardDescription className="text-xs">Configure default behavior for all content posting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Default Platform</Label>
              <Select value={posting.defaultPlatform} onValueChange={v => setPosting(p => ({ ...p, defaultPlatform: v }))}>
                <SelectTrigger data-testid="select-default-platform"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube Shorts</SelectItem>
                  <SelectItem value="all">All Platforms</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Posting Frequency</Label>
              <Select value={posting.postingFrequency} onValueChange={v => setPosting(p => ({ ...p, postingFrequency: v }))}>
                <SelectTrigger data-testid="select-posting-frequency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (AI-Optimized)</SelectItem>
                  <SelectItem value="hourly">Every Hour</SelectItem>
                  <SelectItem value="2hours">Every 2 Hours</SelectItem>
                  <SelectItem value="3hours">Every 3 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { key: "optimalTiming", label: "Optimal Timing", description: "AI picks the best posting time based on engagement data" },
              { key: "autoHashtags", label: "Auto-generate Hashtags", description: "Automatically add relevant hashtags to every post" },
              { key: "autoCaption", label: "Auto-generate Captions", description: "Generate captions from the video script automatically" },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Switch
                  checked={posting[key as keyof PostingConfig] as boolean}
                  onCheckedChange={v => setPosting(p => ({ ...p, [key]: v }))}
                  data-testid={`switch-${key}`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" /> Notification Preferences
          </CardTitle>
          <CardDescription className="text-xs">Choose which events trigger notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "videoPosted", label: "Video Posted", description: "When a video is successfully posted" },
            { key: "generationComplete", label: "Generation Complete", description: "When Kling finishes generating a video" },
            { key: "campaignMilestone", label: "Campaign Milestones", description: "When a campaign hits 100, 500, 1000 videos" },
            { key: "agentError", label: "Agent Errors", description: "When an agent fails to post or encounters an issue" },
            { key: "weeklyReport", label: "Weekly Performance Report", description: "Summary of views, GMV, and top performers every Monday" },
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Switch
                checked={notifs[key as keyof NotifConfig]}
                onCheckedChange={v => setNotifs(n => ({ ...n, [key]: v }))}
                data-testid={`switch-notif-${key}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card className="border-card-border border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> AI Configuration
          </CardTitle>
          <CardDescription className="text-xs">AI integration status and model settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Script Generation", model: "GPT-5.2", status: "connected", via: "Replit AI Integration" },
            { label: "Market Research", model: "GPT-5.2", status: "connected", via: "Replit AI Integration" },
            { label: "Video Generation", model: "Kling 2.6", status: "simulated", via: "Simulation mode" },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-card-border" data-testid={`ai-config-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.model} · {item.via}</p>
              </div>
              <Badge variant="secondary" className={`text-xs gap-1 ${item.status === "connected" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                {item.status === "connected"
                  ? <><CheckCircle2 className="w-3 h-3" /> Active</>
                  : <><AlertCircle className="w-3 h-3" /> Simulated</>
                }
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2" data-testid="button-save-settings-bottom">
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
}
