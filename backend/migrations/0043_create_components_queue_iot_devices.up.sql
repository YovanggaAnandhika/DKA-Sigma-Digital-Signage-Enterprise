CREATE TABLE IF NOT EXISTS components_queue_iot_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_display_id UUID NOT NULL REFERENCES components_queue_displays(id) ON DELETE CASCADE,
    device_uid VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    device_role VARCHAR(50) NOT NULL DEFAULT 'COUNTER_REMOTE',
    counter_id UUID REFERENCES components_queue_counters(id) ON DELETE SET NULL,
    ticket_prefix VARCHAR(10) DEFAULT 'A',
    pin_mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    ip_address VARCHAR(50),
    firmware_version VARCHAR(50) DEFAULT '1.0.0',
    last_seen_at TIMESTAMPTZ,
    last_action VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_queue_iot_device_uid UNIQUE (device_uid)
);

CREATE INDEX IF NOT EXISTS idx_queue_iot_display ON components_queue_iot_devices(queue_display_id);
CREATE INDEX IF NOT EXISTS idx_queue_iot_device_uid ON components_queue_iot_devices(device_uid);
