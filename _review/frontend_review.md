# Frontend Review — All Things AI (v0.7.0)

**Reviewer**: Senior Frontend Engineer
**Date**: 2026-03-27
**Scope**: Full review of `packages/web/src/` (27 files, ~4,500 LOC)
**Stack**: React 19 + Vite 6 + TanStack Query 5 + Recharts 2 + Tailwind 4 + React Router 7

---

## 1. Component Architecture

### 1.1 Page Size — Several Pages Are Too Large

**[P2]** Multiple pages contain 300-700 lines with inline sub-components that should be extracted:

- `HomePage.jsx` (~557 lines) — Contains 8 sub-components (`StatCard`, `ValueCard`, `StepCard`, `MiniLeaderboard`, `CommunityBadge`, `ScoreBreakdownRow`, plus chart logic). The `MiniLeaderboard` alone is ~80 lines and could be its own file.
- `ComparePage.jsx` (~500+ lines) — Contains `ModelPicker`, `RadarComparisonChart`, `ScoreBreakdown`, `ComparisonTable`, `TaskPerformanceTab`, `AvailabilityMatrix` all inline.
- `BenchmarksPage.jsx` (~725 lines) — Contains `TopModelTiles`, `TokenPricingTab`, `ModelToolsModal`, `ScoreCell`, plus multiple tooltip components.
- `AdvisorPage.jsx` (~500+ lines) — Contains `ComponentBreakdown`, `ScoreBar`, `CompositeTooltip`, `ComplexityDots`, and the full ranking table logic.
- `ToolsPage.jsx` (~365 lines) — `ToolCard` is ~220 lines inline.
- `CodingToolsPage.jsx` (~360 lines) — Another `ToolCard` variant inline.

**Recommendation**: Extract sub-components to a `components/` subfolder organized by feature (e.g., `components/advisor/`, `components/compare/`). This would cut individual file sizes to 100-150 lines, making them scannable and testable.

### 1.2 Duplicated Helper Functions

**[P2]** The following patterns are duplicated across 3-4 files:

- **Score color functions** (`compositeColor`, `scoreColor`, `compositeBarColor`, `scoreBarBg`, `compositeTextColor`) — Variants exist in `HomePage.jsx`, `ComparePage.jsx`, `AdvisorPage.jsx`, and `BenchmarksPage.jsx`. Each has slightly different thresholds but serves the same purpose.
- **Price formatting** (`formatPrice`) — Different implementations in `ComparePage.jsx`, `BenchmarksPage.jsx`, and `ToolsPage.jsx`.
- **Relative time** (`relativeTime`, `timeAgo`) — Different implementations in `DashboardPage.jsx` and `AlertsPage.jsx`.
- **Score bar components** — `ScoreBar` exists in both `RankingChart.jsx` and `AdvisorPage.jsx` with minor differences.

**Recommendation**: Create `lib/format.js` for shared formatters and `components/ScoreBar.jsx` for the shared visual component.

### 1.3 State Management — Generally Good, One Anti-Pattern

**[P1]** `HomePage.jsx` uses raw `useEffect` + `useState` for data fetching instead of TanStack Query hooks:

```jsx
const [rankings, setRankings] = useState(null);
const [tasks, setTasks] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => { async function load() { ... } load(); }, []);
```

Every other page uses the `useQuery` hooks properly. The HomePage — the most-visited page — is the one that lacks caching, deduplication, and automatic refetching. This means navigating away and back always triggers a fresh fetch with a loading spinner.

Similarly, `BenchmarksPage.jsx` has a `TokenPricingTab` component that does raw `useEffect`-based fetching (`useState` + `useEffect` with `api.getModelPricing()`) instead of using the existing `useModelPricing()` hook.

**Recommendation**: Convert both to use the existing TanStack Query hooks.

### 1.4 File Organization

**[P3]** The current structure is flat and simple — all pages in `pages/`, all shared components in `components/`, all hooks in `lib/hooks.js`. This works at the current scale (27 files) but will become unwieldy past 40-50 files. The `hooks/` directory exists but is empty — all hooks live in `lib/hooks.js`.

---

## 2. User Experience

### 2.1 Missing Loading States on Key Pages

**[P1]** `HomePage.jsx` shows a single generic `Loader2` spinner centered on the page while data loads. Given this is the landing page, users see a blank page with a small spinning icon until both API calls complete. Every other page uses either `SkeletonDashboard` or proper loading states.

**Recommendation**: Add a skeleton loading state to `HomePage.jsx` matching the eventual layout. The `Skeleton.jsx` component already provides `SkeletonCard` and `SkeletonTable` — use them.

