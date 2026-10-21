CREATE TABLE IF NOT EXISTS hardware_device_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES hardware_devices(id) ON DELETE CASCADE,
    layout_id UUID NOT NULL REFERENCES studio_layouts(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INT NOT NULL DEFAULT 1,
    start_time TIME,
    end_time TIME,
    days_of_week VARCHAR(30) DEFAULT '1,2,3,4,5,6,7', -- 1=Monday, 7=Sunday
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dl_device ON hardware_device_layouts(device_id);
CREATE INDEX IF NOT EXISTS idx_dl_layout ON hardware_device_layouts(layout_id);
CREATE INDEX IF NOT EXISTS idx_dl_active ON hardware_device_layouts(device_id, is_active);
