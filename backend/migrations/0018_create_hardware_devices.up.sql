CREATE TABLE IF NOT EXISTS hardware_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    hardware_fingerprint VARCHAR(255) NOT NULL UNIQUE,
    mac_address VARCHAR(50),
    ip_address VARCHAR(50),
    app_version VARCHAR(50),
    android_version VARCHAR(50),
    screen_width INT DEFAULT 1920,
    screen_height INT DEFAULT 1080,
    orientation VARCHAR(20) DEFAULT 'landscape',
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Jakarta',
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    is_paired BOOLEAN NOT NULL DEFAULT FALSE,
    pairing_code VARCHAR(20),
    pairing_code_expires_at TIMESTAMPTZ,
    device_token_hash VARCHAR(255),
    display_group_id UUID REFERENCES hardware_display_groups(id) ON DELETE SET NULL,
    canary_group_id UUID REFERENCES distribution_canary_groups(id) ON DELETE SET NULL,
    current_layout_id UUID REFERENCES studio_layouts(id) ON DELETE SET NULL,
    schedule_id UUID REFERENCES studio_schedules(id) ON DELETE SET NULL,
    schedule_assigned_at TIMESTAMPTZ,
    storage_total_bytes BIGINT DEFAULT 0,
    storage_free_bytes BIGINT DEFAULT 0,
    memory_usage_percent INT DEFAULT 0,
    last_heartbeat_at TIMESTAMPTZ,
    sleep_time TIME DEFAULT '22:00:00',
    wake_time TIME DEFAULT '07:00:00',
    power_schedule_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_corp ON hardware_devices(corporation_id);
CREATE INDEX IF NOT EXISTS idx_devices_branch ON hardware_devices(branch_id);
CREATE INDEX IF NOT EXISTS idx_devices_fingerprint ON hardware_devices(hardware_fingerprint);
CREATE INDEX IF NOT EXISTS idx_devices_group ON hardware_devices(display_group_id);
CREATE INDEX IF NOT EXISTS idx_devices_pairing ON hardware_devices(pairing_code);
CREATE INDEX IF NOT EXISTS idx_devices_schedule ON hardware_devices(schedule_id);
