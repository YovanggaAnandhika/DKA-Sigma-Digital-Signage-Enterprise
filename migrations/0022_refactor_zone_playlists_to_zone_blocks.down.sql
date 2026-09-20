-- Rename foreign key column back
ALTER TABLE zone_playlist_item_overrides RENAME COLUMN zone_block_id TO zone_playlist_id;

-- Remove constraint
ALTER TABLE zone_blocks DROP CONSTRAINT chk_block_content;

-- Delete any rows that were direct media before we enforce NOT NULL
DELETE FROM zone_blocks WHERE playlist_id IS NULL;

-- Revert playlist_id
ALTER TABLE zone_blocks ALTER COLUMN playlist_id SET NOT NULL;

-- Remove media_item_id
ALTER TABLE zone_blocks DROP COLUMN media_item_id;

-- Rename table back
ALTER TABLE zone_blocks RENAME TO zone_playlists;
