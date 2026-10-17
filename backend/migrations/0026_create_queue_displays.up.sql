CREATE TABLE IF NOT EXISTS queue_displays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    prefix VARCHAR(10) NOT NULL DEFAULT 'A',
    current_number VARCHAR(50) NOT NULL DEFAULT 'A-001',
    current_counter VARCHAR(50) NOT NULL DEFAULT 'LOKET 01',
    audio_chime_enabled BOOLEAN NOT NULL DEFAULT true,
    marquee_text TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_displays_created ON queue_displays(created_at DESC);
