# Vendor / Company Intelligence Feature

## Context

Today I answered a research question for you: *"Which Chinese AI company (Moonshot / MiniMax / Zhipu / Alibaba-Qwen) has the biggest AI dept, most funding, best reputation, fastest growth, etc."* The answer required pulling HQ, headcount, funding rounds, valuations, R&D commitments, leadership changes, and user-sentiment signals from tier-1 business sources (Bloomberg, Reuters, Caproasia, Crunchbase, Wikipedia).

The site today cannot answer that question. `vendor` is just a `TEXT` column on `models` / `tools` / `plans` — no dedicated table, no facts, no sources, no trust tiers. The `/advisor` chat (Llama 3.3 70B via Workers AI, [advisor.js:700-780](packages/worker/src/routes/advisor.js)) injects `taskList` + `modelList` + `availList` but no company context, so it refuses or hallucinates on company questions.

**Goal:** Make the same research answer reproducible by any visitor — both by navigating to a vendor page and by asking the AI Advisor. Every fact must carry a source + trust chip, same system we just shipped for benchmarks (gold/silver/bronze/unverified).

---

## Approach

Four concrete additions, reusing existing patterns:

### 1. `vendors` D1 table (migration 0038)

File: `packages/worker/src/db/migrations/0038_vendors.sql` (new)

```sql
CREATE TABLE vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,          -- e.g. 'moonshot-ai', 'alibaba-qwen'
  name TEXT NOT NULL,                 -- 'Moonshot AI'
  legal_name TEXT,                    -- '北京月之暗面科技有限公司'
  hq_country TEXT,                    -- 'CN', 'US'
  hq_city TEXT,
  founded_year INTEGER,
  status TEXT,                        -- 'private' | 'public' | 'subsidiary'
  parent_company TEXT,                -- 'Alibaba Group' for Qwen
  ticker TEXT,                        -- 'BABA' where applicable
  employee_count INTEGER,
  ai_headcount INTEGER,               -- dedicated AI dept if disclosed
  total_funding_usd INTEGER,
  latest_valuation_usd INTEGER,
  rnd_commitment_usd INTEGER,         -- Alibaba: $53B / 3yr capex
  investors_json TEXT,                -- JSON array: ["Tencent","Alibaba","HongShan"]
  description TEXT,                   -- 1-2 sentence positioning
  website_url TEXT,
  source_url TEXT,                    -- where the row was sourced
  source_trust TEXT NOT NULL DEFAULT 'unverified'
    CHECK(source_trust IN ('gold','silver','bronze','unverified')),
  last_updated INTEGER,               -- unix seconds
  created_at INTEGER DEFAULT (strftime('%s','now'))
);
CREATE INDEX idx_vendors_country ON vendors(hq_country);
CREATE INDEX idx_vendors_trust ON vendors(source_trust);

-- Link models.vendor TEXT → vendors.slug (soft link, no FK to avoid breakage)
CREATE INDEX idx_models_vendor ON models(vendor);
```

**Seed 4 rows from today's research** in the same migration (Moonshot, MiniMax, Zhipu, Alibaba-Qwen) with `source_trust='gold'` where Bloomberg/Reuters was the source, `silver` for Caproasia/TechCrunch, `bronze` for Wikipedia.

### 2. Vendor routes (`packages/worker/src/routes/vendors.js` — new)

Mirror [packages/worker/src/routes/models.js](packages/worker/src/routes/models.js) structure:

- `GET /api/vendors` — list with filters (`country`, `status`, sort by funding/valuation/employees)
- `GET /api/vendors/:slug` — detail: vendor row + all models where `models.vendor = vendors.slug` + recent `industry_alerts` tagged to this vendor
- `GET /api/vendors/compare?slugs=moonshot-ai,minimax,zhipu-ai` — side-by-side

Register in [packages/worker/src/index.js](packages/worker/src/index.js) next to existing `app.route('/api/models', modelsRouter)`.

### 3. Web pages

**`packages/web/src/pages/VendorsPage.jsx` (new)** — list, mirrors `/advisor` (models) page grid.