### 2.2 Error States Are Inconsistent

**[P2]** Error handling varies across pages:
- `DashboardPage` has a thoughtful "Welcome" state when the backend is down (showing setup instructions)
- `ToolsPage`, `CostPage`, `SettingsPage` show red error text but no recovery action
- `HomePage` silently swallows errors with `catch { /* Non-critical */ }` — if the API is down, users see an empty page with no indication of failure
- `AdvisorChatPage` shows inline error with a message but does not remove the failed user message (comment says it should)

**Recommendation**: Create a shared `ErrorState` component with a retry button. Replace the silent error swallow on HomePage with at least a visible indicator.

### 2.3 No Empty States on Compare Page

**[P2]** The Compare page opens with an empty model picker and no guidance. New users see a search box but no indication of what to do. The Alternatives tab shows a dropdown with "Choose a model..." but no suggestion of which models to compare.

**Recommendation**: Add a brief onboarding prompt: "Select 2-4 models to compare side-by-side" with suggested popular comparisons (e.g., "Claude Opus vs GPT-4o vs Gemini").

### 2.4 Navigation Dead End — AI Advisor Chat

**[P3]** The `AdvisorChatPage` has a back arrow to `/advisor` but after getting recommendations, the only next action is "View full model rankings" linking back to `/advisor`. There is no path to `/compare` from the recommendations, even though recommendations show models that users would naturally want to compare.

### 2.5 Mobile Responsiveness

**[P2]** The mobile experience has several issues:
- **Benchmark tables** scroll horizontally but the sticky first column (`sticky left-0 bg-gray-950`) relies on a specific background color that may not match the parent in all contexts.
- **Compare page tab bar** (`flex-wrap`) wraps but the tabs are quite small on mobile and the picker overlay may be cramped.
- **Sidebar footer** shows hardcoded "$125 monthly spend" — this is not responsive to actual data and reads as fake placeholder content on every screen size.

### 2.6 Accessibility

**[P2]** Good baseline but some gaps:
- **Positives**: `skip-to-content` link, `aria-label` on navigation, `role="dialog"` on modals, `aria-expanded` on hamburger, `focus-visible` ring, `prefers-reduced-motion` support, touch target sizing.
- **Missing**: Table cells lack `scope` attributes on `<th>` elements. Filter buttons lack `aria-pressed` state. The expand/collapse buttons on ranking cards and tool cards lack `aria-expanded`. Chart content is entirely inaccessible to screen readers (no `aria-label` or fallback text on SVG charts). The modal in `BenchmarksPage` lacks proper focus trapping (it saves previous focus but does not constrain tab order).

### 2.7 Hardcoded Sidebar Stats

**[P1]** The sidebar footer displays:
```jsx
<p>Monthly spend: <span className="text-green-400 font-medium">$125</span></p>
<p className="mt-1">Tracking 10 tools, 38+ models</p>
```
These are hardcoded values that never update. Users will see "$125 monthly spend" regardless of their actual data. This undermines trust in the accuracy of the tool.

---

## 3. Visual Design Quality

### 3.1 Typography — Consistent and Well-Structured

**[P3]** Typography is one of the stronger aspects. Inter font is used throughout, with a clear hierarchy:
- Page titles: `text-2xl font-bold` or `text-3xl font-extrabold`
- Section headers: `text-sm font-semibold uppercase tracking-wider` (consistent pattern)
- Body text: `text-xs text-gray-400`
- Data values: `font-mono` for numbers, `tabular-nums` for alignment

Minor inconsistency: the HomePage hero uses `text-4xl sm:text-5xl font-extrabold` while every other page uses `text-2xl font-bold`. This is intentional for the landing page but the jump from 5xl to 2xl is stark when navigating.

### 3.2 Spacing — Mostly Consistent

**[P3]** Most pages follow a `mb-6` gap between sections with `gap-3` or `gap-4` for grid items. A few exceptions:
- HomePage uses `mb-10`, `mb-12`, `mb-8` inconsistently between sections
- Compare page uses `mb-8` for the header but `mb-6` for the tab bar

### 3.3 Color Usage — Intentional and Semantic

**[P3]** Color is used well with a semantic system:
- Green = free/good/savings
- Blue = primary action/mid-range quality
- Yellow = warning/medium
- Orange/Red = expensive/poor quality
- Purple = premium/AI

The quartile color system (`chart-utils.js`) is applied consistently across all bar charts. The score-based color functions, while duplicated, use consistent thresholds.

