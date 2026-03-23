-- Migration: Task Intelligence Tables
-- Adds task profiles, model task estimates, composite scores,
-- community reviews, and task tool recommendations.

-- Task profiles define common coding task types
CREATE TABLE IF NOT EXISTS task_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    avg_input_tokens INTEGER NOT NULL DEFAULT 8000,
    avg_output_tokens INTEGER NOT NULL DEFAULT 4000,
    complexity INTEGER NOT NULL DEFAULT 3 CHECK(complexity BETWEEN 1 AND 5),
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Per-model estimates for each task profile
CREATE TABLE IF NOT EXISTS model_task_estimates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL REFERENCES models(id),
    task_profile_id INTEGER NOT NULL REFERENCES task_profiles(id),
    first_attempt_success_rate REAL NOT NULL CHECK(first_attempt_success_rate BETWEEN 0 AND 1),
    avg_messages_to_complete REAL NOT NULL DEFAULT 1.0,
    avg_minutes_to_complete REAL,
    steering_effort TEXT NOT NULL DEFAULT 'medium' CHECK(steering_effort IN ('low','medium','high')),
    autonomy_score INTEGER CHECK(autonomy_score BETWEEN 0 AND 100),
    cost_per_task_estimate REAL,
    time_value_per_task REAL,
    data_source TEXT NOT NULL DEFAULT 'estimated' CHECK(data_source IN ('benchmark','community','estimated')),
    notes TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(model_id, task_profile_id)
);
CREATE INDEX IF NOT EXISTS idx_mte_model ON model_task_estimates(model_id);
CREATE INDEX IF NOT EXISTS idx_mte_task ON model_task_estimates(task_profile_id);

-- Composite scores aggregating benchmarks + community signal
CREATE TABLE IF NOT EXISTS model_composite_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL REFERENCES models(id) UNIQUE,
    composite_score REAL NOT NULL DEFAULT 0,
    swe_bench_component REAL DEFAULT 0,
    livecodebench_component REAL DEFAULT 0,
    nuance_component REAL DEFAULT 0,
    arena_component REAL DEFAULT 0,
    tau_component REAL DEFAULT 0,
    gpqa_component REAL DEFAULT 0,
    success_rate_component REAL DEFAULT 0,
    community_adjustment REAL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Community review aggregations by source
CREATE TABLE IF NOT EXISTS community_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL REFERENCES models(id),
    source TEXT NOT NULL,
    sentiment_score REAL DEFAULT 0 CHECK(sentiment_score BETWEEN -1 AND 1),
    coding_satisfaction INTEGER DEFAULT 50 CHECK(coding_satisfaction BETWEEN 0 AND 100),
    common_complaints TEXT,
    common_praises TEXT,
    review_count INTEGER DEFAULT 0,
    sample_quotes TEXT,
    last_scraped TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(model_id, source)
);
CREATE INDEX IF NOT EXISTS idx_cr_model ON community_reviews(model_id);

-- Recommended tool+model combos per task
CREATE TABLE IF NOT EXISTS task_tool_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_profile_id INTEGER NOT NULL REFERENCES task_profiles(id),
    tool_id INTEGER NOT NULL REFERENCES tools(id),
    plan_id INTEGER REFERENCES pricing_plans(id),
    model_id INTEGER NOT NULL REFERENCES models(id),
    recommendation_text TEXT NOT NULL,
    value_proposition TEXT,
    rank INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(task_profile_id, tool_id, model_id)
);
