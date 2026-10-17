CREATE TABLE IF NOT EXISTS queue_displays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    prefix VARCHAR(10) NOT NULL DEFAULT 'A',
    canvas_width INT NOT NULL DEFAULT 1920,
    canvas_height INT NOT NULL DEFAULT 1080,
    background_color VARCHAR(50) NOT NULL DEFAULT '#f8fafc',
    background_image_url TEXT,
    theme_preset VARCHAR(50) NOT NULL DEFAULT 'clean-light',
    auto_recall_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_displays_created ON queue_displays(created_at DESC);
