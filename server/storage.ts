import { randomUUID } from "crypto";
import {
  type User, type InsertUser,
  type Campaign, type InsertCampaign,
  type Agent, type InsertAgent,
  type Video, type InsertVideo,
  type PipelineJob, type InsertPipelineJob,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  createCampaign(c: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string): Promise<void>;

  getAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | undefined>;
  createAgent(a: InsertAgent): Promise<Agent>;
  updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined>;
  deleteAgent(id: string): Promise<void>;

  getVideos(campaignId?: string): Promise<Video[]>;
  getVideo(id: string): Promise<Video | undefined>;
  createVideo(v: InsertVideo): Promise<Video>;
  updateVideo(id: string, updates: Partial<Video>): Promise<Video | undefined>;

  getPipelineJobs(campaignId?: string): Promise<PipelineJob[]>;
  createPipelineJob(j: InsertPipelineJob): Promise<PipelineJob>;
  updatePipelineJob(id: string, updates: Partial<PipelineJob>): Promise<PipelineJob | undefined>;

  getStats(): Promise<{
    totalVideosGenerated: number;
    totalVideosPosted: number;
    totalViews: number;
    totalGmv: number;
    activeAgents: number;
    activeCampaigns: number;
    dailyVideos: number;
    costSaved: number;
  }>;

  getChartData(): Promise<{
    weeklyOutput: Array<{ day: string; videos: number; posted: number }>;
    campaignGmv: Array<{ name: string; gmv: number; views: number }>;
    viewsTrend: Array<{ day: string; views: number }>;
  }>;

  getBrandSettings(): Promise<BrandSettings>;
  updateBrandSettings(s: Partial<BrandSettings>): Promise<BrandSettings>;
}

export interface BrandSettings {
  websiteUrl: string;
  instagramHandle: string;
  brandName: string;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private campaigns: Map<string, Campaign> = new Map();
  private agents: Map<string, Agent> = new Map();
  private videos: Map<string, Video> = new Map();
  private pipelineJobs: Map<string, PipelineJob> = new Map();
  private brandSettings: BrandSettings = { websiteUrl: "", instagramHandle: "", brandName: "" };

  async getBrandSettings(): Promise<BrandSettings> { return { ...this.brandSettings }; }
  async updateBrandSettings(s: Partial<BrandSettings>): Promise<BrandSettings> {
    this.brandSettings = { ...this.brandSettings, ...s };
    return { ...this.brandSettings };
  }

  async getUser(id: string) { return this.users.get(id); }
  async getUserByUsername(username: string) {
    return Array.from(this.users.values()).find(u => u.username === username);
  }
  async createUser(user: InsertUser): Promise<User> {
    const u: User = { ...user, id: randomUUID() };
    this.users.set(u.id, u);
    return u;
  }

