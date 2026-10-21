CREATE TABLE IF NOT EXISTS tickers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    badge VARCHAR(50) NOT NULL DEFAULT 'INFO',
    messages TEXT[] NOT NULL DEFAULT '{}',
    speed VARCHAR(20) NOT NULL DEFAULT 'normal',
    theme VARCHAR(30) NOT NULL DEFAULT 'blue',
    font_size INT NOT NULL DEFAULT 16,
    background_color VARCHAR(50) NOT NULL DEFAULT '#1e3a8a',
    text_color VARCHAR(50) NOT NULL DEFAULT '#ffffff',
    badge_background_color VARCHAR(50) NOT NULL DEFAULT '#2563eb',
    badge_text_color VARCHAR(50) NOT NULL DEFAULT '#ffffff',
    border_color VARCHAR(50) NOT NULL DEFAULT '#60a5fa',
    border_radius INT NOT NULL DEFAULT 8,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickers_created ON tickers(created_at DESC);
