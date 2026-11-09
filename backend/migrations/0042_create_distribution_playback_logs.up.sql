CREATE TABLE IF NOT EXISTS distribution_playback_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    device_id UUID NOT NULL REFERENCES hardware_devices(id) ON DELETE CASCADE,
    layout_id UUID REFERENCES studio_layouts(id) ON DELETE SET NULL,
    media_item_id UUID REFERENCES studio_media_items(id) ON DELETE SET NULL,
    media_id UUID REFERENCES studio_media_items(id) ON DELETE SET NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    is_completed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playback_logs_corp ON distribution_playback_logs(corporation_id);
CREATE INDEX IF NOT EXISTS idx_playback_logs_branch ON distribution_playback_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_playback_logs_dev ON distribution_playback_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_playback_logs_media ON distribution_playback_logs(media_item_id);
