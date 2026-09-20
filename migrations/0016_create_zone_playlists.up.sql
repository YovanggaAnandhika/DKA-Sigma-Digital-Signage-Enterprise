CREATE TABLE IF NOT EXISTS zone_playlists (
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (zone_id, playlist_id)
);

CREATE INDEX IF NOT EXISTS idx_zp_zone ON zone_playlists(zone_id);
CREATE INDEX IF NOT EXISTS idx_zp_playlist ON zone_playlists(playlist_id);
