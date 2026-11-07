CREATE TABLE IF NOT EXISTS hardware_device_layouts (
    device_id UUID NOT NULL REFERENCES hardware_devices(id) ON DELETE CASCADE,
    layout_id UUID NOT NULL REFERENCES studio_layouts(id) ON DELETE CASCADE,
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    canary_group_id UUID REFERENCES distribution_canary_groups(id) ON DELETE SET NULL,
    assigned_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (device_id, layout_id)
);

CREATE INDEX IF NOT EXISTS idx_dev_layouts_corp ON hardware_device_layouts(corporation_id);
CREATE INDEX IF NOT EXISTS idx_dev_layouts_dev ON hardware_device_layouts(device_id);
CREATE INDEX IF NOT EXISTS idx_dev_layouts_layout ON hardware_device_layouts(layout_id);
