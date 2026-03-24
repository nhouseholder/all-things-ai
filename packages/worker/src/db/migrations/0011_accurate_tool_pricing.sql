-- ============================================================
-- 0011_accurate_tool_pricing.sql — Fix inaccurate tool pricing and model availability
-- Generated: 2026-03-23
-- Changes:
--   1. Remove Claude Opus 4.5 from Claude Code (API-only legacy model, not in subscription app)
--   2. Add Claude Code Max 20x model availability (was missing)
--   3. Fix Cursor Pro+ price ($60 → $40)
--   4. Add Windsurf Free tier
--   5. Add more accurate multi-model availability for Cursor, Windsurf, GitHub Copilot
--   6. Add Codex Plus model availability (was missing)
--   7. Add Amazon Q Developer pricing plans and availability
--   8. Add Antigravity pricing plans
--   9. Add BYOK availability for Roo Code and Aider across major API models
-- ============================================================

-- ============================================================
-- 1. CLAUDE CODE — Remove Opus 4.5 (API-only, not in subscription app)
-- ============================================================
DELETE FROM model_availability
WHERE model_id = (SELECT id FROM models WHERE slug='claude-opus-4.5')
  AND tool_id = (SELECT id FROM tools WHERE slug='claude-code');

-- Add Claude Code Max 20x model availability (was missing from seed)
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM tools WHERE slug='claude-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Max 20x'), 'full'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='claude-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Max 20x'), 'full'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='claude-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Max 20x'), 'full');

-- ============================================================
-- 2. CURSOR — Fix Pro+ price ($60 → $40) and expand model availability
-- ============================================================
UPDATE pricing_plans
SET price_monthly = 40
WHERE tool_id = (SELECT id FROM tools WHERE slug='cursor')
  AND plan_name = 'Pro+';

-- Cursor Pro — expand model list (fast/mid-tier models)
-- Remove existing, re-insert cleanly
DELETE FROM model_availability
WHERE tool_id = (SELECT id FROM tools WHERE slug='cursor')
  AND plan_id = (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro');

INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro'), 'credits');

-- Cursor Pro+ — premium models
DELETE FROM model_availability
WHERE tool_id = (SELECT id FROM tools WHERE slug='cursor')
  AND plan_id = (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+');

INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'), 'credits'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'), 'credits'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'), 'credits'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'), 'credits'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'), 'credits'),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'), 'credits'),
((SELECT id FROM models WHERE slug='grok-4'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'), 'credits');

-- Cursor Ultra — all Pro+ models with max limits
DELETE FROM model_availability
WHERE tool_id = (SELECT id FROM tools WHERE slug='cursor')
  AND plan_id = (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Ultra');

INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Ultra'), 'credits'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Ultra'), 'credits'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Ultra'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Ultra'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Ultra'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Ultra'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Ultra'), 'credits'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Ultra'), 'credits'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Ultra'), 'credits'),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Ultra'), 'credits'),
((SELECT id FROM models WHERE slug='grok-4'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Ultra'), 'credits');

-- ============================================================
-- 3. WINDSURF — Add Free tier, expand model availability
-- ============================================================

-- Add Windsurf Free plan
INSERT OR IGNORE INTO pricing_plans (tool_id, plan_name, price_monthly, features, models_included) VALUES
((SELECT id FROM tools WHERE slug='windsurf'), 'Free', 0, '{"requests":"limited","features":["cascade agent","2000 completions/month","limited chat messages"]}', '["claude-haiku-4.5","gpt-5.4-mini","gemini-3-flash"]');

-- Free tier availability
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Free'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Free'), 'credits'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Free'), 'credits');

-- Windsurf Pro — expand model availability
DELETE FROM model_availability
WHERE tool_id = (SELECT id FROM tools WHERE slug='windsurf')
  AND plan_id = (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro');

INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'), 'credits');

-- Windsurf Teams — same models as Pro (org management add-on)
DELETE FROM model_availability
WHERE tool_id = (SELECT id FROM tools WHERE slug='windsurf')
  AND plan_id = (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Teams');

INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Teams'), 'credits'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Teams'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Teams'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Teams'), 'credits'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Teams'), 'credits'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Teams'), 'credits'),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Teams'), 'credits');

-- ============================================================
-- 4. GITHUB COPILOT — Fix Free tier, expand availability, remove Opus 4.5
-- ============================================================

-- Remove Claude Opus 4.5 from GitHub Copilot Pro+ (API-only legacy model)
DELETE FROM model_availability
WHERE model_id = (SELECT id FROM models WHERE slug='claude-opus-4.5')
  AND tool_id = (SELECT id FROM tools WHERE slug='github-copilot');

-- GitHub Copilot Free — limited models
DELETE FROM model_availability
WHERE tool_id = (SELECT id FROM tools WHERE slug='github-copilot')
  AND plan_id = (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Free');

INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Free'), 'full'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Free'), 'credits');

