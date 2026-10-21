CREATE TABLE IF NOT EXISTS components_queue_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_display_id UUID NOT NULL REFERENCES components_queue_displays(id) ON DELETE CASCADE,
    counter_id UUID REFERENCES components_queue_counters(id) ON DELETE SET NULL,
    ticket_number VARCHAR(50) NOT NULL,
    prefix VARCHAR(10) NOT NULL DEFAULT 'A',
    sequence_number INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'waiting',
    called_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_tickets_status ON components_queue_tickets(queue_display_id, status, created_at ASC);
