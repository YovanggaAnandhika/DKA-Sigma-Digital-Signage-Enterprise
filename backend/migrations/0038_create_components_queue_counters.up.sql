CREATE TABLE IF NOT EXISTS components_queue_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    queue_display_id UUID NOT NULL REFERENCES components_queue_displays(id) ON DELETE CASCADE,
    counter_number INT NOT NULL DEFAULT 1,
    counter_name VARCHAR(100) NOT NULL DEFAULT 'Loket 1',
    operator_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(50) NOT NULL DEFAULT 'ready',
    status_note TEXT,
    current_ticket_number VARCHAR(20),
    last_called_at TIMESTAMPTZ,
    assigned_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_counters_corp ON components_queue_counters(corporation_id);
CREATE INDEX IF NOT EXISTS idx_queue_counters_branch ON components_queue_counters(branch_id);
CREATE INDEX IF NOT EXISTS idx_queue_counters_display ON components_queue_counters(queue_display_id);
