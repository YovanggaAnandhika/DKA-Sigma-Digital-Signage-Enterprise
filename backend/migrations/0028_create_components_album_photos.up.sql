CREATE TABLE IF NOT EXISTS components_album_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id UUID NOT NULL REFERENCES components_albums(id) ON DELETE CASCADE,
    media_item_id UUID NOT NULL REFERENCES studio_media_items(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    promo_badge VARCHAR(100),
    price_tag VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_album_photos_album ON components_album_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_media ON components_album_photos(media_item_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_order ON components_album_photos(album_id, position);
