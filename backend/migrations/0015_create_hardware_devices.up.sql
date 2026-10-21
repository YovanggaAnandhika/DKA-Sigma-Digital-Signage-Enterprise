CREATE TABLE IF NOT EXISTS hardware_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL DEFAULT 'New Display',
    is_paired BOOLEAN NOT NULL DEFAULT FALSE,
    device_token_hash VARCHAR(255),
    resolution_id UUID REFERENCES common_resolutions(id) ON DELETE SET NULL,
    orientation_id UUID REFERENCES common_orientations(id) ON DELETE SET NULL,
    screen_width INT NOT NULL DEFAULT 1920,
    screen_height INT NOT NULL DEFAULT 1080,
    orientation VARCHAR(20) NOT NULL DEFAULT 'landscape',
    ip_address VARCHAR(45),
    mac_address VARCHAR(50),
    hardware_fingerprint VARCHAR(100) UNIQUE,
    app_version VARCHAR(50),
    android_version VARCHAR(50),
    storage_total_bytes BIGINT NOT NULL DEFAULT 0,
    storage_free_bytes BIGINT NOT NULL DEFAULT 0,
    current_layout_id UUID REFERENCES studio_layouts(id) ON DELETE SET NULL,
    canary_group_id UUID REFERENCES distribution_canary_groups(id) ON DELETE SET NULL,
    display_group_id UUID REFERENCES hardware_display_groups(id) ON DELETE SET NULL,
    schedule_id UUID REFERENCES studio_schedules(id) ON DELETE SET NULL,
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    last_heartbeat_at TIMESTAMPTZ,
    sleep_time TIME,
    wake_time TIME,
    power_schedule_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_is_paired ON hardware_devices(is_paired);
CREATE INDEX IF NOT EXISTS idx_devices_is_online ON hardware_devices(is_online);
CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_hardware_fingerprint ON hardware_devices(hardware_fingerprint);
CREATE INDEX IF NOT EXISTS idx_devices_resolution ON hardware_devices(resolution_id);
CREATE INDEX IF NOT EXISTS idx_devices_orientation ON hardware_devices(orientation_id);
CREATE INDEX IF NOT EXISTS idx_devices_canary ON hardware_devices(canary_group_id);
CREATE INDEX IF NOT EXISTS idx_devices_display_group ON hardware_devices(display_group_id);
CREATE INDEX IF NOT EXISTS idx_devices_schedule ON hardware_devices(schedule_id);
