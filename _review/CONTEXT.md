PROJECT: all-things-ai
REPO: https://github.com/nhouseholder/all-things-ai.git
LIVE_URL: https://all-things-ai.pages.dev
TECH_STACK: React 18 + Vite (frontend), Cloudflare Workers + Hono (backend)
CSS_FRAMEWORK: Tailwind CSS
BACKEND: Cloudflare Workers (Hono router), D1 database, KV caching, Workers AI (Llama 3.3 70B)
LAST_COMMIT: 2026-03-27 — feat(home): add expandable score breakdown to ranking table rows
HANDOFF_STATUS: All tasks completed. Session added: AI Industry Monitor, tool descriptions/install/model compat, community review scraping, radar chart fix, advisor quick replies, BYOK distinction, top model tiles on all tabs, expandable score breakdowns.
VERSION: v0.7.0

STRUCTURE:
- packages/web/ — React SPA (Vite, TanStack Query, Recharts, Tailwind)
- packages/worker/ — Cloudflare Worker (Hono, D1, KV, Workers AI)
  - src/routes/ — API routes (feed, models, tools, benchmarks, cost, recommendations, advisor, admin, coding-tools, alerts)
  - src/pipelines/ — Data ingestion (RSS, Reddit, HN, pricing, model discovery, benchmarks, GitHub tools, industry monitor, tool reviews)
  - src/services/ — Business logic (scoring engines, review analysis, recommendation engine, email)
  - src/db/ — Schema, seeds, migrations (22 migrations)

PAGES: Home, Models/Advisor, AI Advisor Chat, Compare, Tools, Plugins, Optimize, Alerts, Dashboard, Settings

KEY FEATURES:
- LLM model rankings with composite scoring (7 benchmark dimensions + community)
- Tool/plugin directory with reviews, install info, model compatibility
- AI advisor chat (Workers AI powered)
- Side-by-side model comparison with radar charts
- Cost optimization recommendations
- AI Industry Monitor (daily scraper for vendor blogs/pricing pages)
- Community review scraping from Reddit + HN
