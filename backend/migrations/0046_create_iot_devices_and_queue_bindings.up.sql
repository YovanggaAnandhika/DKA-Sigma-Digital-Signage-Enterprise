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

CREATE TABLE components_queue_iot_bindings (
    iot_device_id UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    queue_display_id UUID NOT NULL REFERENCES components_queue_displays(id) ON DELETE CASCADE,
    counter_id UUID REFERENCES components_queue_counters(id) ON DELETE SET NULL,
    ticket_prefix VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (iot_device_id, queue_display_id)
);

CREATE INDEX idx_iot_devices_approval_seen ON iot_devices(is_approved, last_seen_at DESC);
CREATE INDEX idx_queue_iot_bindings_queue ON components_queue_iot_bindings(queue_display_id);

INSERT INTO iot_devices (
    id, device_uid, name, device_role, pin_mappings, is_active, is_approved,
    ip_address, firmware_version, last_seen_at, last_action, created_at, updated_at
)
SELECT id, device_uid, name, device_role, pin_mappings, is_active, true,
       ip_address, firmware_version, last_seen_at, last_action, created_at, updated_at
FROM components_queue_iot_devices
ON CONFLICT (device_uid) DO NOTHING;

INSERT INTO iot_devices (
    device_uid, name, device_role, is_active, is_approved,
    ip_address, firmware_version, last_seen_at, created_at
)
SELECT discovery.device_uid, 'IoT ' || discovery.device_uid, 'COUNTER_REMOTE', false, false,
       discovery.ip_address, discovery.firmware_version, discovery.last_seen_at, discovery.created_at
FROM components_queue_iot_discoveries AS discovery
ON CONFLICT (device_uid) DO NOTHING;

INSERT INTO components_queue_iot_bindings (
    iot_device_id, queue_display_id, counter_id, ticket_prefix
)
SELECT device.id, legacy.queue_display_id, legacy.counter_id, legacy.ticket_prefix
FROM components_queue_iot_devices AS legacy
JOIN iot_devices AS device ON device.device_uid = legacy.device_uid
ON CONFLICT (iot_device_id, queue_display_id) DO NOTHING;
