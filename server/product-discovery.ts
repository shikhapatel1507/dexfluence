import * as https from "https";
import * as http from "http";
import { getAnthropicClient } from "./ai";

export interface DiscoveredProduct {
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

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Dexfluence/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      timeout: 10000,
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timed out")); });
  });
}

function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, "")
    .trim()
    .slice(0, 6000);
}

function detectSourceType(url: string): "instagram" | "website" {
  return url.includes("instagram.com") ? "instagram" : "website";
}

function extractInstagramHandle(url: string): string {
  const match = url.match(/instagram\.com\/([^/?#]+)/);
  return match ? match[1] : url;
}

async function callAnthropic(prompt: string, maxTokens: number): Promise<string> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text : "[]";
}

async function discoverFromWebsite(url: string, htmlContent: string): Promise<DiscoveredProduct[]> {
  const textContent = extractTextFromHtml(htmlContent);

  const prompt = `You are a product intelligence specialist for social commerce.
Analyze this website content and extract all shoppable products you can identify.

Website URL: ${url}
Content: ${textContent}

Return a JSON array of products found on this website. For each product return:
{
  "name": "exact product name",
  "description": "2-3 sentence product description highlighting benefits",
  "price": "price if found, e.g. '$29.99', or 'varies' if not clear",
  "category": "product category",
  "niche": "best social commerce niche (skincare, fitness supplements, pet care, home & kitchen, beauty, fashion, tech, wellness)",
  "tags": ["tag1", "tag2", "tag3"],
  "viralPotential": "high or medium or low based on how shareable/visual this product is",
  "confidence": "high if clearly a product, medium if inferred, low if uncertain",
  "suggestedHook": "One viral Instagram hook for this product under 12 words"
}

Extract up to 12 products. If the page is not a product/e-commerce page, extract any services or offerings you can find.
Return ONLY a valid JSON array. No explanation, no markdown.`;

  const content = await callAnthropic(prompt, 4096);
  try {
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const products = JSON.parse(cleaned);
    return products.map((p: any, i: number) => ({
      ...p,
      id: `discovered-${Date.now()}-${i}`,
      imageUrl: null,
      sourceUrl: url,
    }));
  } catch {
    return [];
  }
}

async function discoverFromInstagram(url: string): Promise<DiscoveredProduct[]> {
  const handle = extractInstagramHandle(url);

  const prompt = `You are a product intelligence specialist for Instagram Shop and social commerce.
Analyze this Instagram account and infer what products they likely sell based on their handle and niche.

Instagram Handle: @${handle}
Profile URL: ${url}

Based on the handle name, infer:
1. What niche/industry this account is in
2. What types of products they likely sell or promote
3. Create realistic product listings they would carry

Return a JSON array of 8 likely products for this Instagram account:
{
  "name": "realistic product name for this brand/niche",
  "description": "2-3 sentence benefit-focused description a creator would use",
  "price": "realistic price range for this product type",
  "category": "product category",
  "niche": "best social commerce niche (skincare, fitness supplements, pet care, home & kitchen, beauty, fashion, tech, wellness)",
  "tags": ["tag1", "tag2", "tag3"],
  "viralPotential": "high or medium or low",
  "confidence": "medium",
  "suggestedHook": "One viral Instagram hook for this product under 12 words"
}

Return ONLY a valid JSON array. No explanation, no markdown.`;

  const content = await callAnthropic(prompt, 4096);
  try {
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const products = JSON.parse(cleaned);
    return products.map((p: any, i: number) => ({
      ...p,
      id: `instagram-${Date.now()}-${i}`,
      imageUrl: null,
      sourceUrl: url,
    }));
  } catch {
    return [];
  }
}

export async function discoverProducts(url: string): Promise<{
  products: DiscoveredProduct[];
  sourceType: "instagram" | "website";
  sourceName: string;
  error?: string;
}> {
  const sourceType = detectSourceType(url);

  if (sourceType === "instagram") {
    const handle = extractInstagramHandle(url);
    const products = await discoverFromInstagram(url);
    return { products, sourceType, sourceName: `@${handle}` };
  }

  try {
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const html = await fetchUrl(normalizedUrl);
    const products = await discoverFromWebsite(normalizedUrl, html);
    const domain = new URL(normalizedUrl).hostname.replace("www.", "");
    return { products, sourceType, sourceName: domain };
  } catch (fetchError: any) {
    // If fetching fails, fall back to AI-only inference from the URL
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    let domain = url;
    try { domain = new URL(normalizedUrl).hostname.replace("www.", ""); } catch {}

    const prompt = `You are a product intelligence specialist.
Based only on this website domain/URL, infer what products or services this business sells.

URL: ${url}
Domain: ${domain}

Return a JSON array of 6 likely products for this website:
{
  "name": "realistic product name",
  "description": "2-3 sentence benefit-focused description",
  "price": "realistic price estimate",
  "category": "product category",
  "niche": "best social commerce niche",
  "tags": ["tag1", "tag2"],
  "viralPotential": "high or medium or low",
  "confidence": "low",
  "suggestedHook": "One viral Instagram hook under 12 words"
}
Return ONLY a valid JSON array. No explanation.`;

    const content = await callAnthropic(prompt, 2048);
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const products = JSON.parse(cleaned).map((p: any, i: number) => ({
        ...p,
        id: `inferred-${Date.now()}-${i}`,
        imageUrl: null,
        sourceUrl: url,
      }));
      return { products, sourceType, sourceName: domain };
    } catch {
      return { products: [], sourceType, sourceName: domain, error: "Could not extract products" };
    }
  }
}
