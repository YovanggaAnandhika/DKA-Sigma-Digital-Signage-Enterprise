CREATE TABLE IF NOT EXISTS queue_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_display_id UUID NOT NULL REFERENCES queue_displays(id) ON DELETE CASCADE,
    counter_number INT NOT NULL,
    counter_name VARCHAR(100) NOT NULL,
    operator_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    current_ticket_number VARCHAR(50),
    last_called_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    status_note VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_counters_parent ON queue_counters(queue_display_id, counter_number ASC);
CREATE INDEX IF NOT EXISTS idx_queue_counters_status ON queue_counters(queue_display_id, status);
