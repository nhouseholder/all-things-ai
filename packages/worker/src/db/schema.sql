-- ============================================================
-- All Things AI — Consolidated Schema
-- Includes all tables from migrations 0002-0015
-- Last updated: 2026-03-25
-- ============================================================

-- News items from all sources
CREATE TABLE IF NOT EXISTS news_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    source_url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    summary TEXT,
    content_url TEXT NOT NULL,
    author TEXT,
    published_at TEXT NOT NULL,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
    relevance_score REAL DEFAULT 0,
    relevance_tags TEXT,
    is_read INTEGER DEFAULT 0,
    is_bookmarked INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_news_published ON news_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_source ON news_items(source);
CREATE INDEX IF NOT EXISTS idx_news_relevance ON news_items(relevance_score DESC);

-- AI coding tools and platforms
CREATE TABLE IF NOT EXISTS tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    vendor TEXT NOT NULL,
    category TEXT NOT NULL,
    website_url TEXT,
    pricing_page_url TEXT,
    description TEXT,
    logo_url TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pricing plans for each tool (includes 0012_overage_billing columns)
CREATE TABLE IF NOT EXISTS pricing_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER NOT NULL REFERENCES tools(id),
    plan_name TEXT NOT NULL,
    price_monthly REAL,
    price_yearly REAL,
    features TEXT,
    models_included TEXT,
    is_current INTEGER DEFAULT 1,
    detected_at TEXT NOT NULL DEFAULT (datetime('now')),
    changed_at TEXT,
    previous_price REAL,
    included_requests INTEGER,
    overage_model TEXT,
    overage_rate_description TEXT,
    overage_rate_unit TEXT,
    overage_rate_value REAL,
    fallback_behavior TEXT,
    usage_notes TEXT,
    UNIQUE(tool_id, plan_name, is_current)
);
CREATE INDEX IF NOT EXISTS idx_plans_tool ON pricing_plans(tool_id);

-- LLM models (includes 0002_token_pricing columns)
CREATE TABLE IF NOT EXISTS models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    vendor TEXT NOT NULL,
    family TEXT,
    version_string TEXT,
    release_date TEXT,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    input_price_per_mtok REAL,
    output_price_per_mtok REAL,
    cache_hit_price_per_mtok REAL,
    context_window INTEGER,
    params_total TEXT,
    params_active TEXT,
    is_open_weight INTEGER DEFAULT 0,
    discovery_source TEXT DEFAULT 'seed',
    openrouter_id TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_models_discovery_source ON models(discovery_source);
CREATE INDEX IF NOT EXISTS idx_models_version_string ON models(version_string);

-- Benchmark scores for models
CREATE TABLE IF NOT EXISTS benchmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL REFERENCES models(id),
    benchmark_name TEXT NOT NULL,
    category TEXT NOT NULL,
    score REAL NOT NULL,
    max_score REAL,
    source_url TEXT,
    measured_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(model_id, benchmark_name)
);
CREATE INDEX IF NOT EXISTS idx_benchmarks_model ON benchmarks(model_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_category ON benchmarks(category);

-- Maps which models are available on which tool plans
CREATE TABLE IF NOT EXISTS model_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL REFERENCES models(id),
    tool_id INTEGER NOT NULL REFERENCES tools(id),
    plan_id INTEGER REFERENCES pricing_plans(id),
    access_level TEXT,
    notes TEXT,
    credits_per_request REAL,
    cost_notes TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(model_id, tool_id, plan_id)
);
CREATE INDEX IF NOT EXISTS idx_ma_model ON model_availability(model_id);
CREATE INDEX IF NOT EXISTS idx_ma_tool ON model_availability(tool_id);

-- User's current subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER NOT NULL REFERENCES tools(id),
    plan_id INTEGER REFERENCES pricing_plans(id),
    monthly_cost REAL NOT NULL,
    started_at TEXT,
    is_active INTEGER DEFAULT 1
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL
);

-- Generated recommendations
CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    priority REAL DEFAULT 0,
    related_tool_id INTEGER REFERENCES tools(id),
    related_model_id INTEGER REFERENCES models(id),
    related_news_id INTEGER REFERENCES news_items(id),
    is_dismissed INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_recs_dismissed ON recommendations(is_dismissed);

-- Price change history
CREATE TABLE IF NOT EXISTS price_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER NOT NULL REFERENCES tools(id),
    plan_id INTEGER NOT NULL REFERENCES pricing_plans(id),
    old_price REAL,
    new_price REAL,
    change_type TEXT NOT NULL,
    detected_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Email digest log
CREATE TABLE IF NOT EXISTS digest_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sent_at TEXT NOT NULL DEFAULT (datetime('now')),
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    items_count INTEGER,
    status TEXT DEFAULT 'sent'
);

