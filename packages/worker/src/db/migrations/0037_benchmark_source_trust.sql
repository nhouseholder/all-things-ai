-- 0037: Add source_trust to benchmarks (2026-04-16)
-- Tiers: gold (independent aggregators), silver (official leaderboards),
--        bronze (narrower/commercial), unverified (NULL or vendor-self-report)
-- Composite-score-engine weights benchmarks by tier.

ALTER TABLE benchmarks ADD COLUMN source_trust TEXT NOT NULL DEFAULT 'unverified'
  CHECK(source_trust IN ('gold','silver','bronze','unverified'));

CREATE INDEX IF NOT EXISTS idx_benchmarks_trust ON benchmarks(source_trust);

-- Backfill by source_url pattern
UPDATE benchmarks SET source_trust = 'gold'
  WHERE source_url LIKE 'https://lmarena.ai%'
     OR source_url LIKE 'https://artificialanalysis.ai%';

UPDATE benchmarks SET source_trust = 'silver'
  WHERE source_url LIKE 'https://www.swebench.com%'
     OR source_url LIKE 'https://livebench.ai%'
     OR source_url LIKE 'https://lastexam.ai%'
     OR source_url LIKE 'https://evalplus.github.io%'
     OR source_url LIKE 'https://paperswithcode.com%'
     OR source_url LIKE 'https://github.com/sierra-research/%'
     OR source_url LIKE 'https://arxiv.org%';

UPDATE benchmarks SET source_trust = 'bronze'
  WHERE source_url LIKE 'https://aider.chat%'
     OR source_url LIKE 'https://openrouter.ai%';
