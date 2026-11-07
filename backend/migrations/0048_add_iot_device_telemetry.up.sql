CREATE TABLE IF NOT EXISTS iot_device_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    iot_device_id UUID REFERENCES iot_devices(id) ON DELETE CASCADE,
    device_uid VARCHAR(100) NOT NULL,
    record_type VARCHAR(50) NOT NULL DEFAULT 'TELEMETRY',
    ip_address VARCHAR(45),
    rssi INT,
    firmware_version VARCHAR(50),
    uptime_ms BIGINT,
    pin INT,
    button_event VARCHAR(50),
    action VARCHAR(50),
    status VARCHAR(50),
    message TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_iot_telemetry_corp ON iot_device_telemetry(corporation_id);
CREATE INDEX IF NOT EXISTS idx_iot_telemetry_branch ON iot_device_telemetry(branch_id);
CREATE INDEX IF NOT EXISTS idx_iot_telemetry_device ON iot_device_telemetry(iot_device_id);
CREATE INDEX IF NOT EXISTS idx_iot_telemetry_uid ON iot_device_telemetry(device_uid);
CREATE INDEX IF NOT EXISTS idx_iot_telemetry_recorded ON iot_device_telemetry(recorded_at DESC);
