-- Add composite index for fast latest telemetry & pending command lookup per device
CREATE INDEX IF NOT EXISTS idx_telemetry_device_created_desc
    ON hardware_device_telemetry (device_id, created_at DESC);

