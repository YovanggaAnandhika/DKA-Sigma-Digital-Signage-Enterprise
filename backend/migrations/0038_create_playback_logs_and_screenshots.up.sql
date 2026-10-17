-- Migration 0038: Proof of Play, Device Screenshots, and Schedule Campaign Dates

-- 1. Campaign Date Ranges in Schedule Events
ALTER TABLE schedule_events 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- 2. Device Screenshots Captured Remotely
CREATE TABLE IF NOT EXISTS device_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_screenshots_device ON device_screenshots(device_id, captured_at DESC);

-- 3. Proof of Play (Playback Impressions Ledger)
CREATE TABLE IF NOT EXISTS playback_logs (
    id BIGSERIAL PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media_items(id) ON DELETE SET NULL,
    layout_id UUID REFERENCES layouts(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playback_logs_device ON playback_logs(device_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_playback_logs_media ON playback_logs(media_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_playback_logs_layout ON playback_logs(layout_id, started_at DESC);
