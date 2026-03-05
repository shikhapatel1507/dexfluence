import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, seedData } from "./storage";
import { insertCampaignSchema, insertAgentSchema, insertVideoSchema, insertPipelineJobSchema } from "@shared/schema";
import { generateScripts, runMarketResearch, analyzeCompetitor, getTrendRadar, getHookFormulas } from "./ai";
import { discoverProducts } from "./product-discovery";
import type { BrandSettings } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  setupAuth(app);
  await seedData();

  app.get("/api/stats", async (_req, res) => {
    try { res.json(await storage.getStats()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/chart-data", async (_req, res) => {
    try { res.json(await storage.getChartData()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Analytics ─────────────────────────────────────────────────────────────
  app.get("/api/analytics/gmv-attribution", async (_req, res) => {
    try {
      const videos = await storage.getVideos();
      const campaigns = await storage.getCampaigns();
      const agents = await storage.getAgents();

      const byAngle: Record<string, { angle: string; revenue: number; views: number; count: number }> = {};
      const byAgent: Record<string, { name: string; revenue: number; views: number; count: number }> = {};
      const byCampaign: Record<string, { name: string; revenue: number; views: number; count: number }> = {};
      const byHour: Record<number, { hour: number; revenue: number; views: number }> = {};
      const byDay: Record<string, { day: string; revenue: number; views: number }> = {};

      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      days.forEach(d => { byDay[d] = { day: d, revenue: 0, views: 0 }; });
      for (let h = 0; h < 24; h++) byHour[h] = { hour: h, revenue: 0, views: 0 };

      for (const v of videos) {
        const angle = v.angle ?? "Unknown";
        if (!byAngle[angle]) byAngle[angle] = { angle, revenue: 0, views: 0, count: 0 };
        byAngle[angle].revenue += v.revenue;
        byAngle[angle].views += v.views;
        byAngle[angle].count += 1;

        if (v.agentId) {
          const agent = agents.find(a => a.id === v.agentId);
          const name = agent?.name ?? "Unknown";
          if (!byAgent[v.agentId]) byAgent[v.agentId] = { name, revenue: 0, views: 0, count: 0 };
          byAgent[v.agentId].revenue += v.revenue;
          byAgent[v.agentId].views += v.views;
          byAgent[v.agentId].count += 1;
        }

        const campaign = campaigns.find(c => c.id === v.campaignId);
        const cname = campaign?.name ?? "Unknown";
        if (!byCampaign[v.campaignId]) byCampaign[v.campaignId] = { name: cname, revenue: 0, views: 0, count: 0 };
        byCampaign[v.campaignId].revenue += v.revenue;
        byCampaign[v.campaignId].views += v.views;
        byCampaign[v.campaignId].count += 1;

        const createdAt = new Date(v.createdAt);
        const hour = createdAt.getHours();
        const dayIdx = createdAt.getDay();
        const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIdx];

        byHour[hour].revenue += v.revenue;
        byHour[hour].views += v.views;
        if (byDay[dayName]) {
          byDay[dayName].revenue += v.revenue;
          byDay[dayName].views += v.views;
        }
      }

      res.json({
        byAngle: Object.values(byAngle).sort((a, b) => b.revenue - a.revenue),
        byAgent: Object.values(byAgent).sort((a, b) => b.revenue - a.revenue),
        byCampaign: Object.values(byCampaign).sort((a, b) => b.revenue - a.revenue),
        byHour: Object.values(byHour),
        byDay: Object.values(byDay),
      });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/analytics/heatmap", async (_req, res) => {
    try {
      const videos = await storage.getVideos();
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

      const grid: Record<string, Record<number, { views: number; revenue: number; count: number }>> = {};
      days.forEach(d => {
        grid[d] = {};
        hours.forEach(h => { grid[d][h] = { views: 0, revenue: 0, count: 0 }; });
      });

      // Distribute videos across the heatmap with seeded randomness
      for (const v of videos) {
        if (v.views === 0) continue;
        const hash = v.id.charCodeAt(0) + v.id.charCodeAt(1);
        const day = days[hash % days.length];
        const hour = hours[(hash * 7 + 3) % hours.length];
        grid[day][hour].views += v.views;
        grid[day][hour].revenue += v.revenue;
        grid[day][hour].count += 1;
      }

      // Add realistic synthetic hotspots
      const hotspots: Array<[string, number, number, number]> = [
        ["Tue", 19, 480000, 420], ["Wed", 20, 560000, 490],
        ["Fri", 18, 640000, 580], ["Sat", 21, 720000, 640],
        ["Sun", 20, 680000, 600], ["Mon", 9, 280000, 240],
        ["Thu", 12, 340000, 300], ["Fri", 21, 590000, 530],
      ];
      for (const [day, hour, views, rev] of hotspots) {
        if (grid[day]?.[hour]) {
          grid[day][hour].views += views;
          grid[day][hour].revenue += rev;
          grid[day][hour].count += 1;
        }
      }

      const cells = days.flatMap(day =>
        hours.map(hour => ({ day, hour, ...grid[day][hour] }))
      );

      res.json({ cells, days, hours });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/analytics/leaderboard", async (_req, res) => {
    try {
      const agents = await storage.getAgents();
      const videos = await storage.getVideos();
      const campaigns = await storage.getCampaigns();

      const leaderboard = agents.map(agent => {
        const agentVideos = videos.filter(v => v.agentId === agent.id);
        const revenue = agentVideos.reduce((s, v) => s + v.revenue, 0);
        const views = agentVideos.reduce((s, v) => s + v.views, 0);
        const likes = agentVideos.reduce((s, v) => s + v.likes, 0);
        const shares = agentVideos.reduce((s, v) => s + v.shares, 0);
        const posted = agentVideos.filter(v => v.status === "posted").length;
        const engagementRate = views > 0 ? ((likes + shares) / views * 100) : 0;
        const costPerView = views > 0 ? (posted * 6.5) / views : 0;
        const campaign = campaigns.find(c => c.id === agent.campaignId);
        return {
          ...agent,
          revenue,
          totalViewsActual: views,
          engagementRate,
          costPerView,
          postedVideos: posted,
          campaignName: campaign?.name ?? null,
        };
      }).sort((a, b) => b.revenue - a.revenue);

      res.json(leaderboard);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Campaigns ─────────────────────────────────────────────────────────────
  app.get("/api/campaigns", async (_req, res) => {
    try { res.json(await storage.getCampaigns()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const c = await storage.getCampaign(req.params.id);
      if (!c) return res.status(404).json({ error: "Not found" });
      res.json(c);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const data = insertCampaignSchema.parse(req.body);
      res.status(201).json(await storage.createCampaign(data));
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/campaigns/:id", async (req, res) => {
    try {
      const c = await storage.updateCampaign(req.params.id, req.body);
      if (!c) return res.status(404).json({ error: "Not found" });
      res.json(c);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/campaigns/:id", async (req, res) => {
    try { await storage.deleteCampaign(req.params.id); res.status(204).send(); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Agents ────────────────────────────────────────────────────────────────
  app.get("/api/agents", async (_req, res) => {
    try { res.json(await storage.getAgents()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/agents/:id", async (req, res) => {
    try {
      const a = await storage.getAgent(req.params.id);
      if (!a) return res.status(404).json({ error: "Not found" });
      res.json(a);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/agents", async (req, res) => {
    try {
      const data = insertAgentSchema.parse(req.body);
      res.status(201).json(await storage.createAgent(data));
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/agents/:id", async (req, res) => {
    try {
      const a = await storage.updateAgent(req.params.id, req.body);
      if (!a) return res.status(404).json({ error: "Not found" });
      res.json(a);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/agents/:id", async (req, res) => {
    try { await storage.deleteAgent(req.params.id); res.status(204).send(); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Videos ────────────────────────────────────────────────────────────────
  app.get("/api/videos", async (req, res) => {
    try {
      const { campaignId } = req.query;
      res.json(await storage.getVideos(campaignId as string | undefined));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/videos", async (req, res) => {
    try {
      const data = insertVideoSchema.parse(req.body);
      res.status(201).json(await storage.createVideo(data));
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/videos/:id", async (req, res) => {
    try {
      const v = await storage.updateVideo(req.params.id, req.body);
      if (!v) return res.status(404).json({ error: "Not found" });
      res.json(v);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Pipeline ──────────────────────────────────────────────────────────────
  app.get("/api/pipeline", async (req, res) => {
    try {
      const { campaignId } = req.query;
      res.json(await storage.getPipelineJobs(campaignId as string | undefined));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/pipeline", async (req, res) => {
    try {
      const data = insertPipelineJobSchema.parse(req.body);
      res.status(201).json(await storage.createPipelineJob(data));
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/pipeline/:id", async (req, res) => {
    try {
      const j = await storage.updatePipelineJob(req.params.id, req.body);
      if (!j) return res.status(404).json({ error: "Not found" });
      res.json(j);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Video Generation Simulation ───────────────────────────────────────────
  app.post("/api/videos/:id/generate", async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) return res.status(404).json({ error: "Not found" });

      await storage.updateVideo(video.id, { status: "generating" });

      const job = await storage.createPipelineJob({
        campaignId: video.campaignId,
        videoId: video.id,
        stage: "Generating",
        status: "running",
        progress: 0,
        hook: video.hook,
        details: `Generating video: ${video.hook.slice(0, 50)}`,
      });

      simulateGeneration(video.id, job.id);

      res.json({ jobId: job.id, videoId: video.id, status: "generating" });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Brand Settings ────────────────────────────────────────────────────────
  app.get("/api/settings/brand", async (_req, res) => {
    try { res.json(await storage.getBrandSettings()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/settings/brand", async (req, res) => {
    try {
      const { websiteUrl, instagramHandle, brandName } = req.body;
      const updated = await storage.updateBrandSettings({ websiteUrl, instagramHandle, brandName });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── AI: Script Generation ─────────────────────────────────────────────────
  app.post("/api/ai/scripts", async (req, res) => {
    try {
      const { product, niche, count = 5, tone = "relatable" } = req.body;
      if (!product || !niche) return res.status(400).json({ error: "product and niche are required" });
      const brand = await storage.getBrandSettings();
      const scripts = await generateScripts(product, niche, Math.min(Number(count), 20), tone, brand);
      res.json({ scripts });
    } catch (e: any) {
      console.error("Script generation error:", e);
      res.status(500).json({ error: "Failed to generate scripts: " + e.message });
    }
  });

  // ── AI: Market Research ───────────────────────────────────────────────────
  app.post("/api/ai/research", async (req, res) => {
    try {
      const { product, niche } = req.body;
      if (!product || !niche) return res.status(400).json({ error: "product and niche are required" });
      const result = await runMarketResearch(product, niche);
      res.json(result);
    } catch (e: any) {
      console.error("Research error:", e);
      res.status(500).json({ error: "Failed to run research: " + e.message });
    }
  });

  // ── AI: Competitor Intelligence ───────────────────────────────────────────
  app.post("/api/ai/competitor", async (req, res) => {
    try {
      const { niche, competitor } = req.body;
      if (!niche || !competitor) return res.status(400).json({ error: "niche and competitor are required" });
      const result = await analyzeCompetitor(niche, competitor);
      res.json(result);
    } catch (e: any) {
      console.error("Competitor analysis error:", e);
      res.status(500).json({ error: "Failed to analyze competitor: " + e.message });
    }
  });

  // ── AI: Trend Radar ───────────────────────────────────────────────────────
  app.post("/api/ai/trends", async (req, res) => {
    try {
      const { niche } = req.body;
      if (!niche) return res.status(400).json({ error: "niche is required" });
      const result = await getTrendRadar(niche);
      res.json(result);
    } catch (e: any) {
      console.error("Trend radar error:", e);
      res.status(500).json({ error: "Failed to get trends: " + e.message });
    }
  });

  // ── Product Discovery ─────────────────────────────────────────────────────
  app.post("/api/products/discover", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") return res.status(400).json({ error: "url is required" });
      const result = await discoverProducts(url.trim());
      res.json(result);
    } catch (e: any) {
      console.error("Product discovery error:", e);
      res.status(500).json({ error: "Failed to discover products: " + e.message });
    }
  });

  // ── AI: Hook Formula Builder ──────────────────────────────────────────────
  app.post("/api/ai/hook-formulas", async (req, res) => {
    try {
      const { niche } = req.body;
      if (!niche) return res.status(400).json({ error: "niche is required" });
      const result = await getHookFormulas(niche);
      res.json(result);
    } catch (e: any) {
      console.error("Hook formula error:", e);
      res.status(500).json({ error: "Failed to get hook formulas: " + e.message });
    }
  });

  return httpServer;
}

// Simulate Kling-style video generation progress
async function simulateGeneration(videoId: string, jobId: string) {
  const steps = [
    { progress: 20, delay: 1500 },
    { progress: 45, delay: 2000 },
    { progress: 70, delay: 2500 },
    { progress: 90, delay: 1500 },
    { progress: 100, delay: 1000 },
  ];

  for (const step of steps) {
    await new Promise(r => setTimeout(r, step.delay));
    await storage.updatePipelineJob(jobId, { progress: step.progress });
  }

  await storage.updatePipelineJob(jobId, { status: "completed", progress: 100, stage: "Review" });
  await storage.updateVideo(videoId, {
    status: "posted",
    views: Math.floor(Math.random() * 60000) + 5000,
    likes: Math.floor(Math.random() * 3000) + 200,
    shares: Math.floor(Math.random() * 500) + 30,
    revenue: Math.random() * 400 + 80,
  });
}
