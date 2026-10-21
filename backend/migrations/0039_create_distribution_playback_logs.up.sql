CREATE TABLE IF NOT EXISTS distribution_playback_logs (
    id BIGSERIAL PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES hardware_devices(id) ON DELETE CASCADE,
    media_id UUID REFERENCES studio_media_items(id) ON DELETE SET NULL,
    layout_id UUID REFERENCES studio_layouts(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playback_logs_device ON distribution_playback_logs(device_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_playback_logs_media ON distribution_playback_logs(media_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_playback_logs_layout ON distribution_playback_logs(layout_id, started_at DESC);
