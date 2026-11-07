CREATE TABLE IF NOT EXISTS iot_device_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    device_uid VARCHAR(100) NOT NULL REFERENCES iot_devices(device_uid) ON DELETE CASCADE,
    wifi_rssi INT,
    ip_address VARCHAR(45),
    firmware_version VARCHAR(50),
    uptime_seconds BIGINT,
    free_heap_bytes BIGINT,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_iot_telemetry_corp ON iot_device_telemetry(corporation_id);
CREATE INDEX IF NOT EXISTS idx_iot_telemetry_branch ON iot_device_telemetry(branch_id);
CREATE INDEX IF NOT EXISTS idx_iot_telemetry_uid ON iot_device_telemetry(device_uid);
CREATE INDEX IF NOT EXISTS idx_iot_telemetry_created ON iot_device_telemetry(created_at DESC);
