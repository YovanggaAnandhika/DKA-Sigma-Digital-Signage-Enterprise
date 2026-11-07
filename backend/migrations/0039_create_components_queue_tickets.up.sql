CREATE TABLE IF NOT EXISTS components_queue_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    queue_display_id UUID NOT NULL REFERENCES components_queue_displays(id) ON DELETE CASCADE,
    ticket_number VARCHAR(20) NOT NULL,
    prefix VARCHAR(10) NOT NULL DEFAULT 'A',
    sequence_number INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting',
    counter_id UUID REFERENCES components_queue_counters(id) ON DELETE SET NULL,
    called_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_tickets_corp ON components_queue_tickets(corporation_id);
CREATE INDEX IF NOT EXISTS idx_queue_tickets_branch ON components_queue_tickets(branch_id);
CREATE INDEX IF NOT EXISTS idx_queue_tickets_display ON components_queue_tickets(queue_display_id);
CREATE INDEX IF NOT EXISTS idx_queue_tickets_status ON components_queue_tickets(status);
