CREATE TABLE IF NOT EXISTS hardware_device_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    device_id UUID NOT NULL REFERENCES hardware_devices(id) ON DELETE CASCADE,
    telemetry_type VARCHAR(50) DEFAULT 'heartbeat',
    memory_percent INT DEFAULT 0,
    storage_free_bytes BIGINT DEFAULT 0,
    storage_total_bytes BIGINT DEFAULT 0,
    ip_address VARCHAR(50),
    current_playing_media_id UUID,
    active_layout_id UUID,
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_telemetry_corp ON hardware_device_telemetry(corporation_id);
CREATE INDEX IF NOT EXISTS idx_dev_telemetry_branch ON hardware_device_telemetry(branch_id);
CREATE INDEX IF NOT EXISTS idx_dev_telemetry_device ON hardware_device_telemetry(device_id);
CREATE INDEX IF NOT EXISTS idx_dev_telemetry_type ON hardware_device_telemetry(telemetry_type);
