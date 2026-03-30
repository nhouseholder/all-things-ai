# All Things AI — Priorities 1-6 Implementation Plan

## Priority 1: Model Detail Pages (`/models/:slug`)

**Goal:** Dedicated page per model with benchmarks, reviews, pricing, alternatives.

### Backend: Enrich `/api/models/:slug`
The existing endpoint returns basic model + benchmarks + availability. Enrich it with:
- Composite score + all 7 components (join `model_composite_scores`)
- Community reviews summary (aggregate from `community_reviews`)
- Task estimates across all task profiles (join `model_task_estimates` + `task_profiles`)
- Alternatives (join `model_alternatives`)
- Pricing: input/output/cache per MTok, blended cost, bang_for_buck

Single enriched endpoint — no new routes needed.

### Frontend: `ModelDetailPage.jsx`
- **Route:** `/models/:slug` in App.jsx
- **Hook:** `useModelDetail(slug)` → `GET /api/models/${slug}`
- **Layout sections:**
  1. **Header:** Model name, vendor, family, open-weight badge, composite score ring
  2. **Score breakdown:** 7 component bars (reuse `ScoreBreakdownRow` pattern from HomePage)
  3. **Benchmark table:** All raw benchmark scores with normalized bars
  4. **Task performance:** Grid of task cards showing success rate, cost, steering, autonomy per task
  5. **Pricing:** Token costs table + where to use it (availability cards sorted by price)
  6. **Community:** Review count, satisfaction, sentiment, user-type breakdown bars
  7. **Alternatives:** Cards for similar models with similarity score, cost savings %
- **Navigation:** Link from HomePage leaderboards, ComparePage, ModelsPage rows → `/models/{slug}`
- No sidebar entry (too granular — accessed via model name clicks)

### Files changed:
- `packages/worker/src/routes/models.js` — enrich `GET /:slug`
- `packages/web/src/pages/ModelDetailPage.jsx` — NEW
- `packages/web/src/App.jsx` — add route
- `packages/web/src/lib/api.js` — already has `getModel(slug)`
- `packages/web/src/lib/hooks.js` — add `useModelDetail(slug)`
- `packages/web/src/pages/HomePage.jsx` — model names become Links
- `packages/web/src/pages/ComparePage.jsx` — model names become Links

---

## Priority 2: Full Ranking Audit

**Goal:** Verify all model families ordered correctly after community cap change.

### Approach:
- Query `/api/advisor/rankings` and `/api/advisor/composite-scores`
- Verify composite_score order matches expected family hierarchy
- Check community_adjustment values are within ±5.0 cap
- Check cross-vendor proximity guard (2.0 point minimum between vendors at top)
- Report any anomalies

### Implementation:
- Create a one-time audit script `packages/worker/scripts/ranking-audit.js`
- Run it, fix any data issues found, delete the script
- No frontend changes unless anomalies found

### Files changed:
- `packages/worker/scripts/ranking-audit.js` — NEW (temporary)

---

## Priority 3: Expand Coding Tools to 100+

**Goal:** Currently 34 coding tools, expand to 100+.

### Approach:
- Create a discovery script that finds MCP servers, VS Code extensions, CLI tools from:
  - GitHub topics: `mcp-server`, `ai-coding`, `code-assistant`
  - VS Code marketplace: AI/ML category
  - Known tool directories
- Insert new entries into `coding_tools` table with basic metadata
- Let existing scoring pipeline (`plugin-score-engine.js`) score them on next cron run

### Implementation:
- `packages/worker/scripts/expand-coding-tools.js` — discovery + insert script
- Run once, verify count, commit data

### Files changed:
- `packages/worker/scripts/expand-coding-tools.js` — NEW (one-time)
- Database: new rows in `coding_tools`

---

## Priority 4: Dashboard Command Center

**Goal:** Subscriptions, alerts, ranking changes, personalized recommendations.

