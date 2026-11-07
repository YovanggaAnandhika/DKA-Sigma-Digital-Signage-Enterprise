CREATE TABLE IF NOT EXISTS components_queue_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    queue_display_id UUID NOT NULL REFERENCES components_queue_displays(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    number INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    assigned_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_counters_corp ON components_queue_counters(corporation_id);
CREATE INDEX IF NOT EXISTS idx_queue_counters_branch ON components_queue_counters(branch_id);
CREATE INDEX IF NOT EXISTS idx_queue_counters_display ON components_queue_counters(queue_display_id);
