-- Rename table
ALTER TABLE zone_playlists RENAME TO zone_blocks;

-- Add media_item_id
ALTER TABLE zone_blocks ADD COLUMN media_item_id UUID REFERENCES media_items(id) NULL;

-- Allow playlist_id to be null
ALTER TABLE zone_blocks ALTER COLUMN playlist_id DROP NOT NULL;

-- Add CHECK constraint
ALTER TABLE zone_blocks ADD CONSTRAINT chk_block_content 
  CHECK (
    (playlist_id IS NOT NULL AND media_item_id IS NULL) OR 
    (playlist_id IS NULL AND media_item_id IS NOT NULL)
  );

-- Rename foreign key column in item_overrides table to maintain consistency
ALTER TABLE zone_playlist_item_overrides RENAME COLUMN zone_playlist_id TO zone_block_id;