-- GitHub Copilot Pro — mid-tier models, 300 premium req/mo
DELETE FROM model_availability
WHERE tool_id = (SELECT id FROM tools WHERE slug='github-copilot')
  AND plan_id = (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro');

INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro'), 'full'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro'), 'full'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro'), 'full'),
((SELECT id FROM models WHERE slug='gemini-2.5-pro'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro'), 'full');

-- GitHub Copilot Pro+ — premium models, 1500 premium req/mo
DELETE FROM model_availability
WHERE tool_id = (SELECT id FROM tools WHERE slug='github-copilot')
  AND plan_id = (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+');

INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'), 'full'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'), 'full'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'), 'full'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'), 'full'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'), 'full'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'), 'full'),
((SELECT id FROM models WHERE slug='grok-4'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'), 'full');

-- GitHub Copilot Business — org features, same models as Pro
DELETE FROM model_availability
WHERE tool_id = (SELECT id FROM tools WHERE slug='github-copilot')
  AND plan_id = (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Business');

INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Business'), 'full'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Business'), 'full'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Business'), 'full'),
((SELECT id FROM models WHERE slug='gemini-2.5-pro'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Business'), 'full');

-- GitHub Copilot Enterprise — premium business + fine-tuning
DELETE FROM model_availability
WHERE tool_id = (SELECT id FROM tools WHERE slug='github-copilot')
  AND plan_id = (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Enterprise');

INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Enterprise'), 'full'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Enterprise'), 'full'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Enterprise'), 'full'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Enterprise'), 'full');

-- ============================================================
-- 5. CODEX — Add Plus plan model availability (was missing)
-- ============================================================
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='codex'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='codex') AND plan_name='Plus'), 'full'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM tools WHERE slug='codex'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='codex') AND plan_name='Plus'), 'full'),
((SELECT id FROM models WHERE slug='codex-mini'), (SELECT id FROM tools WHERE slug='codex'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='codex') AND plan_name='Plus'), 'full');

-- Codex Pro — full model list
DELETE FROM model_availability
WHERE tool_id = (SELECT id FROM tools WHERE slug='codex')
  AND plan_id = (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='codex') AND plan_name='Pro');

INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='codex'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='codex') AND plan_name='Pro'), 'full'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM tools WHERE slug='codex'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='codex') AND plan_name='Pro'), 'full'),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM tools WHERE slug='codex'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='codex') AND plan_name='Pro'), 'full'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM tools WHERE slug='codex'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='codex') AND plan_name='Pro'), 'full'),
((SELECT id FROM models WHERE slug='codex-mini'), (SELECT id FROM tools WHERE slug='codex'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='codex') AND plan_name='Pro'), 'full');

-- ============================================================
-- 6. AUGMENT CODE — Add model availability (was empty)
-- ============================================================

-- Community (free) — basic models
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='augment-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='augment-code') AND plan_name='Community'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM tools WHERE slug='augment-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='augment-code') AND plan_name='Community'), 'credits');

-- Indie ($20/mo) — mid-tier models
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='augment-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='augment-code') AND plan_name='Indie'), 'credits'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='augment-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='augment-code') AND plan_name='Indie'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='augment-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='augment-code') AND plan_name='Indie'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM tools WHERE slug='augment-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='augment-code') AND plan_name='Indie'), 'credits'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM tools WHERE slug='augment-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='augment-code') AND plan_name='Indie'), 'credits');

-- Developer ($50/mo) — premium models, deep codebase context
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM tools WHERE slug='augment-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='augment-code') AND plan_name='Developer'), 'credits'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='augment-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='augment-code') AND plan_name='Developer'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='augment-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='augment-code') AND plan_name='Developer'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM tools WHERE slug='augment-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='augment-code') AND plan_name='Developer'), 'credits'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM tools WHERE slug='augment-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='augment-code') AND plan_name='Developer'), 'credits'),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM tools WHERE slug='augment-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='augment-code') AND plan_name='Developer'), 'credits');

-- ============================================================
-- 7. AMAZON Q DEVELOPER — Add pricing plans and availability
-- ============================================================
INSERT OR IGNORE INTO pricing_plans (tool_id, plan_name, price_monthly, features, models_included) VALUES
((SELECT id FROM tools WHERE slug='amazon-q'), 'Free', 0, '{"requests":"50 chat interactions/month","features":["code completions","inline suggestions","CLI support","basic security scanning"]}', '["amazon-nova-pro"]'),
((SELECT id FROM tools WHERE slug='amazon-q'), 'Pro', 19, '{"per_user":true,"requests":"unlimited","features":["everything in Free","unlimited chat","advanced security scanning","AWS console integration","JIRA integration","custom knowledge bases"]}', '["amazon-nova-premier","amazon-nova-pro"]');

-- Amazon Q Free — uses Amazon Nova Pro (AWS proprietary)
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='amazon-nova-pro'), (SELECT id FROM tools WHERE slug='amazon-q'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='amazon-q') AND plan_name='Free'), 'full');

