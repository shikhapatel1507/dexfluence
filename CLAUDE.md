# CLAUDE.md — Dexfluence Codebase Guide

This file documents the architecture, conventions, and development workflows for the Dexfluence codebase. It is intended to help AI assistants and new contributors navigate and extend the project effectively.

---

## Project Overview

**Dexfluence** is a full-stack SaaS platform for AI-powered Instagram Shop content creation and monetization. It enables brands and influencers (agents) to generate video scripts, manage production pipelines, track analytics, and run campaigns — all powered by Anthropic's Claude AI.

---

## Repository Structure

```
dexfluence/
├── client/                   # React frontend (Vite + TypeScript)
│   └── src/
│       ├── components/       # UI components
│       │   └── ui/           # shadcn/ui primitives (49+ files)
│       ├── pages/            # Route-level page components (25 pages)
│       ├── hooks/            # Custom React hooks
│       └── lib/              # Shared utilities (queryClient, utils)
├── server/                   # Express backend (TypeScript)
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # All API route definitions
│   ├── auth.ts               # Passport.js authentication
│   ├── ai.ts                 # Anthropic AI integration
│   ├── storage.ts            # Storage interface + MemStorage fallback
│   ├── product-discovery.ts  # Product discovery logic
│   └── vite.ts               # Vite dev server integration
├── shared/                   # Shared types used by both client and server
│   ├── schema.ts             # Drizzle ORM schema + Zod types
│   └── models/chat.ts        # Chat data models
├── script/                   # Build scripts
├── drizzle.config.ts         # Drizzle ORM config (PostgreSQL)
├── vite.config.ts            # Vite bundler config
├── tailwind.config.ts        # Tailwind CSS config
├── tsconfig.json             # TypeScript config
└── .env.example              # Required environment variables
```

---

## Tech Stack

### Frontend
| Tool | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| Vite | 7.3.0 | Dev server + bundler |
| TypeScript | 5.6.3 | Type safety |
| Tailwind CSS | 3.4.17 | Utility-first styling |
| shadcn/ui | Latest | Component library (Radix UI based) |
| TanStack Query | 5.60.5 | Server state management |
| wouter | 3.3.5 | Client-side routing (SPA) |
| react-hook-form | 7.55.0 | Form management |
| zod | 3.25.76 | Schema validation |
| recharts | 2.15.4 | Data visualizations |
| framer-motion | 11.13.1 | Animations |
| @dnd-kit | Latest | Drag-and-drop (Kanban board) |

### Backend
| Tool | Version | Purpose |
|---|---|---|
| Express | 5.0.1 | HTTP server |
| TypeScript (tsx) | 4.20.5 | TypeScript executor |
| Passport.js | 0.7.0 | Authentication (local strategy) |
| Drizzle ORM | 0.39.3 | Type-safe PostgreSQL queries |
| connect-pg-simple | 10.0.0 | PostgreSQL session store |
| @anthropic-ai/sdk | 0.39.0 | AI (Claude) integration |
| ws | 8.18.0 | WebSocket support |

### Database
- **PostgreSQL** (primary) via Drizzle ORM
- **In-memory MemStorage** (fallback when `DATABASE_URL` is absent)

---

## Environment Setup

Copy `.env.example` and populate the values:

```bash
cp .env.example .env
```

Required variables:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here   # Required for all AI features
DATABASE_URL=postgresql://...                    # Optional; falls back to MemStorage
NODE_ENV=production                              # Optional
PORT=5000                                        # Optional (default: 5000)
```

Node.js version: **>= 20** (see `.nvmrc`)

---

## Development Workflow

### Install dependencies
```bash
npm install
```

### Start dev server
```bash
npm run dev
```
This runs Express + Vite together. Frontend is served at `http://localhost:5000`. The server proxies API calls and serves the React SPA.

### Type checking
```bash
npm run check
```

### Database migrations (Drizzle)
```bash
npm run db:push
```
Syncs the schema from `shared/schema.ts` to the connected PostgreSQL database. Does **not** generate migration files — uses `push` mode.

### Production build
```bash
npm run build
npm run start
```
Build output goes to `dist/` (`dist/public` for frontend, `dist/index.cjs` for server).

---

## Database Schema

Defined in `shared/schema.ts` using Drizzle ORM. All IDs are `varchar(36)` UUIDs except chat entities (serial integers).

### Tables

