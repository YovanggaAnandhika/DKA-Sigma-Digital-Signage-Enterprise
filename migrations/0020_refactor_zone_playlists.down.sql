ALTER TABLE zone_playlists DROP COLUMN order_index;
ALTER TABLE zone_playlists DROP COLUMN transition_type;
ALTER TABLE zone_playlists DROP COLUMN duration_seconds;
ALTER TABLE zone_playlists DROP COLUMN start_time_seconds;
ALTER TABLE zone_playlists DROP COLUMN id;
ALTER TABLE zone_playlists ADD PRIMARY KEY (zone_id, playlist_id);

ALTER TABLE zones ADD COLUMN assigned_playlist_id UUID;
