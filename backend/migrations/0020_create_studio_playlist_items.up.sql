CREATE TABLE IF NOT EXISTS studio_playlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES studio_playlists(id) ON DELETE CASCADE,
    media_item_id UUID NOT NULL REFERENCES studio_media_items(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL DEFAULT 10,
    transition_type VARCHAR(50) NOT NULL DEFAULT 'fade',
    is_muted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist ON studio_playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_media ON studio_playlist_items(media_item_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_order ON studio_playlist_items(playlist_id, position);