| Table | Key Fields |
|---|---|
| `users` | `id`, `username`, `password` |
| `campaigns` | `id`, `name`, `product`, `niche`, `status`, `gmv`, `videosGenerated` |
| `agents` | `id`, `name`, `platform`, `campaignId`, `followers`, `status` |
| `videos` | `id`, `campaignId`, `agentId`, `hook`, `script`, `angle`, `status`, `views` |
| `pipelineJobs` | `id`, `campaignId`, `videoId`, `stage`, `status`, `progress` |
| `conversations` | `id`, `title`, `createdAt` |
| `messages` | `id`, `conversationId`, `role`, `content` |

**Relationships**:
- `agents.campaignId` → `campaigns.id`
- `videos.campaignId` → `campaigns.id`, `videos.agentId` → `agents.id`
- `pipelineJobs.campaignId` → `campaigns.id`, `pipelineJobs.videoId` → `videos.id`
- `messages.conversationId` → `conversations.id` (cascade delete)

**Zod schemas** are auto-generated via `drizzle-zod` (`insertXxxSchema` / select types exported from `shared/schema.ts`).

---

## API Routes

All routes are defined in `server/routes.ts`. Base path: `/api/`.

### Health
- `GET /` — Returns "OK"
- `GET /health` — Standard health check
- `GET /healthz` — Kubernetes-style health check

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/user`

### Campaigns
- `GET /api/campaigns`
- `POST /api/campaigns`
- `GET /api/campaigns/:id`
- `PATCH /api/campaigns/:id`
- `DELETE /api/campaigns/:id`

### Agents
- `GET /api/agents`
- `POST /api/agents`
- `GET /api/agents/:id`
- `PATCH /api/agents/:id`
- `DELETE /api/agents/:id`

### Videos
- `GET /api/videos`
- `POST /api/videos`
- `PATCH /api/videos/:id`
- `POST /api/videos/:id/generate`

### Pipeline Jobs
- `GET /api/pipeline`
- `POST /api/pipeline`
- `PATCH /api/pipeline/:id`

### AI Features (Anthropic / Claude)
- `POST /api/ai/scripts` — Generate video scripts
- `POST /api/ai/research` — Market research
- `POST /api/ai/competitor` — Competitor analysis
- `POST /api/ai/trends` — Trend analysis
- `POST /api/ai/hooks` — Hook formula generation

### Analytics
- `GET /api/stats`
- `GET /api/chart-data`
- `GET /api/analytics/gmv-attribution`
- `GET /api/analytics/heatmap`

### Products & Brand
- `POST /api/products/discover`
- `GET /api/brand-settings`
- `PATCH /api/brand-settings`

---

## Frontend Architecture

### Routing
Uses **wouter** for lightweight SPA routing. All routes are declared in `client/src/App.tsx`.

### State Management
- **TanStack Query** (`useQuery`, `useMutation`) for all server data
- **react-hook-form** for form state
- No global client state library (no Redux/Zustand)

### Query Client
Configured in `client/src/lib/queryClient.ts`. Default stale time and cache settings apply. Invalidate queries after mutations using `queryClient.invalidateQueries`.

### Data Fetching Pattern
```typescript
// Fetch
const { data, isLoading } = useQuery({
  queryKey: ["/api/campaigns"],
  queryFn: () => fetch("/api/campaigns").then(r => r.json()),
});

// Mutate
const mutation = useMutation({
  mutationFn: (data) => apiRequest("POST", "/api/campaigns", data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] }),
});
```

### Styling Conventions
- **Tailwind CSS** utility classes only — no custom CSS files except `index.css` for globals
- **Dark mode** via class strategy (`class="dark"`) — theme provider wraps entire app
- **shadcn/ui** components in `client/src/components/ui/` — do **not** edit these directly; regenerate via `npx shadcn-ui@latest add <component>`
- Custom colors and animations are defined in `tailwind.config.ts`

### Path Aliases
Defined in `tsconfig.json` and `vite.config.ts`:
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

---

## AI Integration

AI features live in `server/ai.ts`. All AI calls use the **Anthropic SDK** with model `claude-sonnet-4-6`.

### Pattern
```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 2048,
  messages: [{ role: "user", content: prompt }],
});
```

- All AI routes are under `/api/ai/`
- Prompts are constructed server-side from request body parameters
- Responses are parsed and returned as JSON

---

## Storage Layer

`server/storage.ts` exports an `IStorage` interface. The app uses either:
1. **DatabaseStorage** — Drizzle ORM with PostgreSQL (when `DATABASE_URL` is set)
2. **MemStorage** — In-memory Map-based store (development fallback)

When adding new data operations, implement the method on `IStorage` and add implementations to both `DatabaseStorage` and `MemStorage`.

---

## Key Conventions

### TypeScript
- **Strict mode** enabled — no `any` unless absolutely necessary
- Import shared types from `@shared/schema` (e.g., `Campaign`, `Agent`, `Video`)
- Use `insertXxxSchema` for Zod validation of incoming data
- UUIDs for entity IDs: use `crypto.randomUUID()` or similar

### Backend
- All route handlers are in `server/routes.ts` — keep them thin; business logic in dedicated files
- Use `req.isAuthenticated()` (Passport) to guard protected routes
- Log API requests via the request logger middleware (already registered)
- Error handling middleware is registered at the end of `server/index.ts`

### Frontend Components
- Page components go in `client/src/pages/`
- Reusable components go in `client/src/components/`
- shadcn/ui primitives go in `client/src/components/ui/` (auto-generated, do not manually edit)
- Custom hooks go in `client/src/hooks/`

### Forms
Use `react-hook-form` with `zodResolver`:
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCampaignSchema } from "@shared/schema";

const form = useForm({
  resolver: zodResolver(insertCampaignSchema),
});
```

