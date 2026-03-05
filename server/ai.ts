import Anthropic from "@anthropic-ai/sdk";

export function getAnthropicClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
  });
}

export interface GeneratedScript {
  hook: string;
  script: string;
  cta: string;
  angle: string;
  estimatedViews: string;
}

export interface ResearchResult {
  viralHooks: string[];
  topAngles: Array<{ angle: string; avgViews: string; conversionRate: string }>;
  trendingFormats: string[];
  competitorInsights: Array<{ hook: string; views: string; platform: string; why: string }>;
  recommendations: string[];
  niche: string;
  product: string;
}

export interface CompetitorResult {
  competitor: string;
  niche: string;
  topHooks: Array<{ hook: string; estimatedViews: string; angle: string; why: string }>;
  contentGaps: Array<{ gap: string; opportunity: string; difficulty: "easy" | "medium" | "hard" }>;
  postingPatterns: Array<{ insight: string; detail: string }>;
  stealTheseAngles: Array<{ angle: string; template: string; tip: string }>;
  weaknesses: string[];
  strengths: string[];
  summary: string;
}

export interface TrendRadarResult {
  niche: string;
  trendingHooks: Array<{ hook: string; trendScore: number; momentum: "rising" | "peak" | "declining"; estimatedViews: string }>;
  trendingProducts: Array<{ product: string; reason: string; urgency: "hot" | "warm" | "watch" }>;
  trendingFormats: Array<{ format: string; description: string; exampleHook: string }>;
  trendingSounds: Array<{ sound: string; type: string; usage: string }>;
  winningAngles: Array<{ angle: string; why: string; estimatedConversion: string }>;
  weeklyInsight: string;
  bestPostingTimes: Array<{ day: string; time: string; reason: string }>;
}

export interface HookFormulaResult {
  niche: string;
  formulas: Array<{
    name: string;
    emotion: string;
    template: string;
    example: string;
    tip: string;
    estimatedViews: string;
    difficulty: "beginner" | "intermediate" | "advanced";
  }>;
}

async function callClaude(prompt: string): Promise<string> {
  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text : "{}";
}