-- ============================================================
-- Tables from migration 0003: Task Intelligence
-- ============================================================

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
    hle_component REAL DEFAULT 0,
    mmlu_component REAL DEFAULT 0,
    humaneval_component REAL DEFAULT 0,
    success_rate_component REAL DEFAULT 0,
    community_adjustment REAL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Community review aggregations by source (includes 0008 columns)
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
    casual_sentiment REAL DEFAULT 0 CHECK(casual_sentiment BETWEEN -1 AND 1),
    casual_satisfaction INTEGER DEFAULT 50 CHECK(casual_satisfaction BETWEEN 0 AND 100),
    casual_count INTEGER DEFAULT 0,
    vibe_coder_sentiment REAL DEFAULT 0 CHECK(vibe_coder_sentiment BETWEEN -1 AND 1),
    vibe_coder_satisfaction INTEGER DEFAULT 50 CHECK(vibe_coder_satisfaction BETWEEN 0 AND 100),
    vibe_coder_count INTEGER DEFAULT 0,
    heavy_coder_sentiment REAL DEFAULT 0 CHECK(heavy_coder_sentiment BETWEEN -1 AND 1),
    heavy_coder_satisfaction INTEGER DEFAULT 50 CHECK(heavy_coder_satisfaction BETWEEN 0 AND 100),
    heavy_coder_count INTEGER DEFAULT 0,
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

-- ============================================================
-- Table from migration 0005: Model Alternatives
-- ============================================================

CREATE TABLE IF NOT EXISTS model_alternatives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL REFERENCES models(id),
    alternative_model_id INTEGER NOT NULL REFERENCES models(id),
    similarity_score REAL NOT NULL DEFAULT 0.0,
    cost_savings_pct REAL,
    trade_off_notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_alt_model ON model_alternatives(model_id);

-- ============================================================
-- Table from migration 0008: Raw Review Cache
-- ============================================================

CREATE TABLE IF NOT EXISTS community_review_raw (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_slug TEXT NOT NULL,
    source TEXT NOT NULL,
    post_id TEXT NOT NULL,
    author TEXT,
    text TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    user_type TEXT NOT NULL DEFAULT 'casual' CHECK(user_type IN ('casual','vibe_coder','heavy_coder')),
    sentiment REAL DEFAULT 0 CHECK(sentiment BETWEEN -1 AND 1),
    coding_satisfaction INTEGER CHECK(coding_satisfaction BETWEEN 0 AND 100),
    keywords_matched TEXT,
    scraped_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(source, post_id, author)
);
CREATE INDEX IF NOT EXISTS idx_crr_model ON community_review_raw(model_slug);
CREATE INDEX IF NOT EXISTS idx_crr_source ON community_review_raw(source);

-- ============================================================
-- Tables from migration 0016: Admin Pipeline
-- ============================================================

