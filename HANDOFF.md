# All Things AI — Handoff for Next Session

## Project Location
**Dev path**: `/Users/nicholashouseholder/Projects/all-things-ai/` (non-iCloud)
**Live**: https://all-things-ai.pages.dev | API: https://all-things-ai-worker.nikhouseholdr.workers.dev

## Current State (6 commits, fully deployed)
- 27 active models, 10 tools, 22 pricing plans, 51 benchmarks
- Task Intelligence Advisor with 7 task types, 98 model-task estimates
- AllThingsAI composite scores, community reviews, cost-per-task analysis
- News feed with 900+ ingested articles from RSS/Reddit/HN

## User Feedback — NEXT SESSION TODO

### 1. Two Ranking Lists (not one)
- **Best Overall** ranking (by AllThingsAI composite score)
- **Best Bang for Buck** ranking (by value: score per dollar)
- Currently only composite score leaderboard exists; need a second chart/list

### 2. Task-Specific Sub-Rankings
- When a task is selected, show task-specific model rankings (not just the cost table)
- Each task should have its own "best model for this task" leaderboard

### 3. Per-Model Pricing Dropdown
- Every model in the rankings should have an expandable dropdown showing:
  - All tools/plans where this model is available
  - REAL current prices (monthly subscription cost)
  - Already have model_availability table mapping models to tools/plans
  - Need to surface this in the UI as a dropdown per model row

### 4. Gemini 3.1 Pro Nuance Problem
- User reports Gemini 3.1 Pro Preview is an "overthinker" that lacks human nuance
- Current nuance score (88) may be too high based on real developer experience
- Need to integrate MORE community review sources to better calibrate:
  - Reddit r/Bard, r/GoogleGemini
  - Blind/Glassdoor developer feedback
  - YouTube coding reviews (qualitative)
- Consider adding a "user override" feature where Nick can manually adjust scores
- Gemini 3.1 Pro Preview vs Gemini 3.1 Pro — clarify if these are the same model

### 5. GPT-5.4 Reasoning Levels
- GPT-5.4 has LOW, MEDIUM, HIGH, and EXTRA HIGH thinking modes
- Each level has different token costs (more thinking = more output tokens)
- These should be tracked as separate entries or sub-entries:
  - gpt-5.4-low: faster, cheaper, less thorough
  - gpt-5.4-medium: balanced
  - gpt-5.4-high: deep thinking, higher cost
  - gpt-5.4-xhigh: maximum reasoning, expensive
- Different tasks should recommend different thinking levels
- Research actual token cost multipliers for each level

### 6. Missing Legacy Models
- **GPT-5.3 Codex** — still very relevant for coding tasks, used in Codex product
- **Claude Opus 4.5** — the previous flagship, still viable and sometimes preferred
- Both need to be added back as active models with benchmarks and pricing
- Research their current availability: which tools still offer them?

## Key Files
- `packages/worker/src/db/seed-v2.sql` — current model/tool/benchmark data
- `packages/worker/src/db/seed-task-intelligence.sql` — task estimates + composite scores
- `packages/worker/src/routes/advisor.js` — advisor API endpoints
- `packages/web/src/pages/AdvisorPage.jsx` — advisor frontend (~620 lines)
- `packages/worker/src/services/composite-score-engine.js` — score computation

## Wrangler Commands (from project root)
```bash
# Apply migration
cd packages/worker && ../../node_modules/.bin/wrangler d1 execute all-things-ai-db --remote --file=src/db/migrations/XXXX.sql

# Seed data
cd packages/worker && ../../node_modules/.bin/wrangler d1 execute all-things-ai-db --remote --file=src/db/seed-XXXX.sql

# Deploy worker
cd packages/worker && ../../node_modules/.bin/wrangler deploy

# Build + deploy frontend
cd /Users/nicholashouseholder/Projects/all-things-ai
VITE_API_URL=https://all-things-ai-worker.nikhouseholdr.workers.dev npm run build:web
node_modules/.bin/wrangler pages deploy packages/web/dist --project-name all-things-ai --commit-dirty=true

# Trigger ingestion
curl -s -X POST https://all-things-ai-worker.nikhouseholdr.workers.dev/api/ingest
```

## D1 Resource IDs
- Database: f3f12b72-ab5a-4808-a749-f683f19dd9ea
- CACHE KV: f7a280ca8f2347c8b5bcdb02b5ed6161
- RATE_LIMIT KV: 9a46e26a816f4fc09a7181ea4be8b387
