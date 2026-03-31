-- OpenRouter model enrichment and activity signals

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
