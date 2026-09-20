use crate::modules::studio::layout::model::LayoutWithZonesDto;
use crate::modules::studio::playlist::model::PlaylistWithItemsDto;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestAssetDto {
    pub media_id: Uuid,
    pub name: String,
    pub url: String,
    pub sha256_hash: String,
    pub file_size_bytes: i64,
    pub local_filename: String,
    pub media_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZoneWithPlaylistDto {
    pub id: Uuid,
    pub name: String,
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
    pub z_index: i32,
    pub background_color: String,
    pub playlist: Option<PlaylistWithItemsDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompiledManifestDto {
    pub manifest_id: Uuid,
    pub device_id: Uuid,
    pub version_hash: String,
    pub generated_at: String,
    pub layout_id: Uuid,
    pub layout_name: String,
    pub canvas_width: i32,
    pub canvas_height: i32,
    pub orientation: String,
    pub background_color: String,
    pub background_image_url: Option<String>,
    pub zones: Vec<ZoneWithPlaylistDto>,
    pub required_assets: Vec<ManifestAssetDto>,
    pub total_download_size_bytes: i64,
    pub is_canary: bool,
}

#[derive(Debug, Serialize)]
pub struct ManifestSyncResponseDto {
    pub is_up_to_date: bool,
    pub manifest: Option<CompiledManifestDto>,
}
