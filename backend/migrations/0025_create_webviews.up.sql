CREATE TABLE IF NOT EXISTS webviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    refresh_interval_seconds INT NOT NULL DEFAULT 60,
    zoom_scale INT NOT NULL DEFAULT 100,
    bypass_cache BOOLEAN NOT NULL DEFAULT true,
    orientation VARCHAR(20) NOT NULL DEFAULT 'landscape',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webviews_created ON webviews(created_at DESC);
