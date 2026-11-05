CREATE TABLE iot_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_uid VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    device_role VARCHAR(50) NOT NULL DEFAULT 'COUNTER_REMOTE',
    pin_mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    ip_address VARCHAR(50),
    firmware_version VARCHAR(50) DEFAULT '1.0.0',
    last_seen_at TIMESTAMPTZ,
    last_action VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_iot_devices_approval_seen ON iot_devices(is_approved, last_seen_at DESC);