### API Requests from Frontend
Use the `apiRequest` helper from `client/src/lib/queryClient.ts` for mutations. Raw `fetch` is fine for queries used in `useQuery`.

---

## Pages Reference

| Route | File | Description |
|---|---|---|
| `/` | `landing.tsx` | Marketing homepage |
| `/login` | `login.tsx` | Auth login |
| `/register` | `register.tsx` | Auth registration |
| `/dashboard` | `dashboard.tsx` | Main analytics dashboard |
| `/brand-dashboard` | `brand-dashboard.tsx` | Brand settings dashboard |
| `/campaigns` | `campaigns.tsx` | Campaign list |
| `/campaigns/:id` | `campaign-detail.tsx` | Campaign detail |
| `/campaigns/new` | `campaign-wizard.tsx` | Campaign creation wizard |
| `/agents` | `agents.tsx` | Agent grid |
| `/agents/:id` | `agent-profile.tsx` | Agent statistics |
| `/pipeline` | `pipeline.tsx` | Kanban drag-and-drop pipeline |
| `/videos` | `videos.tsx` | Video grid |
| `/analytics` | `analytics.tsx` | Advanced analytics |
| `/script-generator` | `script-generator.tsx` | AI script generation |
| `/research` | `research.tsx` | Market research |
| `/products` | `products.tsx` | Product discovery |
| `/competitor` | `competitor.tsx` | Competitor analysis |
| `/trends` | `trends.tsx` | Trend tracking |
| `/performance` | `performance.tsx` | Performance metrics |
| `/calendar` | `calendar.tsx` | Content calendar |
| `/settings` | `settings.tsx` | User settings |
| `/billing` | `billing.tsx` | Billing management |
| `/onboarding` | `onboarding.tsx` | Onboarding flow |
| `/templates` | `templates.tsx` | Template management |
| `/ab-test` | `ab-test.tsx` | A/B testing interface |

---

## Deployment

### Railway (primary)
Configuration in `railway.json`. Uses Nixpacks builder. Health check at `/health`.

### Docker
```bash
docker build -t dexfluence .
docker run -p 5000:5000 -e ANTHROPIC_API_KEY=... dexfluence
```

### Replit
`.replit` configures modules, ports, and deployment. Run command is `npm run dev`.

### Environment Variables for Production
| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |
| `DATABASE_URL` | Recommended | PostgreSQL connection string |
| `NODE_ENV` | No | Set to `production` |
| `PORT` | No | HTTP port (default: 5000) |
| `SESSION_SECRET` | Recommended | Express session secret |

---

## Common Tasks for AI Assistants

### Adding a new API endpoint
1. Add the route handler in `server/routes.ts`
2. Add the method to `IStorage` interface in `server/storage.ts`
3. Implement in both `DatabaseStorage` and `MemStorage`
4. Add the corresponding `useQuery`/`useMutation` on the frontend page

### Adding a new page
1. Create `client/src/pages/my-page.tsx`
2. Add the route in `client/src/App.tsx` using wouter `<Route>`
3. Add navigation in `client/src/components/app-sidebar.tsx` if needed

### Adding a new shadcn/ui component
```bash
npx shadcn-ui@latest add <component-name>
```
This places the component in `client/src/components/ui/`.

### Adding a new database table
1. Add the table definition in `shared/schema.ts`
2. Export insert/select types
3. Run `npm run db:push` to sync with PostgreSQL
4. Implement CRUD methods in `IStorage`, `DatabaseStorage`, and `MemStorage`

### Adding a new AI feature
1. Add the POST route in `server/routes.ts`
2. Implement the Anthropic call in `server/ai.ts`
3. Call from the frontend via `useMutation` + `apiRequest`