**`packages/web/src/pages/VendorDetailPage.jsx` (new)** — mirrors [ModelDetailPage.jsx](packages/web/src/pages/ModelDetailPage.jsx):
- Hero: name, HQ flag, founded year, status chip
- Stats grid: employees, AI headcount, funding, valuation, R&D commitment
- Models shipped (links to each model detail)
- Investors list
- Recent news (pulled from `industry_alerts` where `vendor_slug = :slug`)
- **Every fact row shows a trust chip** using the same `trustStyles` we just shipped on ModelDetailPage (gold/silver/bronze/unverified)

**`packages/web/src/pages/CompareVendorsPage.jsx` (new)** — multi-select up to 4 vendors, side-by-side stat table. Mirror existing [ComparePage.jsx](packages/web/src/pages/ComparePage.jsx).

Routes in [packages/web/src/App.jsx](packages/web/src/App.jsx): `/vendors`, `/vendors/:slug`, `/compare/vendors`.

**Sidebar entry** in [packages/web/src/components/layout/Sidebar.jsx:6-18](packages/web/src/components/layout/Sidebar.jsx): add `{ to: '/vendors', icon: Building2, label: 'Vendors' }` after `'Models'`. Import `Building2` from `lucide-react`.

### 4. AI Advisor grounding (`packages/worker/src/routes/advisor.js`)

At [advisor.js:700-780](packages/worker/src/routes/advisor.js), extend system prompt assembly:

```js
// before: only models / availability / tasks injected
// after: also inject vendors
const vendorList = await db.prepare(
  `SELECT slug, name, hq_country, employee_count, ai_headcount,
          total_funding_usd, latest_valuation_usd, rnd_commitment_usd,
          status, parent_company, source_trust
   FROM vendors ORDER BY total_funding_usd DESC LIMIT 30`
).all();
```

Append a `## Companies / Vendors` section to the system prompt with the vendor rows as JSON, and extend the "Never make up scores, prices, or availability — use ONLY the data above" rule to also cover `company size, funding, valuation, headcount, investors`.

Add company-focused entries to [AdvisorChatPage.jsx](packages/web/src/pages/AdvisorChatPage.jsx) `QUICK_REPLIES`:
- "Which AI company has the most funding?"
- "Compare Moonshot vs MiniMax vs Zhipu"
- "Who are the biggest investors in Chinese AI?"

### 5. Weekly vendor scraper

File: `packages/worker/src/pipelines/vendor-scraper.js` (new), same shape as [benchmark-scraper.js](packages/worker/src/pipelines/benchmark-scraper.js):

- Sources (tier-tagged, reusing `TRUST` constants we exported from benchmark-scraper):
  - Crunchbase public pages → `TRUST.GOLD` (funding, valuation)
  - Bloomberg / Reuters RSS → `TRUST.GOLD` (funding rounds, IPOs)
  - Company "about" pages → `TRUST.SILVER`
  - Wikipedia → `TRUST.BRONZE`
- Cron: weekly Monday 08:00 UTC in [wrangler.toml](packages/worker/wrangler.toml), next to existing benchmark cron.
- Writes to a `vendor_facts` shadow table keyed by `(vendor_slug, fact_type, source_url)` for provenance, then promotes highest-trust value into `vendors` row.

### 6. News feed vendor tagging

Add `vendor_slug TEXT` column to `industry_alerts` (migration 0038, second statement). Tag on ingest by matching vendor names in article title/body. News page gets a vendor filter dropdown — when you visit `/vendors/moonshot-ai`, the "Recent News" section shows only Moonshot alerts.

---

## Files to modify / create

**Worker**
- NEW `packages/worker/src/db/migrations/0038_vendors.sql` — table + seed + `industry_alerts.vendor_slug`
- NEW `packages/worker/src/routes/vendors.js`
- NEW `packages/worker/src/pipelines/vendor-scraper.js`
- NEW `packages/worker/src/services/vendor-scraper.test.js` (3-4 tests: trust assignment, dedup by source_trust precedence, employee-count parsing)
- EDIT `packages/worker/src/index.js` — register vendors route + cron trigger
- EDIT `packages/worker/src/routes/advisor.js` — inject vendorList into system prompt
- EDIT `packages/worker/src/db/schema.sql` — mirror 0038 changes for fresh installs
- EDIT `packages/worker/wrangler.toml` — add vendor-scraper cron

