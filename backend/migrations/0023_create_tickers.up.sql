CREATE TABLE IF NOT EXISTS tickers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    badge VARCHAR(50) NOT NULL DEFAULT 'INFO',
    messages TEXT[] NOT NULL DEFAULT '{}',
    speed VARCHAR(20) NOT NULL DEFAULT 'normal',
    theme VARCHAR(30) NOT NULL DEFAULT 'blue',
    font_size INT NOT NULL DEFAULT 16,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickers_created ON tickers(created_at DESC);
