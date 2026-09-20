use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct LayoutEntity {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub canvas_width: i32,
    pub canvas_height: i32,
    pub orientation: String, // 'landscape' or 'portrait'
    pub background_color: String,
    pub background_image_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ZoneEntity {
    pub id: Uuid,
    pub layout_id: Uuid,
    pub name: String,
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
    pub z_index: i32,
    pub background_color: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ZoneBlockEntity {
    pub id: Uuid,
    pub zone_id: Uuid,
    pub playlist_id: Option<Uuid>,
    pub media_item_id: Option<Uuid>,
    pub start_time_seconds: i32,
    pub duration_seconds: i32,
    pub transition_type: Option<String>,
    pub order_index: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ZonePlaylistItemOverrideEntity {
    pub id: Uuid,
    pub zone_block_id: Uuid,
    pub playlist_item_id: Uuid,
    pub is_muted: Option<bool>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ZoneBlockDto {
    #[serde(flatten)]
    pub block: ZoneBlockEntity,
    pub item_overrides: Vec<ZonePlaylistItemOverrideEntity>,
}

// Keep old names as type aliases for backwards compat during migration
pub type ZonePlaylistEntity = ZoneBlockEntity;
pub type ZonePlaylistDto = ZoneBlockDto;

#[derive(Debug, Serialize, Deserialize)]
pub struct ZoneWithBlocksDto {
    #[serde(flatten)]
    pub zone: ZoneEntity,
    pub blocks: Vec<ZoneBlockDto>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LayoutWithZonesDto {
    #[serde(flatten)]
    pub layout: LayoutEntity,
    pub zones: Vec<ZoneWithBlocksDto>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLayoutDto {
    pub name: String,
    pub description: Option<String>,
    pub canvas_width: Option<i32>,
    pub canvas_height: Option<i32>,
    pub orientation: Option<String>,
    pub background_color: Option<String>,
    pub background_image_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLayoutDto {
    pub name: Option<String>,
    pub description: Option<String>,
    pub canvas_width: Option<i32>,
    pub canvas_height: Option<i32>,
    pub orientation: Option<String>,
    pub background_color: Option<String>,
    pub background_image_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateZoneDto {
    pub layout_id: Uuid,
    pub name: Option<String>,
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
    pub z_index: Option<i32>,
    pub background_color: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateZoneDto {
    pub name: Option<String>,
    pub x: Option<i32>,
    pub y: Option<i32>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub z_index: Option<i32>,
    pub background_color: Option<String>,
}
