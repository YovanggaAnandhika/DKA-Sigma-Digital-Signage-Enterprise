CREATE TABLE IF NOT EXISTS hardware_device_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    device_id UUID NOT NULL REFERENCES hardware_devices(id) ON DELETE CASCADE,
    uptime_seconds BIGINT NOT NULL DEFAULT 0,
    temperature_celsius NUMERIC(5, 2),
    cpu_usage_percent INT DEFAULT 0,
    memory_usage_percent INT DEFAULT 0,
    storage_usage_percent INT DEFAULT 0,
    input_output JSONB DEFAULT '{}'::jsonb,
    assets_stats JSONB DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_analytics_corp ON hardware_device_analytics(corporation_id);
CREATE INDEX IF NOT EXISTS idx_dev_analytics_branch ON hardware_device_analytics(branch_id);
CREATE INDEX IF NOT EXISTS idx_dev_analytics_device ON hardware_device_analytics(device_id);
CREATE INDEX IF NOT EXISTS idx_dev_analytics_recorded_at ON hardware_device_analytics(recorded_at);
