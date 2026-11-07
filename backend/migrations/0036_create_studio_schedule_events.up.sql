CREATE TABLE IF NOT EXISTS studio_schedule_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES studio_schedules(id) ON DELETE CASCADE,
    layout_id UUID NOT NULL REFERENCES studio_layouts(id) ON DELETE CASCADE,
    start_time TIME NOT NULL DEFAULT '00:00:00',
    end_time TIME NOT NULL DEFAULT '23:59:59',
    days_of_week VARCHAR(20) NOT NULL DEFAULT '1,2,3,4,5,6,7',
    priority INT NOT NULL DEFAULT 0,
    start_date DATE,
    end_date DATE,
    version_hash VARCHAR(64) DEFAULT 'v1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sched_events_corp ON studio_schedule_events(corporation_id);
CREATE INDEX IF NOT EXISTS idx_sched_events_sched ON studio_schedule_events(schedule_id);
CREATE INDEX IF NOT EXISTS idx_sched_events_layout ON studio_schedule_events(layout_id);
