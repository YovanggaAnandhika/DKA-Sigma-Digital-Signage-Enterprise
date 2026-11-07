CREATE TABLE IF NOT EXISTS hardware_device_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    device_id UUID NOT NULL REFERENCES hardware_devices(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_screenshots_corp ON hardware_device_screenshots(corporation_id);
CREATE INDEX IF NOT EXISTS idx_dev_screenshots_branch ON hardware_device_screenshots(branch_id);
CREATE INDEX IF NOT EXISTS idx_dev_screenshots_device ON hardware_device_screenshots(device_id);
