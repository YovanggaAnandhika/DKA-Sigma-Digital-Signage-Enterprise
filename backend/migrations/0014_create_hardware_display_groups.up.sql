CREATE TABLE IF NOT EXISTS hardware_display_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    default_layout_id UUID REFERENCES studio_layouts(id) ON DELETE SET NULL,
    schedule_id UUID REFERENCES studio_schedules(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_display_groups_schedule ON hardware_display_groups(schedule_id);
