ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS version_hash VARCHAR(64);
GRANT ALL PRIVILEGES ON TABLE schedule_events TO dka_signage;
