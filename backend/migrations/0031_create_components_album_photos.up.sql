CREATE TABLE IF NOT EXISTS components_album_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES system_corporations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES system_branches(id) ON DELETE SET NULL,
    album_id UUID NOT NULL REFERENCES components_albums(id) ON DELETE CASCADE,
    media_item_id UUID NOT NULL REFERENCES studio_media_items(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 0,
    caption TEXT,
    price_tag VARCHAR(100) NOT NULL DEFAULT '',
    created_by_user_id UUID REFERENCES iam_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_album_photos_corp ON components_album_photos(corporation_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_album ON components_album_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_media ON components_album_photos(media_item_id);