function parseJSON<T>(content: string, fallback: T): T {
  try {
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
}

export async function generateScripts(
  product: string,
  niche: string,
  count: number,
  tone: string = "relatable",
  brand?: { websiteUrl?: string; instagramHandle?: string },
): Promise<GeneratedScript[]> {
  const hasWebsite = brand?.websiteUrl && brand.websiteUrl.trim();
  const hasHandle = brand?.instagramHandle && brand.instagramHandle.trim();
  const handle = hasHandle
    ? (brand!.instagramHandle!.startsWith("@") ? brand!.instagramHandle! : `@${brand!.instagramHandle!}`)
    : null;
  const website = hasWebsite ? brand!.websiteUrl!.trim() : null;

  const brandContext = [
    hasWebsite ? `Brand website: ${website}` : "",
    hasHandle ? `Instagram page: ${handle}` : "",
  ].filter(Boolean).join("\n");

  const ctaGuidance = [
    hasWebsite
      ? `- Always include "link in bio" in the CTA pointing to ${website}`
      : "- End with a compelling link-in-bio CTA",
    hasHandle
      ? `- Tag ${handle} in the caption line at the end of the script`
      : "",
  ].filter(Boolean).join("\n");

  const prompt = `You are an expert Instagram Shop content strategist.
Generate ${count} unique, high-converting video scripts for this product.

Product: ${product}
Niche: ${niche}
Tone: ${tone}${brandContext ? `\n${brandContext}` : ""}

For each script return a JSON object with:
- hook: Opening line under 12 words
- script: Full 30-60 second video script
- cta: One strong call-to-action
- angle: Content angle used
- estimatedViews: View estimate range

${ctaGuidance}

Return ONLY a valid JSON array of ${count} objects. No markdown, no explanation.`;

  const content = await callClaude(prompt);
  return parseJSON<GeneratedScript[]>(content, []);
}

export async function runMarketResearch(product: string, niche: string): Promise<ResearchResult> {
  const prompt = `You are a viral content research analyst for Instagram Shop and TikTok Shop.

Product: ${product}
Niche: ${niche}

Return a JSON object:
{
  "viralHooks": [10 viral hooks],
  "topAngles": [{"angle": "", "avgViews": "", "conversionRate": ""}],
  "trendingFormats": [5 formats],
  "competitorInsights": [{"hook": "", "views": "", "platform": "", "why": ""}],
  "recommendations": [5 recommendations],
  "niche": "${niche}",
  "product": "${product}"
}

Include 5 topAngles and 4 competitorInsights. Return ONLY valid JSON.`;

  const content = await callClaude(prompt);
  return parseJSON<ResearchResult>(content, {
    viralHooks: [], topAngles: [], trendingFormats: [],
    competitorInsights: [], recommendations: [], niche, product,
  });
}

export async function analyzeCompetitor(niche: string, competitor: string): Promise<CompetitorResult> {
  const prompt = `You are a competitive intelligence analyst for social commerce.

Competitor: ${competitor}
Niche: ${niche}

Return JSON:
{
  "competitor": "${competitor}",
  "niche": "${niche}",
  "topHooks": [{"hook": "", "estimatedViews": "", "angle": "", "why": ""}],
  "contentGaps": [{"gap": "", "opportunity": "", "difficulty": "easy"}],
  "postingPatterns": [{"insight": "", "detail": ""}],
  "stealTheseAngles": [{"angle": "", "template": "", "tip": ""}],
  "weaknesses": [],
  "strengths": [],
  "summary": ""
}

Include 5 topHooks, 4 contentGaps, 4 postingPatterns, 5 stealTheseAngles.
Return ONLY valid JSON.`;

  const content = await callClaude(prompt);
  return parseJSON<CompetitorResult>(content, {
    competitor, niche, topHooks: [], contentGaps: [],
    postingPatterns: [], stealTheseAngles: [],
    weaknesses: [], strengths: [], summary: "",
  });
}

export async function getTrendRadar(niche: string): Promise<TrendRadarResult> {
  const prompt = `You are a viral content trend analyst for Instagram Shop and TikTok Shop in 2026.

Niche: ${niche}

Return JSON:
{
  "niche": "${niche}",
  "trendingHooks": [{"hook": "", "trendScore": 94, "momentum": "rising", "estimatedViews": ""}],
  "trendingProducts": [{"product": "", "reason": "", "urgency": "hot"}],
  "trendingFormats": [{"format": "", "description": "", "exampleHook": ""}],
  "trendingSounds": [{"sound": "", "type": "", "usage": ""}],
  "winningAngles": [{"angle": "", "why": "", "estimatedConversion": ""}],
  "weeklyInsight": "",
  "bestPostingTimes": [{"day": "", "time": "", "reason": ""}]
}

Include 6 trendingHooks, 5 trendingProducts, 4 trendingFormats, 4 trendingSounds, 4 winningAngles, 3 bestPostingTimes.
Return ONLY valid JSON.`;

  const content = await callClaude(prompt);
  return parseJSON<TrendRadarResult>(content, {
    niche, trendingHooks: [], trendingProducts: [],
    trendingFormats: [], trendingSounds: [],
    winningAngles: [], weeklyInsight: "", bestPostingTimes: [],
  });
}

export async function getHookFormulas(niche: string): Promise<HookFormulaResult> {
  const prompt = `You are a viral hook strategist for Instagram Shop and TikTok Shop.

Niche: ${niche}

Return JSON:
{
  "niche": "${niche}",
  "formulas": [
    {
      "name": "",
      "emotion": "",
      "template": "",
      "example": "",
      "tip": "",
      "estimatedViews": "",
      "difficulty": "beginner"
    }
  ]
}

Generate 12 diverse formulas. difficulty is: beginner, intermediate, or advanced.
Return ONLY valid JSON.`;

  const content = await callClaude(prompt);
  return parseJSON<HookFormulaResult>(content, { niche, formulas: [] });
}
export const getOpenAIClient = getAnthropicClient;