### Backend:
- New endpoint `GET /api/dashboard/summary` returning:
  - Active subscription count + monthly spend (from cost tables)
  - Unread alerts count
  - Recent ranking changes (models that moved ≥2 positions)
  - Top recommendations
  - News feed preview (top 5 by relevance)
  - Tool count, model count stats

### Frontend: Enhance `DashboardPage.jsx`
Current dashboard has recommendations + news feed + basic stats. Enhance with:
1. **Stat cards:** Real data (monthly spend from subscriptions, tools tracked, models tracked)
2. **Ranking movers:** Section showing models that moved up/down significantly
3. **Quick actions:** Links to Compare, Advisor Chat, Cost Optimizer
4. **Subscription summary:** List of active subscriptions with renewal dates
5. Keep existing recommendations + news sections

### Files changed:
- `packages/worker/src/routes/dashboard.js` — NEW route file
- `packages/worker/src/index.js` — register dashboard routes
- `packages/web/src/pages/DashboardPage.jsx` — enhance
- `packages/web/src/lib/api.js` — add getDashboardSummary
- `packages/web/src/lib/hooks.js` — add useDashboardSummary

---

## Priority 5: "Last Updated" Timestamps

**Goal:** Every ranking, score, and review should show recency.

### Backend:
- Rankings endpoint already returns `updated_at` from `model_composite_scores`
- Add `last_scored_at` to composite scores response if not present
- Community reviews already have `last_updated_at`
- Ensure all ranking/score endpoints return timestamp fields

### Frontend:
- Add `timeAgo()` badges throughout:
  - HomePage leaderboards: "Updated 2h ago" under subtitle
  - BenchmarksPage: per-benchmark "last updated"
  - ComparePage: model cards show "scores as of..."
  - PlansPage: "pricing verified" timestamp
  - ModelDetailPage: "Last scored" timestamp in header

### Files changed:
- `packages/web/src/pages/HomePage.jsx` — add timestamp display
- `packages/web/src/pages/ComparePage.jsx` — add timestamp
- `packages/web/src/pages/PlansPage.jsx` — add timestamp
- `packages/web/src/pages/ModelDetailPage.jsx` — already planned with timestamps
- `packages/worker/src/routes/advisor.js` — ensure updated_at in responses
- Possibly `packages/web/src/pages/ModelsPage.jsx` (BenchmarksPage)

---

## Priority 6: Mobile Responsiveness Audit

**Goal:** Charts, Plans table, benchmark tables untested on mobile.

### Approach:
- Systematically check each page at mobile (375px) and tablet (768px) breakpoints
- Fix overflow, truncation, chart sizing, table scrolling, touch targets
- Key problem areas:
  - Recharts charts may overflow on mobile
  - Plans page cards may not stack properly
  - Benchmark tables need horizontal scroll
  - Compare page radar chart needs mobile sizing
  - Touch targets must be ≥44px (already in CSS but verify)

### Implementation:
- Fix issues in-place per page — no new files
- Use existing Tailwind responsive prefixes (sm:, md:, lg:)
- Wrap tables in `overflow-x-auto` containers
- Make charts responsive with percentage widths

### Files changed:
- Various page files as needed based on audit findings

---

## Execution Order

1. **Priority 1** (Model Detail Pages) — biggest feature, commit+push
2. **Priority 2** (Ranking Audit) — quick verification, commit+push
3. **Priority 5** (Timestamps) — small changes across many pages, commit+push
4. **Priority 4** (Dashboard) — medium feature, commit+push
5. **Priority 3** (Expand Tools) — data population script, commit+push
6. **Priority 6** (Mobile Audit) — responsive fixes, commit+push

Reordered to group code-heavy work first, data work in middle, audit last. Each priority gets its own commit.

## Version Bump
v0.7.0 → v0.8.0 (feature release with model detail pages + dashboard enhancement)

## Deploy
After all 6, deploy worker + pages to Cloudflare.