### 3.4 Design Professionalism

The dark theme with the gray-950 background, subtle borders (gray-800), and muted accent colors creates a professional, developer-focused aesthetic. The card hover effects, stagger animations, and gradient accents on the hero and CTA sections add polish.

### 3.5 Biggest Visual Impact Change

**[P1]** The single highest-impact visual change would be **adding skeleton loading screens to all data-heavy pages** (especially HomePage, ComparePage, and AdvisorPage). Currently these pages flash a centered spinner that gives no sense of what content is coming. Skeleton screens communicate structure and make the app feel faster.

---

## 4. Performance

### 4.1 Code Splitting — Well Implemented

**[P3]** All routes except `HomePage` are lazy-loaded with `React.lazy()`. This is correct — the homepage is eagerly loaded since it is always the entry point.

### 4.2 Bundle Size — Lean Dependency Set

**[P3]** The dependency list is minimal and appropriate:
- `react` + `react-dom` (19.x)
- `react-router-dom` (7.x)
- `@tanstack/react-query` (5.x)
- `recharts` (2.x) — the largest dependency
- `lucide-react` (icons)
- `tailwindcss` (build-time only)

`recharts` is the heaviest runtime dependency (~300KB unpacked). It is used on 6+ pages, so the cost is justified. However, `recharts` does not tree-shake well — importing `BarChart`, `Bar`, `XAxis`, etc. individually is already the best practice, which this codebase follows.

### 4.3 Missing Memoization

**[P2]** Several components would benefit from `useMemo` or `React.memo`:
- `MiniLeaderboard` in `HomePage.jsx` re-renders on every parent state change (e.g., expanding a different leaderboard row triggers re-render of the other leaderboard).
- `ToolCard` (both `ToolsPage` and `CodingToolsPage` versions) — each card parses `JSON.parse(plan.models_included)` on every render. This should be memoized.
- `ComparePage` uses `useMemo` for `filteredModels` and `pricingByTier` (good), but the inline `BarChart data` array in `HomePage` is recreated on every render (`topOverall.map(m => ({...}))` inside JSX).

### 4.4 ChartContainer Force-Resize

**[P3]** `ChartContainer.jsx` dispatches a global `window.dispatchEvent(new Event('resize'))` via IntersectionObserver to fix a Recharts rendering bug. This is a known workaround that works but could theoretically cause jank if multiple charts intersect simultaneously. Acceptable for the current chart count.

### 4.5 Unnecessary API Call on BenchmarksPage

**[P2]** `BenchmarksPage > TokenPricingTab` makes a raw `fetch` via `api.getModelPricing()` in a `useEffect`, but the `useModelPricing()` hook already exists in `hooks.js`. If a user navigates to the Compare page (which uses `useModelPricing()`), then to Benchmarks pricing tab, the data is fetched again instead of using the TanStack Query cache.

---

## 5. Frontend Best Practices

### 5.1 Error Boundary — Present

**[P3]** A root-level `ErrorBoundary` wraps the entire app in `main.jsx`. It shows a friendly error screen with "Refresh Page" and "Go Home" actions, and displays the error message in development mode. This is well-implemented.

### 5.2 SEO — Minimal but Acceptable for SPA

**[P2]** `index.html` has:
- `<title>` tag
- `<meta name="description">`
- `<html lang="en">`
- Semantic HTML is generally good (headings hierarchy, `<main>`, `<nav>`, `<section>`)

Missing:
- No `og:title`, `og:description`, `og:image` meta tags for social sharing
- No `<link rel="canonical">` — important for Cloudflare Pages
- No per-page `<title>` updates (all routes show the same title). React Helmet or a simple `useEffect` could fix this.
- No structured data / JSON-LD
- As an SPA on Cloudflare Pages, the site depends on client-side rendering. Search engines may not index sub-pages well.

### 5.3 Version Mismatch

**[P1]** `HomePage.jsx` hardcodes:
```jsx
const VERSION = 'v0.6.0';
const BUILD_DATE = 'Mar 24, 2026';
```
But `package.json` is at `v0.7.0` and the Sidebar shows `v0.7.0 · Mar 27, 2026`. These should either read from a shared constant or `package.json`.

### 5.4 Missing `useEffect` Import

**[P0]** `BenchmarksPage.jsx` uses `useEffect` in the `ModelToolsModal` and `TokenPricingTab` components but does NOT import it at the top of the file. The import line is:
```jsx
import { useState } from 'react';
```
This will cause a runtime crash when a user clicks on a model name in the benchmarks table or navigates to the Token Pricing tab. `useEffect is not defined` error.

