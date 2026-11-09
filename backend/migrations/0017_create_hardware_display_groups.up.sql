CREATE TABLE IF NOT EXISTS hardware_display_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    default_layout_id UUID REFERENCES studio_layouts(id) ON DELETE SET NULL,
    schedule_id UUID REFERENCES studio_schedules(id) ON DELETE SET NULL,
    schedule_assigned_at TIMESTAMPTZ,
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_display_groups_corp ON hardware_display_groups(corporation_id);
CREATE INDEX IF NOT EXISTS idx_display_groups_branch ON hardware_display_groups(branch_id);
CREATE INDEX IF NOT EXISTS idx_display_groups_schedule ON hardware_display_groups(schedule_id);
