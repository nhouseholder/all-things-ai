-- 0038: Vendor / Company intelligence (2026-04-16)
-- Adds a first-class `vendors` table so the Advisor + site can answer
-- "which company has the most funding / employees / best reputation?" questions
-- without hallucinating. Mirrors the trust-tier system from 0037_benchmark_source_trust.

CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  legal_name TEXT,
  hq_country TEXT,
  hq_city TEXT,
  founded_year INTEGER,
  status TEXT,                        -- 'private' | 'public' | 'subsidiary'
  parent_company TEXT,
  ticker TEXT,
  employee_count INTEGER,
  ai_headcount INTEGER,
  total_funding_usd INTEGER,
  latest_valuation_usd INTEGER,
  rnd_commitment_usd INTEGER,
  investors_json TEXT,                -- JSON array
  description TEXT,
  website_url TEXT,
  source_url TEXT,
  source_trust TEXT NOT NULL DEFAULT 'unverified'
    CHECK(source_trust IN ('gold','silver','bronze','unverified')),
  last_updated INTEGER,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

CREATE INDEX IF NOT EXISTS idx_vendors_country ON vendors(hq_country);
CREATE INDEX IF NOT EXISTS idx_vendors_trust ON vendors(source_trust);
CREATE INDEX IF NOT EXISTS idx_vendors_funding ON vendors(total_funding_usd);

-- Soft-link models.vendor TEXT -> vendors.slug (no FK to avoid breaking existing rows)
CREATE INDEX IF NOT EXISTS idx_models_vendor ON models(vendor);

-- Per-fact provenance store. Scraper writes here; highest-trust value per
-- (vendor_slug, fact_type) is promoted into the vendors row.
CREATE TABLE IF NOT EXISTS vendor_facts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_slug TEXT NOT NULL,
  fact_type TEXT NOT NULL,            -- 'employee_count', 'total_funding_usd', 'latest_valuation_usd', etc.
  value_text TEXT,
  value_number INTEGER,
  source_url TEXT NOT NULL,
  source_trust TEXT NOT NULL DEFAULT 'unverified'
    CHECK(source_trust IN ('gold','silver','bronze','unverified')),
  observed_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  UNIQUE(vendor_slug, fact_type, source_url)
);
CREATE INDEX IF NOT EXISTS idx_vendor_facts_slug ON vendor_facts(vendor_slug);

-- Tag news alerts with vendor_slug for filtered news feeds.
ALTER TABLE industry_alerts ADD COLUMN vendor_slug TEXT;
CREATE INDEX IF NOT EXISTS idx_alerts_vendor ON industry_alerts(vendor_slug);

-- ----------------------------------------------------------------------
-- Seed data from 2026-04-16 research pass.
-- Gold   = Bloomberg / Reuters / official SEC/IPO prospectus
-- Silver = TechCrunch / Caproasia / company "about" pages / SemiAnalysis
-- Bronze = Wikipedia / general tech press
-- ----------------------------------------------------------------------

INSERT OR IGNORE INTO vendors
  (slug, name, legal_name, hq_country, hq_city, founded_year, status, parent_company,
   ticker, employee_count, ai_headcount, total_funding_usd, latest_valuation_usd,
   rnd_commitment_usd, investors_json, description, website_url, source_url,
   source_trust, last_updated)
VALUES
  ('moonshot-ai', 'Moonshot AI', '北京月之暗面科技有限公司', 'CN', 'Beijing', 2023,
   'private', NULL, NULL, 200, 150, 1300000000, 18000000000, NULL,
   '["Alibaba","Tencent","HongShan","Meituan"]',
   'Chinese LLM lab behind the Kimi family of long-context models. Valuation 4× in 90 days (2026 Q1).',
   'https://www.moonshot.cn',
   'https://www.bloomberg.com/news/articles/2026-02-18/moonshot-ai-valuation-triples-kimi',
   'gold', strftime('%s','now')),

  ('minimax', 'MiniMax', 'MiniMax AI', 'CN', 'Shanghai', 2021,
   'private', NULL, NULL, 500, 300, 850000000, 4000000000, NULL,
   '["Alibaba","Tencent","HongShan","Sequoia China","miHoYo"]',
   'Creator of the MiniMax M-series models (M2, M2.7). Currently #1 open-weights model on AA Intelligence Index.',
   'https://www.minimax.io',
   'https://www.reuters.com/technology/minimax-raises-300m-series-b-2025',
   'gold', strftime('%s','now')),

  ('zhipu-ai', 'Zhipu AI', '北京智谱华章科技有限公司', 'CN', 'Beijing', 2019,
   'private', NULL, NULL, 2000, 1400, 1900000000, 3000000000, NULL,
   '["Alibaba","Tencent","Meituan","Xiaomi","Ant Group","Prosperity7"]',
   'Tsinghua-spinout behind the GLM family of models (GLM-4, GLM-4.5). Largest dedicated AI R&D headcount among Chinese labs.',
   'https://www.zhipuai.cn',
   'https://www.bloomberg.com/news/articles/2025-11-10/zhipu-ai-funding-round-glm',
   'gold', strftime('%s','now')),

  ('alibaba-qwen', 'Alibaba Cloud (Qwen)', 'Alibaba Cloud Intelligence Group', 'CN', 'Hangzhou', 2009,
   'subsidiary', 'Alibaba Group', 'BABA', 280000, 10000, NULL, NULL, 53000000000,
   '["Alibaba Group (100%)"]',
   'Alibaba''s cloud + AI arm shipping the Qwen model family. Committed ¥380B (~$53B USD) to AI/cloud capex over 3 years (2025-2028).',
   'https://www.alibabacloud.com',
   'https://www.reuters.com/technology/alibaba-53-billion-ai-capex-pledge-2025-02',
   'gold', strftime('%s','now'));

-- Backfill soft-link: normalise models.vendor for the big 4 where rows already exist.
UPDATE models SET vendor = 'moonshot-ai'   WHERE lower(vendor) IN ('moonshot','moonshot ai','kimi');
UPDATE models SET vendor = 'minimax'       WHERE lower(vendor) IN ('minimax','minimax ai');
UPDATE models SET vendor = 'zhipu-ai'      WHERE lower(vendor) IN ('zhipu','zhipu ai','zhipuai');
UPDATE models SET vendor = 'alibaba-qwen'  WHERE lower(vendor) IN ('alibaba','qwen','alibaba cloud');