### 5.5 Console Warnings — Likely

**[P2]** Several patterns will produce React warnings:
- `DashboardPage.jsx` line 273: `recommendations.map((rec, i) => ...)` uses `rec.id` as key but the `i` variable is unused and creates a lint warning.
- `ToolsPage.jsx` and `CodingToolsPage.jsx` both export a component named `ToolCard` — this could cause confusion in error messages though it is not technically a bug since they are in separate files.
- Multiple files use `catch { }` (empty catch blocks) which swallow errors silently.

### 5.6 Dynamic Tailwind Classes in RecommendPage

**[P2]** `RecommendPage.jsx > ChipSelect` uses dynamic class construction:
```jsx
className={`bg-${color}-500/20 border-${color}-500/30 text-${color}-400`}
```
Tailwind CSS purges classes at build time based on static analysis. Dynamic class names like `bg-blue-500/20` constructed via template literals will NOT be included in the production CSS bundle unless they appear elsewhere as full strings. This means the colored chip selections (cyan, green variants) may render without their colors in production.

---

## Finding Summary

| # | Finding | Priority | Category |
|---|---------|----------|----------|
| 1 | Missing `useEffect` import in BenchmarksPage crashes Token Pricing tab and Model modal | **P0** | Best Practices |
| 2 | Hardcoded sidebar stats ($125 spend, 10 tools) never update | **P1** | UX |
| 3 | Version mismatch: HomePage says v0.6.0, Sidebar says v0.7.0 | **P1** | Best Practices |
| 4 | HomePage uses raw useEffect instead of TanStack Query (no caching) | **P1** | Architecture |
| 5 | HomePage shows blank spinner instead of skeleton loading | **P1** | UX |
| 6 | Dynamic Tailwind classes in RecommendPage may be purged in production | **P2** | Best Practices |
| 7 | Duplicated score color / price formatting functions across 4+ files | **P2** | Architecture |
| 8 | TokenPricingTab bypasses TanStack Query cache with raw useEffect fetch | **P2** | Performance |
| 9 | Error handling is inconsistent — HomePage silently swallows errors | **P2** | UX |
| 10 | No per-page document titles (every route shows the same title) | **P2** | SEO |
| 11 | No Open Graph meta tags for social sharing | **P2** | SEO |
| 12 | Missing ARIA attributes on interactive elements (filter buttons, expand toggles, charts) | **P2** | Accessibility |
| 13 | Missing memoization on chart data and JSON.parse calls inside render | **P2** | Performance |
| 14 | Compare page has no empty state guidance for new users | **P2** | UX |
| 15 | Mobile table sticky columns may have background color mismatches | **P2** | UX |
| 16 | Pages are 300-700 lines with inline sub-components | **P2** | Architecture |
| 17 | Empty hooks/ directory while all hooks live in lib/hooks.js | **P3** | Architecture |
| 18 | Spacing inconsistency on HomePage (mb-10/mb-12/mb-8) | **P3** | Design |
| 19 | AdvisorChat has no path to Compare from recommendations | **P3** | UX |
| 20 | ChartContainer global resize dispatch could cause jank with many charts | **P3** | Performance |

---

## TOP 3 FRONTEND IMPROVEMENTS

### 1. Fix the P0 crash and add skeleton loading to the HomePage

The missing `useEffect` import in `BenchmarksPage.jsx` is an outright crash — fix it immediately. Then convert `HomePage.jsx` from raw `useEffect` + `useState` to the existing TanStack Query hooks, and replace the centered spinner with a skeleton layout. This fixes the worst bug, improves the first impression on the most-visited page, and brings it in line with every other page's data-fetching pattern. Also fix the version constant (`v0.6.0` to `v0.7.0`).

### 2. Replace hardcoded sidebar values with real data and add per-page titles

The sidebar's "$125 monthly spend" and "Tracking 10 tools, 38+ models" are hardcoded lies that erode user trust. Wire these to actual API data (the cost and tools endpoints already exist). At the same time, add a simple `useEffect` or utility to set `document.title` per page — right now every page shows the same browser tab title, which hurts both usability (users cannot distinguish tabs) and SEO.

### 3. Extract shared utility functions and create a common ErrorState component

Pull the duplicated score-color functions, price formatters, and time-ago functions into `lib/format.js`. Create a shared `ErrorState` component with a retry button and replace the inconsistent error handling across pages (including the silent swallow on HomePage). This reduces code duplication by ~200 lines and ensures users always know when something is wrong and have a way to recover.
