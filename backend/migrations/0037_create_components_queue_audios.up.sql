CREATE TABLE IF NOT EXISTS components_queue_audios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_display_id UUID NOT NULL REFERENCES components_queue_displays(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    audio_type VARCHAR(50) NOT NULL DEFAULT 'preset',
    media_item_id UUID REFERENCES studio_media_items(id) ON DELETE SET NULL,
    file_url TEXT,
    volume_percent INT NOT NULL DEFAULT 80,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_audios_parent ON components_queue_audios(queue_display_id);
