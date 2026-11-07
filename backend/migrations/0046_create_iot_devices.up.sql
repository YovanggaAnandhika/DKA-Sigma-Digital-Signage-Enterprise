CREATE TABLE IF NOT EXISTS iot_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    device_uid VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    device_role VARCHAR(50) NOT NULL DEFAULT 'QUEUE_BUTTON',
    pin_mappings JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address VARCHAR(45),
    firmware_version VARCHAR(50),
    last_seen_at TIMESTAMPTZ,
    last_action VARCHAR(50),
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_iot_devices_corp ON iot_devices(corporation_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_branch ON iot_devices(branch_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_uid ON iot_devices(device_uid);