  async getCampaigns() {
    return Array.from(this.campaigns.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  async getCampaign(id: string) { return this.campaigns.get(id); }
  async createCampaign(c: InsertCampaign): Promise<Campaign> {
    const campaign: Campaign = {
      ...c,
      id: randomUUID(),
      videosGenerated: c.videosGenerated ?? 0,
      videosPosted: c.videosPosted ?? 0,
      totalViews: c.totalViews ?? 0,
      gmv: c.gmv ?? 0,
      costPerVideo: c.costPerVideo ?? 6.5,
      dailyTarget: c.dailyTarget ?? 100,
      status: c.status ?? "active",
      createdAt: new Date(),
    };
    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }
  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const c = this.campaigns.get(id);
    if (!c) return undefined;
    const updated = { ...c, ...updates };
    this.campaigns.set(id, updated);
    return updated;
  }
  async deleteCampaign(id: string) { this.campaigns.delete(id); }

  async getAgents() {
    return Array.from(this.agents.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  async getAgent(id: string) { return this.agents.get(id); }
  async createAgent(a: InsertAgent): Promise<Agent> {
    const agent: Agent = {
      ...a,
      id: randomUUID(),
      postsPerDay: a.postsPerDay ?? 0,
      followers: a.followers ?? 0,
      totalVideos: a.totalVideos ?? 0,
      totalViews: a.totalViews ?? 0,
      status: a.status ?? "active",
      platform: a.platform ?? "instagram",
      avatarUrl: a.avatarUrl ?? null,
      campaignId: a.campaignId ?? null,
      createdAt: new Date(),
    };
    this.agents.set(agent.id, agent);
    return agent;
  }
  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined> {
    const a = this.agents.get(id);
    if (!a) return undefined;
    const updated = { ...a, ...updates };
    this.agents.set(id, updated);
    return updated;
  }
  async deleteAgent(id: string) { this.agents.delete(id); }

  async getVideos(campaignId?: string) {
    const all = Array.from(this.videos.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return campaignId ? all.filter(v => v.campaignId === campaignId) : all;
  }
  async getVideo(id: string) { return this.videos.get(id); }
  async createVideo(v: InsertVideo): Promise<Video> {
    const video: Video = {
      ...v,
      id: randomUUID(),
      views: v.views ?? 0,
      likes: v.likes ?? 0,
      shares: v.shares ?? 0,
      revenue: v.revenue ?? 0,
      status: v.status ?? "pending",
      platform: v.platform ?? "instagram",
      agentId: v.agentId ?? null,
      script: v.script ?? null,
      angle: v.angle ?? null,
      cta: v.cta ?? null,
      createdAt: new Date(),
    };
    this.videos.set(video.id, video);
    return video;
  }
  async updateVideo(id: string, updates: Partial<Video>): Promise<Video | undefined> {
    const v = this.videos.get(id);
    if (!v) return undefined;
    const updated = { ...v, ...updates };
    this.videos.set(id, updated);
    return updated;
  }

  async getPipelineJobs(campaignId?: string) {
    const all = Array.from(this.pipelineJobs.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return campaignId ? all.filter(j => j.campaignId === campaignId) : all;
  }
  async createPipelineJob(j: InsertPipelineJob): Promise<PipelineJob> {
    const job: PipelineJob = {
      ...j,
      id: randomUUID(),
      progress: j.progress ?? 0,
      status: j.status ?? "pending",
      details: j.details ?? null,
      videoId: j.videoId ?? null,
      hook: j.hook ?? null,
      createdAt: new Date(),
    };
    this.pipelineJobs.set(job.id, job);
    return job;
  }
  async updatePipelineJob(id: string, updates: Partial<PipelineJob>): Promise<PipelineJob | undefined> {
    const j = this.pipelineJobs.get(id);
    if (!j) return undefined;
    const updated = { ...j, ...updates };
    this.pipelineJobs.set(id, updated);
    return updated;
  }

  async getStats() {
    const cArr = Array.from(this.campaigns.values());
    const aArr = Array.from(this.agents.values());
    const totalVideosGenerated = cArr.reduce((s, c) => s + c.videosGenerated, 0);
    const totalVideosPosted = cArr.reduce((s, c) => s + c.videosPosted, 0);
    const totalViews = cArr.reduce((s, c) => s + c.totalViews, 0);
    const totalGmv = cArr.reduce((s, c) => s + c.gmv, 0);
    const activeAgents = aArr.filter(a => a.status === "active").length;
    const activeCampaigns = cArr.filter(c => c.status === "active").length;
    const dailyVideos = cArr.filter(c => c.status === "active").reduce((s, c) => s + c.dailyTarget, 0);
    const costSaved = totalVideosGenerated * (75 - 6.5);
    return { totalVideosGenerated, totalVideosPosted, totalViews, totalGmv, activeAgents, activeCampaigns, dailyVideos, costSaved };
  }

  async getChartData() {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyOutput = days.map((day, i) => ({
      day,
      videos: 280 + Math.floor(Math.sin(i) * 40 + Math.random() * 60),
      posted: 240 + Math.floor(Math.sin(i) * 30 + Math.random() * 50),
    }));

    const campaigns = Array.from(this.campaigns.values());
    const campaignGmv = campaigns.map(c => ({
      name: c.name.length > 16 ? c.name.slice(0, 14) + "…" : c.name,
      gmv: Math.round(c.gmv),
      views: Math.round(c.totalViews / 1000),
    }));

    const viewsTrend = days.map((day, i) => ({
      day,
      views: 580000 + Math.floor(Math.sin(i * 0.8) * 80000 + Math.random() * 120000),
    }));

    return { weeklyOutput, campaignGmv, viewsTrend };
  }
}

export const storage = new MemStorage();

export async function seedData() {
  const campaigns = await storage.getCampaigns();
  if (campaigns.length > 0) return;

  const c1 = await storage.createCampaign({
    name: "SkinGlow Serum Launch",
    product: "Vitamin C Brightening Serum",
    niche: "skincare",
    status: "active",
    videosGenerated: 1842,
    videosPosted: 1640,
    totalViews: 4280000,
    gmv: 128400,
    costPerVideo: 6.2,
    dailyTarget: 120,
  });

  const c2 = await storage.createCampaign({
    name: "FitFuel Pre-Workout",
    product: "FitFuel Berry Blast Pre-Workout",
    niche: "fitness supplements",
    status: "active",
    videosGenerated: 964,
    videosPosted: 890,
    totalViews: 2140000,
    gmv: 74200,
    costPerVideo: 6.8,
    dailyTarget: 80,
  });

  const c3 = await storage.createCampaign({
    name: "PetPure Dog Treats",
    product: "Organic Grain-Free Dog Treats",
    niche: "pet care",
    status: "paused",
    videosGenerated: 420,
    videosPosted: 380,
    totalViews: 890000,
    gmv: 31600,
    costPerVideo: 5.9,
    dailyTarget: 60,
  });

  const c4 = await storage.createCampaign({
    name: "HomeBrewKit",
    product: "Specialty Coffee Brew Kit",
    niche: "home & kitchen",
    status: "active",
    videosGenerated: 312,
    videosPosted: 280,
    totalViews: 620000,
    gmv: 22800,
    costPerVideo: 7.1,
    dailyTarget: 50,
  });

  const agentData = [
    { name: "Sophia Chen", avatar: "https://randomuser.me/api/portraits/women/44.jpg", campaign: c1.id, posts: 18, followers: 1240000, videos: 540, views: 48200000 },
    { name: "Ava Rodriguez", avatar: "https://randomuser.me/api/portraits/women/26.jpg", campaign: c1.id, posts: 22, followers: 890000, videos: 620, views: 36800000 },
    { name: "Maya Patel", avatar: "https://randomuser.me/api/portraits/women/62.jpg", campaign: c2.id, posts: 15, followers: 2100000, videos: 380, views: 71400000 },
    { name: "Zoe Williams", avatar: "https://randomuser.me/api/portraits/women/35.jpg", campaign: c2.id, posts: 12, followers: 540000, videos: 290, views: 19200000 },
    { name: "Luna Kim", avatar: "https://randomuser.me/api/portraits/women/54.jpg", campaign: c3.id, posts: 8, followers: 380000, videos: 210, views: 12900000 },
    { name: "Aria Johnson", avatar: "https://randomuser.me/api/portraits/women/28.jpg", campaign: c4.id, posts: 10, followers: 720000, videos: 180, views: 24600000 },
    { name: "Nova Singh", avatar: "https://randomuser.me/api/portraits/women/67.jpg", campaign: c1.id, posts: 20, followers: 1580000, videos: 480, views: 59400000 },
    { name: "Sage Martinez", avatar: "https://randomuser.me/api/portraits/women/43.jpg", campaign: c2.id, posts: 14, followers: 660000, videos: 240, views: 21800000 },
  ];

  const agents: any[] = [];
  for (const a of agentData) {
    const agent = await storage.createAgent({
      name: a.name,
      avatarUrl: a.avatar,
      platform: "instagram",
      postsPerDay: a.posts,
      followers: a.followers,
      totalVideos: a.videos,
      totalViews: a.views,
      status: "active",
      campaignId: a.campaign,
    });
    agents.push(agent);
  }

  const hooks = [
    "POV: I tried this serum for 30 days and my dark spots are GONE",
    "Dermatologist approved? I put it to the test",
    "Why every girl needs this in their skincare routine",
    "The $30 serum that replaced my $200 one",
    "Morning routine that gave me glass skin in 2 weeks",
    "This pre-workout hit different — my honest review",
    "I trained for 30 days with this and here's what happened",
    "My dog literally won't stop begging for these treats",
    "The coffee upgrade that changed my mornings forever",
    "Rating viral TikTok products so you don't have to",
  ];

  const angles = ["transformation reveal", "honest review", "problem-solution", "comparison", "day-in-life"];
  const ctas = [
    "Shop the link in bio before it sells out! 🛍️ @skinglow.official",
    "Tap the bag icon to grab yours today — follow @skinglow.official for more drops!",
    "Link in bio — limited stock! Tag a friend who needs this 👇 @skinglow.official",
    "Get 20% off with code REEL20 — link in bio ✨ @skinglow.official",
    "Swipe up to shop now! Follow @skinglow.official for daily finds 💕",
  ];

  for (let i = 0; i < 20; i++) {
    const campaignId = [c1.id, c1.id, c2.id, c3.id, c4.id][i % 5];
    const agent = agents[i % agents.length];
    await storage.createVideo({
      campaignId,
      agentId: agent.id,
      hook: hooks[i % hooks.length],
      script: "Full AI-generated script with product demo and CTA",
      angle: angles[i % angles.length],
      cta: ctas[i % ctas.length],
      platform: "instagram",
      status: ["posted", "posted", "posted", "generating", "queued"][i % 5],
      views: Math.floor(Math.random() * 80000) + 2000,
      likes: Math.floor(Math.random() * 4000) + 100,
      shares: Math.floor(Math.random() * 800) + 20,
      revenue: Math.random() * 500 + 50,
    });
  }

  const kanbanStages = ["Research", "Scripting", "Generating", "Review", "Posted"];
  const kanbanStatuses = ["completed", "completed", "running", "pending", "completed"];
  const kanbanProgress = [100, 100, 64, 0, 100];
  for (let i = 0; i < kanbanStages.length; i++) {
    await storage.createPipelineJob({
      campaignId: c1.id,
      stage: kanbanStages[i],
      status: kanbanStatuses[i],
      progress: kanbanProgress[i],
      hook: hooks[i % hooks.length],
      details: `${kanbanStages[i]} for SkinGlow Serum Launch`,
    });
  }
}
