CREATE TABLE IF NOT EXISTS components_clocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Makassar',
    show_seconds BOOLEAN NOT NULL DEFAULT true,
    is_24_hour BOOLEAN NOT NULL DEFAULT true,
    theme VARCHAR(30) NOT NULL DEFAULT 'glass',
    background_color VARCHAR(50) NOT NULL DEFAULT '#0f172a',
    text_color VARCHAR(50) NOT NULL DEFAULT '#ffffff',
    subtitle_color VARCHAR(50) NOT NULL DEFAULT '#94a3b8',
    border_color VARCHAR(50) NOT NULL DEFAULT '#1e3a8a',
    border_radius INT NOT NULL DEFAULT 12,
    time_font_size INT NOT NULL DEFAULT 52,
    date_font_size INT NOT NULL DEFAULT 14,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clocks_created ON components_clocks(created_at DESC);
