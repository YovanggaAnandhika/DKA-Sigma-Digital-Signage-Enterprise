CREATE TABLE IF NOT EXISTS clocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Makassar',
    show_seconds BOOLEAN NOT NULL DEFAULT true,
    is_24_hour BOOLEAN NOT NULL DEFAULT true,
    theme VARCHAR(30) NOT NULL DEFAULT 'glass',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clocks_created ON clocks(created_at DESC);
