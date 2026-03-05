import { pgTable, text, varchar, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  product: text("product").notNull(),
  niche: text("niche").notNull(),
  status: text("status").notNull().default("active"),
  videosGenerated: integer("videos_generated").notNull().default(0),
  videosPosted: integer("videos_posted").notNull().default(0),
  totalViews: integer("total_views").notNull().default(0),
  gmv: real("gmv").notNull().default(0),
  costPerVideo: real("cost_per_video").notNull().default(6.5),
  dailyTarget: integer("daily_target").notNull().default(100),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const agents = pgTable("agents", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  platform: text("platform").notNull().default("instagram"),
  postsPerDay: integer("posts_per_day").notNull().default(0),
  followers: integer("followers").notNull().default(0),
  totalVideos: integer("total_videos").notNull().default(0),
  totalViews: integer("total_views").notNull().default(0),
  status: text("status").notNull().default("active"),
  campaignId: varchar("campaign_id", { length: 36 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const videos = pgTable("videos", {
  id: varchar("id", { length: 36 }).primaryKey(),
  campaignId: varchar("campaign_id", { length: 36 }).notNull(),
  agentId: varchar("agent_id", { length: 36 }),
  hook: text("hook").notNull(),
  script: text("script"),
  angle: text("angle"),
  cta: text("cta"),
  platform: text("platform").notNull().default("instagram"),
  status: text("status").notNull().default("pending"),
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  revenue: real("revenue").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pipelineJobs = pgTable("pipeline_jobs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  campaignId: varchar("campaign_id", { length: 36 }).notNull(),
  videoId: varchar("video_id", { length: 36 }),
  stage: text("stage").notNull(),
  status: text("status").notNull().default("pending"),
  progress: integer("progress").notNull().default(0),
  details: text("details"),
  hook: text("hook"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true });
export const insertAgentSchema = createInsertSchema(agents).omit({ id: true, createdAt: true });
export const insertVideoSchema = createInsertSchema(videos).omit({ id: true, createdAt: true });
export const insertPipelineJobSchema = createInsertSchema(pipelineJobs).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type PipelineJob = typeof pipelineJobs.$inferSelect;
export type InsertPipelineJob = z.infer<typeof insertPipelineJobSchema>;
