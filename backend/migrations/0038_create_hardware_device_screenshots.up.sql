CREATE TABLE IF NOT EXISTS hardware_device_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES hardware_devices(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_screenshots_device ON hardware_device_screenshots(device_id, captured_at DESC);
