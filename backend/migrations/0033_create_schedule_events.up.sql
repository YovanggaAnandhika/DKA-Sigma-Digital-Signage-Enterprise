CREATE TABLE IF NOT EXISTS schedule_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    layout_id UUID NOT NULL REFERENCES layouts(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days_of_week VARCHAR(20) NOT NULL,
    priority INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_events_schedule ON schedule_events(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_layout ON schedule_events(layout_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_priority ON schedule_events(schedule_id, priority DESC);
