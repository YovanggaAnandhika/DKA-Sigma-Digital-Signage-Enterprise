CREATE TABLE IF NOT EXISTS components_queue_iot_discoveries (
    device_uid VARCHAR(100) PRIMARY KEY,
    ip_address VARCHAR(50),
    firmware_version VARCHAR(50) DEFAULT '1.0.0',
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_iot_disc_seen ON components_queue_iot_discoveries(last_seen_at DESC);
