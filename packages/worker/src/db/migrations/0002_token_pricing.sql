-- Add token pricing to models
ALTER TABLE models ADD COLUMN input_price_per_mtok REAL;
ALTER TABLE models ADD COLUMN output_price_per_mtok REAL;
ALTER TABLE models ADD COLUMN cache_hit_price_per_mtok REAL;
ALTER TABLE models ADD COLUMN context_window INTEGER;
ALTER TABLE models ADD COLUMN params_total TEXT;
ALTER TABLE models ADD COLUMN params_active TEXT;
ALTER TABLE models ADD COLUMN is_open_weight INTEGER DEFAULT 0;
