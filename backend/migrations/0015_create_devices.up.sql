CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL DEFAULT 'New Display',
    is_paired BOOLEAN NOT NULL DEFAULT FALSE,
    device_token_hash VARCHAR(255),
    resolution_id UUID REFERENCES resolutions(id) ON DELETE SET NULL,
    orientation_id UUID REFERENCES orientations(id) ON DELETE SET NULL,
    screen_width INT NOT NULL DEFAULT 1920,
    screen_height INT NOT NULL DEFAULT 1080,
    orientation VARCHAR(20) NOT NULL DEFAULT 'landscape',
    ip_address VARCHAR(45),
    mac_address VARCHAR(50),
    app_version VARCHAR(50),
    android_version VARCHAR(50),
    storage_total_bytes BIGINT NOT NULL DEFAULT 0,
    storage_free_bytes BIGINT NOT NULL DEFAULT 0,
    current_layout_id UUID REFERENCES layouts(id) ON DELETE SET NULL,
    canary_group_id UUID REFERENCES canary_groups(id) ON DELETE SET NULL,
    display_group_id UUID REFERENCES display_groups(id) ON DELETE SET NULL,
    schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    last_heartbeat_at TIMESTAMPTZ,
    sleep_time TIME,
    wake_time TIME,
    power_schedule_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_is_paired ON devices(is_paired);
CREATE INDEX IF NOT EXISTS idx_devices_is_online ON devices(is_online);
CREATE INDEX IF NOT EXISTS idx_devices_resolution ON devices(resolution_id);
CREATE INDEX IF NOT EXISTS idx_devices_orientation ON devices(orientation_id);
CREATE INDEX IF NOT EXISTS idx_devices_canary ON devices(canary_group_id);
CREATE INDEX IF NOT EXISTS idx_devices_display_group ON devices(display_group_id);
CREATE INDEX IF NOT EXISTS idx_devices_schedule ON devices(schedule_id);
