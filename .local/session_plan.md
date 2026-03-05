# Objective
Build all 5 next features for Reel2Revenue:
1. Save scripts to campaigns (Script Generator → Campaign)
2. Real dashboard charts (Recharts)
3. Video generation simulation (Kling-style)
4. Kanban pipeline board (drag between stages)
5. Agent profile pages

# Tasks

### T001: Schema & Storage Extensions
- **Blocked By**: []
- **Details**:
  - Add `angle`, `cta`, `generationStatus` fields to videos table in shared/schema.ts
  - Add `videoId`, `hook` to pipeline_jobs table
  - Add `updateVideo`, `getChartData` methods to IStorage + MemStorage
  - Update seedData to use new fields
  - Files: shared/schema.ts, server/storage.ts

### T002: Dashboard Charts (Recharts)
- **Blocked By**: [T001]
- **Details**:
  - Install recharts
  - Add weekly video output bar chart, GMV by campaign bar chart, views trend line chart
  - Keep existing stat cards, add charts section below
  - Files: client/src/pages/dashboard.tsx

### T003: Script Generator → Save to Campaign
- **Blocked By**: [T001]
- **Details**:
  - Add campaign selector dropdown to ScriptGenerator
  - Add "Save to Campaign" button per script card
  - POST to /api/videos with hook, script, angle, cta, campaignId
  - Show toast on success
  - Files: client/src/pages/script-generator.tsx, server/routes.ts

### T004: Kanban Pipeline Board
- **Blocked By**: [T001]
- **Details**:
  - Redesign pipeline.tsx as 5-column kanban: Research | Scripting | Generating | Review | Posted
  - Video/job cards draggable between columns using @dnd-kit/core
  - Real-time stage update via PATCH /api/pipeline/:id
  - Campaign selector to filter
  - Files: client/src/pages/pipeline.tsx, server/routes.ts

### T005: Kling-Style Video Generation
- **Blocked By**: [T001, T003]
- **Details**:
  - Add "Generate Video" button to scripted video cards (status=scripted)
  - Clicking creates a pipeline job and simulates progress (polling every 2s)
  - Auto-advances job through stages with realistic timing
  - Update video status to "generating" → "posted"
  - Files: server/routes.ts, server/storage.ts, client/src/pages/videos.tsx

### T006: Agent Profile Pages
- **Blocked By**: [T001]
- **Details**:
  - Create /agents/:id page with full profile: stats, campaign, posting schedule, recent videos
  - Clickable agent cards on agents.tsx navigate to profile
  - Back button, edit inline stats
  - Files: client/src/pages/agent-profile.tsx, client/src/pages/agents.tsx, client/src/App.tsx