**Web**
- NEW `packages/web/src/pages/VendorsPage.jsx`
- NEW `packages/web/src/pages/VendorDetailPage.jsx`
- NEW `packages/web/src/pages/CompareVendorsPage.jsx`
- EDIT `packages/web/src/App.jsx` — 3 new routes
- EDIT `packages/web/src/components/layout/Sidebar.jsx` — new nav link + version bump
- EDIT `packages/web/src/pages/AdvisorChatPage.jsx` — add company QUICK_REPLIES + FOLLOW_UP_SETS
- EDIT `packages/web/src/pages/NewsPage.jsx` — vendor filter dropdown

**Reuse (do not rewrite)**
- `trustStyles` object from [ModelDetailPage.jsx](packages/web/src/pages/ModelDetailPage.jsx) — extract to `packages/web/src/components/TrustChip.jsx` on first use, then import from both pages
- `TRUST` constants exported from [benchmark-scraper.js](packages/worker/src/pipelines/benchmark-scraper.js)
- `computeTrustWeightedScore` pattern from [composite-score-engine.js](packages/worker/src/services/composite-score-engine.js) if we end up scoring vendors too (deferred — not in v1)

**Versions**
- `package.json` 0.21.0 → 0.22.0
- `packages/worker/package.json` 0.15.0 → 0.16.0
- `packages/web/package.json` 0.15.0 → 0.16.0
- Sidebar footer version label

---

## Verification

1. **DB migration**
   ```
   cd packages/worker
   npx wrangler d1 execute all-things-ai-db --local --file=src/db/migrations/0038_vendors.sql
   npx wrangler d1 execute all-things-ai-db --local \
     --command "SELECT slug, name, total_funding_usd, source_trust FROM vendors"
   ```
   Expect: 4 seed rows (moonshot-ai, minimax, zhipu-ai, alibaba-qwen), `source_trust` populated.

2. **Unit tests**
   ```
   cd packages/worker && node --test src/services/vendor-scraper.test.js
   ```
   Expect: 3-4 pass, plus 24/24 prior tests still pass (no regression on trust-tier work we just shipped).

3. **API smoke**
   ```
   curl -s http://localhost:8787/api/vendors | jq '.[0]'
   curl -s http://localhost:8787/api/vendors/moonshot-ai | jq '.vendor.total_funding_usd, .vendor.source_trust'
   curl -s "http://localhost:8787/api/vendors/compare?slugs=moonshot-ai,minimax" | jq 'length'
   ```

4. **Web preview**
   - `preview_start` on web package
   - Navigate `/vendors` — list renders with 4 cards
   - Navigate `/vendors/moonshot-ai` — detail page shows funding, employees, trust chips next to each fact
   - Navigate `/compare/vendors?slugs=moonshot-ai,minimax,zhipu-ai,alibaba-qwen` — 4-column table
   - Sidebar shows "Vendors" entry with Building2 icon
   - `preview_snapshot` to confirm structure, `preview_screenshot` for ship proof

5. **Advisor grounding** — in `/advisor/chat`, ask:
   > "Which Chinese AI company has the most funding and the largest AI dept?"
   
   Expect: Cites Alibaba ($53B capex) for investment and Zhipu (~2,000 employees) for AI headcount, with no hallucinated figures. Any fact outside the DB → Advisor declines, consistent with existing "ONLY the data above" rule.

6. **Deploy** (canonical dir only — bash-guard blocks from worktrees):
   ```
   cd ~/ProjectsHQ/all-things-ai
   git fetch origin claude/sleepy-lederberg-97165e && git merge --ff-only FETCH_HEAD
   npx wrangler d1 execute all-things-ai-db --remote --file=packages/worker/src/db/migrations/0038_vendors.sql
   cd packages/worker && npm run deploy
   cd ../web && npm run deploy
   ```
   Verify prod `/api/vendors/moonshot-ai` returns populated row; verify all-things-ai.pages.dev/vendors/moonshot-ai renders.

---

## Red-team

- **Stale data risk**: funding/valuation changes weekly. Mitigation: weekly cron + `last_updated` timestamp displayed on every vendor fact; stale facts (>90d) get a dim chip.
- **Hallucination risk**: Llama 3.3 70B will invent numbers if asked about vendors not in the DB. Mitigation: system prompt hard rule already in place for models; extend it verbatim to cover company questions.
- **Scope creep**: vendor scoring/ranking is tempting but deferred — v1 presents facts, doesn't rank. The user's question was answerable from raw facts; ranking adds editorial risk.
