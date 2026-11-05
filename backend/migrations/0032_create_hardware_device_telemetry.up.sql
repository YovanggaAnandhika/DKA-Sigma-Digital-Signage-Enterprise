CREATE TABLE IF NOT EXISTS hardware_device_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES hardware_devices(id) ON DELETE CASCADE,
    memory_percent INT,
    storage_free_bytes BIGINT,
    storage_total_bytes BIGINT,
    current_playing_media_id UUID,
    active_layout_id UUID,
    ip_address VARCHAR(45),
    payload_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_device ON hardware_device_telemetry(device_id);
-- Add composite index for fast latest telemetry & pending command lookup per device
CREATE INDEX IF NOT EXISTS idx_telemetry_device_created_desc
    ON hardware_device_telemetry (device_id, created_at DESC);