-- Staging table for models awaiting review
CREATE TABLE IF NOT EXISTS pending_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    vendor TEXT NOT NULL,
    family TEXT,
    version_string TEXT,
    release_date TEXT,
    description TEXT,
    input_price_per_mtok REAL,
    output_price_per_mtok REAL,
    cache_hit_price_per_mtok REAL,
    context_window INTEGER,
    is_open_weight INTEGER DEFAULT 0,
    discovery_source TEXT,
    discovery_url TEXT,
    openrouter_id TEXT,
    metadata TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    published_model_id INTEGER REFERENCES models(id),
    decision_source TEXT,
    reviewed_at TEXT,
    last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pending_status_seen ON pending_models(status, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_pending_published_model ON pending_models(published_model_id);

CREATE TABLE IF NOT EXISTS model_candidate_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pending_model_id INTEGER NOT NULL REFERENCES pending_models(id),
    signal_type TEXT NOT NULL CHECK(signal_type IN ('official','catalog','news','community')),
    source_key TEXT NOT NULL,
    source_label TEXT,
    source_url TEXT,
    content_url TEXT,
    signal_hash TEXT NOT NULL UNIQUE,
    title TEXT,
    summary TEXT,
    metadata TEXT,
    detected_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_model_candidate_signals_pending ON model_candidate_signals(pending_model_id);
CREATE INDEX IF NOT EXISTS idx_model_candidate_signals_type ON model_candidate_signals(signal_type);

-- Dynamic model aliases for community review matching
CREATE TABLE IF NOT EXISTS model_aliases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_slug TEXT NOT NULL,
    alias TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_alias_slug ON model_aliases(model_slug);

-- OpenRouter enrichment and live activity signals per model
CREATE TABLE IF NOT EXISTS model_openrouter_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL UNIQUE REFERENCES models(id),
    openrouter_id TEXT NOT NULL,
    canonical_slug TEXT,
    openrouter_name TEXT,
    description TEXT,
    context_length INTEGER,
    max_completion_tokens INTEGER,
    modality TEXT,
    input_modalities TEXT,
    output_modalities TEXT,
    tokenizer TEXT,
    instruct_type TEXT,
    supports_reasoning INTEGER DEFAULT 0,
    supports_tools INTEGER DEFAULT 0,
    supports_files INTEGER DEFAULT 0,
    supports_images INTEGER DEFAULT 0,
    supports_structured_outputs INTEGER DEFAULT 0,
    is_moderated INTEGER DEFAULT 0,
    knowledge_cutoff TEXT,
    prompt_price_per_mtok REAL,
    completion_price_per_mtok REAL,
    cache_read_price_per_mtok REAL,
    cache_write_price_per_mtok REAL,
    web_search_price_per_k REAL,
    prompt_tokens_daily INTEGER,
    reasoning_tokens_daily INTEGER,
    completion_tokens_daily INTEGER,
    match_score INTEGER DEFAULT 0,
    hydrates_core_model INTEGER DEFAULT 0,
    source_url TEXT,
    activity_source_url TEXT,
    last_synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_openrouter_model ON model_openrouter_stats(model_id);
CREATE INDEX IF NOT EXISTS idx_openrouter_id ON model_openrouter_stats(openrouter_id);

-- ============================================================
-- Tables from migration 0017: Coding Tools Directory
-- ============================================================

CREATE TABLE IF NOT EXISTS coding_tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    subcategory TEXT,
    description TEXT NOT NULL,
    short_description TEXT,
    url TEXT,
    github_url TEXT,
    source TEXT DEFAULT 'manual',
    platform TEXT DEFAULT 'universal',
    languages TEXT,
    frameworks TEXT,
    use_cases TEXT,
    setup_complexity TEXT DEFAULT 'easy',
    setup_instructions TEXT,
    requires TEXT,
    pricing TEXT DEFAULT 'free',
    stars INTEGER,
    last_updated TEXT,
    community_rating REAL,
    review_count INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ct_category ON coding_tools(category);
CREATE INDEX IF NOT EXISTS idx_ct_platform ON coding_tools(platform);

CREATE TABLE IF NOT EXISTS coding_tool_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER NOT NULL REFERENCES coding_tools(id),
    tag TEXT NOT NULL,
    UNIQUE(tool_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_ctt_tag ON coding_tool_tags(tag);
CREATE INDEX IF NOT EXISTS idx_ctt_tool ON coding_tool_tags(tool_id);

-- ============================================================
-- Tables from migration 0019: Tool & Plugin Rankings
-- ============================================================

-- Tool features for feature-coverage scoring (IDE tools)
CREATE TABLE IF NOT EXISTS tool_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER NOT NULL REFERENCES tools(id),
    feature TEXT NOT NULL,
    supported INTEGER DEFAULT 1,
    UNIQUE(tool_id, feature)
);
CREATE INDEX IF NOT EXISTS idx_tf_tool ON tool_features(tool_id);

-- Tool reviews (community signals for IDE tools)
CREATE TABLE IF NOT EXISTS tool_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER NOT NULL REFERENCES tools(id),
    source TEXT NOT NULL,
    sentiment_score REAL DEFAULT 0,
    satisfaction INTEGER DEFAULT 50,
    review_count INTEGER DEFAULT 0,
    common_complaints TEXT,
    common_praises TEXT,
    scraped_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(tool_id, source)
);
CREATE INDEX IF NOT EXISTS idx_tr_tool ON tool_reviews(tool_id);

-- Tool composite scores (IDE tools)
CREATE TABLE IF NOT EXISTS tool_composite_scores (
    tool_id INTEGER PRIMARY KEY REFERENCES tools(id),
    model_breadth_score REAL DEFAULT 0,
    pricing_score REAL DEFAULT 0,
    community_score REAL DEFAULT 0,
    feature_score REAL DEFAULT 0,
    freshness_score REAL DEFAULT 0,
    composite_score REAL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Plugin composite scores (coding tools: MCP servers, skills, extensions)
CREATE TABLE IF NOT EXISTS plugin_composite_scores (
    plugin_id INTEGER PRIMARY KEY REFERENCES coding_tools(id),
    stars_score REAL DEFAULT 0,
    freshness_score REAL DEFAULT 0,
    compatibility_score REAL DEFAULT 0,
    community_score REAL DEFAULT 0,
    simplicity_score REAL DEFAULT 0,
    docs_score REAL DEFAULT 0,
    composite_score REAL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
