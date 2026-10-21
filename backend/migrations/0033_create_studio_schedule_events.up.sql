CREATE TABLE IF NOT EXISTS studio_schedule_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES studio_schedules(id) ON DELETE CASCADE,
    layout_id UUID NOT NULL REFERENCES studio_layouts(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days_of_week VARCHAR(20) NOT NULL,
    priority INT NOT NULL DEFAULT 0,
    start_date DATE,
    end_date DATE,
    version_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_events_schedule ON studio_schedule_events(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_layout ON studio_schedule_events(layout_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_priority ON studio_schedule_events(schedule_id, priority DESC);
