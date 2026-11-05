CREATE TABLE iot_device_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iot_device_id UUID REFERENCES iot_devices(id) ON DELETE SET NULL,
    device_uid VARCHAR(100) NOT NULL,
    record_type VARCHAR(16) NOT NULL CHECK (record_type IN ('TELEMETRY', 'BUTTON')),
    ip_address VARCHAR(50),
    rssi INTEGER,
    firmware_version VARCHAR(50),
    uptime_ms BIGINT,
    pin INTEGER,
    button_event VARCHAR(50),
    action VARCHAR(100),
    status VARCHAR(16),
    message TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_iot_device_telemetry_device_recorded
    ON iot_device_telemetry(iot_device_id, recorded_at DESC);
