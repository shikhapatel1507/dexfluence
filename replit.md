# Reel2Revenue — AI Content Manufacturing Engine

## Overview
A full-stack SaaS platform for AI-powered Instagram Shop content manufacturing. Generates 300+ shoppable videos/day using AI tools (Kling simulation, OpenAI GPT scripts, automated pipeline).

## Architecture

### Tech Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + Recharts + @dnd-kit
- **Backend**: Express.js + TypeScript
- **State**: TanStack Query v5
- **Forms**: react-hook-form + zod + drizzle-zod
- **AI**: OpenAI via Replit AI Integrations (no personal key needed)
- **Storage**: In-memory (MemStorage) — no database required

### Pages
1. `/` — Landing (marketing, hero, features, CTA)
2. `/dashboard` — Stats, 3 live Recharts (weekly output bar, views trend line, campaign GMV bar), top campaigns
3. `/campaigns` — CRUD campaigns with status, targets, GMV
4. `/agents` — Agent grid (click card → profile), deploy/pause/delete
5. `/agents/:id` — Agent profile: stats, daily schedule, engagement estimates, recent videos
6. `/pipeline` — Kanban board (Research | Scripting | Generating | Review | Posted), drag-and-drop via @dnd-kit
7. `/videos` — Video grid with "Generate with Kling" button (simulated generation with live progress bar)
8. `/analytics` — Analytics dashboard
9. `/scripts` — GPT Script Generator (hooks + full scripts + CTA + angle), save to campaign
10. `/research` — GPT Market Research (viral hooks, top angles, competitor insights, recommendations)

### Key Features
- **Script Generator → Campaign**: Generate GPT scripts, select a campaign, save scripts as "scripted" videos
- **Kling Video Generation Simulation**: Click "Generate with Kling" on any video — shows live progress bar, auto-advances through pipeline stages, marks as posted with stats
- **Kanban Pipeline**: 5-column drag-and-drop board, filter by campaign, quick-add jobs, live polling every 3s
- **Agent Profiles**: Full detail page per agent with posting schedule, engagement estimates, assigned videos
- **Live Charts**: Three Recharts charts on dashboard — weekly bar chart, views trend line, GMV horizontal bar

### API Routes
- `GET/POST /api/campaigns` + `GET/PATCH/DELETE /api/campaigns/:id`
- `GET/POST /api/agents` + `GET/PATCH/DELETE /api/agents/:id`
- `GET/POST /api/videos` + `PATCH /api/videos/:id`
- `POST /api/videos/:id/generate` — triggers Kling simulation
- `GET/POST /api/pipeline` + `PATCH /api/pipeline/:id`
- `GET /api/stats` — aggregate metrics
- `GET /api/chart-data` — time-series data for dashboard charts
- `POST /api/ai/scripts` — OpenAI GPT script generation
- `POST /api/ai/research` — OpenAI GPT market research

### AI Integration
- Uses Replit AI Integrations for OpenAI (billed to Replit credits)
- Env vars: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
- Model: gpt-5.2

### Pre-seeded Demo Data
- 4 campaigns (SkinGlow Serum, FitFuel, PetPure, HomeBrewKit)
- 8 agents with followers, views, posting schedules
- 20 videos with angles, CTAs, and stats
- 5 pipeline jobs across kanban stages
