CREATE TABLE IF NOT EXISTS zone_playlist_item_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_playlist_id UUID NOT NULL REFERENCES zone_playlists(id) ON DELETE CASCADE,
    playlist_item_id UUID NOT NULL REFERENCES playlist_items(id) ON DELETE CASCADE,
    is_muted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(zone_playlist_id, playlist_item_id)
);

CREATE TRIGGER update_zone_playlist_item_overrides_updated_at
    BEFORE UPDATE ON zone_playlist_item_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
