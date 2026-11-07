CREATE TABLE IF NOT EXISTS studio_playlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    playlist_id UUID NOT NULL REFERENCES studio_playlists(id) ON DELETE CASCADE,
    media_item_id UUID NOT NULL REFERENCES studio_media_items(id) ON DELETE RESTRICT,
    duration_seconds INT NOT NULL DEFAULT 10,
    order_index INT NOT NULL DEFAULT 0,
    trim_start_seconds INT DEFAULT 0,
    trim_end_seconds INT,
    transition_id UUID,
    visual_filter_id UUID,
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    volume_level INT NOT NULL DEFAULT 100,
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playlist_items_corp ON studio_playlist_items(corporation_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist ON studio_playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_media ON studio_playlist_items(media_item_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_order ON studio_playlist_items(order_index);
