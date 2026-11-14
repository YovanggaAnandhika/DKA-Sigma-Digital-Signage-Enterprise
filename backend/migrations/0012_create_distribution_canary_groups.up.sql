CREATE TABLE IF NOT EXISTS distribution_canary_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rollout_percentage INT NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    target_layout_id UUID REFERENCES studio_layouts(id) ON DELETE SET NULL,
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canary_groups_corp ON distribution_canary_groups(corporation_id);
CREATE INDEX IF NOT EXISTS idx_canary_groups_branch ON distribution_canary_groups(branch_id);
CREATE INDEX IF NOT EXISTS idx_canary_groups_target_layout ON distribution_canary_groups(target_layout_id);
