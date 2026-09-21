ALTER TABLE display_groups ADD COLUMN schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL;
ALTER TABLE devices ADD COLUMN schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL;
