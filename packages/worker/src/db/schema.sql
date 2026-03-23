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

-- Pricing plans for each tool
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
    UNIQUE(tool_id, plan_name, is_current)
);
CREATE INDEX IF NOT EXISTS idx_plans_tool ON pricing_plans(tool_id);

-- LLM models
CREATE TABLE IF NOT EXISTS models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    vendor TEXT NOT NULL,
    family TEXT,
    release_date TEXT,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(model_id, tool_id, plan_id)
);

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