-- Amazon Q Pro — Nova Premier + Pro
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='amazon-nova-premier'), (SELECT id FROM tools WHERE slug='amazon-q'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='amazon-q') AND plan_name='Pro'), 'full'),
((SELECT id FROM models WHERE slug='amazon-nova-pro'), (SELECT id FROM tools WHERE slug='amazon-q'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='amazon-q') AND plan_name='Pro'), 'full');

-- ============================================================
-- 8. ANTIGRAVITY — Add pricing plans and availability
-- ============================================================
INSERT OR IGNORE INTO pricing_plans (tool_id, plan_name, price_monthly, features, models_included) VALUES
((SELECT id FROM tools WHERE slug='antigravity'), 'Free (BYOK)', 0, '{"features":["multi-model routing","VS Code extension","bring your own API keys","unlimited usage"]}', '["any-via-api"]'),
((SELECT id FROM tools WHERE slug='antigravity'), 'Credits', 20, '{"features":["pre-loaded model credits","no API keys needed","access to top models","usage dashboard"]}', '["claude-sonnet-4.6","gpt-5.4","gemini-3-pro","deepseek-v3.2"]');

-- Antigravity BYOK — all major API-accessible models
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='deepseek-r1'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='grok-4'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='llama-4-maverick'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='mistral-large-3'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='qwen-3.5'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Free (BYOK)'), 'byok');

-- Antigravity Credits plan — curated top models with pre-loaded credits
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Credits'), 'credits'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Credits'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Credits'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Credits'), 'credits'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Credits'), 'credits'),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM tools WHERE slug='antigravity'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='antigravity') AND plan_name='Credits'), 'credits');

-- ============================================================
-- 9. ROO CODE — Add BYOK availability for all major API models
-- ============================================================
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
-- Anthropic
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM tools WHERE slug='roo-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='roo-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='roo-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'), 'byok'),
-- OpenAI
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='roo-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM tools WHERE slug='roo-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='gpt-o3'), (SELECT id FROM tools WHERE slug='roo-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'), 'byok'),
-- Google
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM tools WHERE slug='roo-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM tools WHERE slug='roo-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM tools WHERE slug='roo-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'), 'byok'),
-- DeepSeek
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM tools WHERE slug='roo-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='deepseek-r1'), (SELECT id FROM tools WHERE slug='roo-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'), 'byok'),
-- Meta
((SELECT id FROM models WHERE slug='llama-4-maverick'), (SELECT id FROM tools WHERE slug='roo-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='llama-4-scout'), (SELECT id FROM tools WHERE slug='roo-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'), 'byok'),
-- Mistral
((SELECT id FROM models WHERE slug='mistral-large-3'), (SELECT id FROM tools WHERE slug='roo-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'), 'byok'),
-- Qwen
((SELECT id FROM models WHERE slug='qwen-3.5'), (SELECT id FROM tools WHERE slug='roo-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'), 'byok'),
-- xAI
((SELECT id FROM models WHERE slug='grok-4'), (SELECT id FROM tools WHERE slug='roo-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'), 'byok'),
-- Z AI (free API)
((SELECT id FROM models WHERE slug='z-ai-glm-5'), (SELECT id FROM tools WHERE slug='roo-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'), 'byok');

-- ============================================================
-- 10. AIDER — Add BYOK availability for all major API models
-- ============================================================
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
-- Anthropic
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM tools WHERE slug='aider'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='aider') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='aider'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='aider') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='aider'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='aider') AND plan_name='Free (BYOK)'), 'byok'),
-- OpenAI
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='aider'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='aider') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM tools WHERE slug='aider'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='aider') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='gpt-o3'), (SELECT id FROM tools WHERE slug='aider'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='aider') AND plan_name='Free (BYOK)'), 'byok'),
-- Google
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM tools WHERE slug='aider'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='aider') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM tools WHERE slug='aider'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='aider') AND plan_name='Free (BYOK)'), 'byok'),
-- DeepSeek (very popular with Aider users due to low cost)
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM tools WHERE slug='aider'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='aider') AND plan_name='Free (BYOK)'), 'byok'),
((SELECT id FROM models WHERE slug='deepseek-r1'), (SELECT id FROM tools WHERE slug='aider'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='aider') AND plan_name='Free (BYOK)'), 'byok'),
-- Meta
((SELECT id FROM models WHERE slug='llama-4-maverick'), (SELECT id FROM tools WHERE slug='aider'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='aider') AND plan_name='Free (BYOK)'), 'byok'),
-- Mistral
((SELECT id FROM models WHERE slug='mistral-large-3'), (SELECT id FROM tools WHERE slug='aider'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='aider') AND plan_name='Free (BYOK)'), 'byok'),
-- Qwen
((SELECT id FROM models WHERE slug='qwen-3.5'), (SELECT id FROM tools WHERE slug='aider'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='aider') AND plan_name='Free (BYOK)'), 'byok'),
-- Z AI (free API)
((SELECT id FROM models WHERE slug='z-ai-glm-5'), (SELECT id FROM tools WHERE slug='aider'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='aider') AND plan_name='Free (BYOK)'), 'byok');
