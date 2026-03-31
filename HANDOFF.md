# Handoff — All Things AI — 2026-03-31
## Release: v0.9.0
## Repo: nhouseholder/all-things-ai
## Branch: codex/openrouter-vibe-release

## Summary
This release pushed the site further toward its core job: helping vibe coders choose the best model and the safest plan for how they actually work. The main shipped work was OpenRouter-backed model enrichment, a new vibe-coder ranking, better advisor plan ordering, model detail enrichment, and several production fixes that were deployed live.

## What Changed
- Restored GPT and Gemini families that had fallen out of production visibility.
- Fixed production API routing/CORS so model tables and charts load correctly on Pages.
- Fixed advisor behavior so premium models stop recommending free BYOK plans by default.
- Improved plugin/tool ranking cards with human-readable descriptions.
- Rebuilt plan model tables from authoritative `model_availability` data instead of stale summary fields.
- Added explicit Copilot per-model usage rates and notes.
- Fixed plan-card text overlap and wrapping issues.
- Added OpenRouter-backed model enrichment:
  - New `model_openrouter_stats` table and migration `0027_openrouter_model_signals.sql`
  - Daily sync pipeline in `packages/worker/src/pipelines/openrouter-sync.js`
  - Remote sync helper in `packages/worker/scripts/sync-openrouter-remote.mjs`
  - Mapping + parsing helpers in `packages/worker/src/services/openrouter-utils.js`
  - Separate vibe-coder fit scoring in `packages/worker/src/services/vibe-fit-engine.js`
- Added a live `Best for Vibe Coders` ranking to the advisor.
- Enriched model detail pages with OpenRouter activity/capability data plus a plain-English vibe-coder fit summary.
- Fixed the model detail API regression caused by `last_updated_at` pointing at the wrong review column.
- Bumped app/API/site release version to `v0.9.0`.

## Data Synced
- Applied migration `0027_openrouter_model_signals.sql` to remote D1.
- Ran remote OpenRouter sync successfully.
- `47` active local models are now enriched in `model_openrouter_stats`.
- Example verified live:
  - `Claude Sonnet 4.6` has OpenRouter ID `anthropic/claude-sonnet-4.6`
  - context `1,000,000`
  - daily activity `33.5B` tokens

## What I Tested
### Build / packaging
- `npm run build -w packages/web`
- `npx wrangler deploy --dry-run` in `packages/worker`
- ESM import checks for:
  - `packages/worker/src/routes/advisor.js`
  - `packages/worker/src/routes/models.js`
  - `packages/worker/src/pipelines/openrouter-sync.js`
  - `packages/worker/src/services/openrouter-utils.js`
  - `packages/worker/src/services/vibe-fit-engine.js`
  - `packages/worker/scripts/sync-openrouter-remote.mjs`

### Database / data sync
- Applied remote migration:
  - `packages/worker/src/db/migrations/0027_openrouter_model_signals.sql`
- Ran:
  - `npm run sync:openrouter:remote -w packages/worker`
- Verified remote D1 row count:
  - `SELECT COUNT(*) FROM model_openrouter_stats` => `47`

### Live API verification
- `GET /api/advisor/rankings`
  - Response includes keys:
    - `best_overall`
    - `bang_for_buck`
    - `best_for_vibe_coders`
  - Verified top vibe-coder pick live:
    - `GPT-5.4 (XHigh Thinking)`
    - vibe fit `86.8`
- `GET /api/models/claude-sonnet-4.6`
  - Verified:
    - `vibe_coder_profile`
    - nested `openrouter` object
    - correct activity/context/tool-support data

### Live deploy verification
- Worker deployed successfully to:
  - `https://all-things-ai-worker.nikhouseholdr.workers.dev`
- Pages deployed successfully to:
  - `https://a24e7a0c.all-things-ai.pages.dev`
- Alias URL:
  - `https://head.all-things-ai.pages.dev`

## Current Product State
The site now has three ranking modes that are actually useful:
- best overall quality
- best bang for buck
- best for vibe coders

The vibe-coder path is now supported by:
- task success and steering/autonomy estimates
- community signal
- OpenRouter usage/activity
- capability cues like tools, structured outputs, files, reasoning, and context

## Known Gaps / What Still Needs Improvement
### Highest priority
1. Add monthly usage presets and overage simulation.
   Right now the site is better at ranking models than explaining how fast a plan burns down under real coding volume.
2. Make plan guidance more first-class on the homepage.
   The app still makes users navigate a bit too much between model quality and plan practicality.
3. Expand OpenRouter matching beyond the current `47` models.
   Some local models are still unmapped either because they are local variants or not represented cleanly in OpenRouter.

### Product / UX
1. Make the vibe-coder ranking more visible on the homepage instead of only in the advisor rankings section.
2. Add preset personas like:
   - weekend hacker
   - solo founder
   - freelancer
   - full-time product engineer
3. Add “good enough vs frontier” toggles to help users trade off quality against spend and steering.
4. Add clearer “why this plan” explanations on advisor cards, especially around credits, premium requests, and overage behavior.

### Reliability / engineering
1. Add automated tests.
   There are still effectively no meaningful test suites covering worker routes or UI rendering.
2. Add regression checks for:
   - advisor ranking response shape
   - model detail route
   - plan availability sorting
   - version string consistency across UI and API
3. Consider storing a sync audit table for OpenRouter runs:
   - match counts
   - unmatched slugs
   - activity fetch failures
4. Consider invalidating or versioning more caches when model data shifts.

## Files Most Relevant To This Release
- `packages/worker/src/pipelines/openrouter-sync.js`
- `packages/worker/src/services/openrouter-utils.js`
- `packages/worker/src/services/vibe-fit-engine.js`
- `packages/worker/src/routes/advisor.js`
- `packages/worker/src/routes/models.js`
- `packages/web/src/pages/AdvisorPage.jsx`
- `packages/web/src/pages/ModelDetailPage.jsx`
- `packages/worker/src/db/migrations/0027_openrouter_model_signals.sql`

## Notes For The Next Agent
- The repo was on a detached HEAD when this handoff started; work was moved onto `codex/openrouter-vibe-release`.
- `sync-openrouter-remote.mjs` intentionally does not auto-run on import anymore.
- If model detail starts 500ing again, check schema/query mismatches first; that was the live regression caught and fixed during verification.
- Version strings were inconsistent before this pass. Current intended release is `v0.9.0`.

## Suggested Next Task
Implement plan-burn modeling:
- estimate monthly request consumption by persona
- combine included requests, premium request multipliers, overage model, and BYOK risk
- make the advisor recommend the best plan for a user’s actual monthly coding behavior, not just the best model
