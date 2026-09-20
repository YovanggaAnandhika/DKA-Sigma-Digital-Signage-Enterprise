-- Remove assigned_playlist_id from zones
-- ALTER TABLE zones DROP COLUMN assigned_playlist_id;

-- Drop primary key and add id UUID for zone_playlists
ALTER TABLE zone_playlists DROP CONSTRAINT zone_playlists_pkey;
ALTER TABLE zone_playlists ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE zone_playlists ADD COLUMN start_time_seconds INT NOT NULL DEFAULT 0;
ALTER TABLE zone_playlists ADD COLUMN duration_seconds INT NOT NULL DEFAULT 10;
ALTER TABLE zone_playlists ADD COLUMN transition_type VARCHAR(50);
ALTER TABLE zone_playlists ADD COLUMN order_index INT NOT NULL DEFAULT 0;
