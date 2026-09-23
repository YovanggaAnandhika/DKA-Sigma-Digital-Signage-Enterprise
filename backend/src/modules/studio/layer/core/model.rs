use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct LayerEntity {
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
pub struct LayerBlockEntity {
    pub id: Uuid,
    pub layer_id: Uuid,
    pub playlist_id: Option<Uuid>,
    pub media_item_id: Option<Uuid>,
    pub start_time_seconds: i32,
    pub duration_seconds: i32,
    pub transition_type: Option<String>,
    pub order_index: i32,
    pub is_muted: bool,
    pub volume_level: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct LayerPlaylistItemOverrideEntity {
    pub id: Uuid,
    pub layer_block_id: Uuid,
    pub playlist_item_id: Uuid,
    pub is_muted: Option<bool>,
    pub volume_level: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayerBlockDto {
    #[serde(flatten)]
    pub block: LayerBlockEntity,
    pub item_overrides: Vec<LayerPlaylistItemOverrideEntity>,
}

pub type LayerPlaylistEntity = LayerBlockEntity;
pub type LayerPlaylistDto = LayerBlockDto;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayerWithBlocksDto {
    #[serde(flatten)]
    pub layer: LayerEntity,
    pub blocks: Vec<LayerBlockDto>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLayerDto {
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
pub struct UpdateLayerDto {
    pub name: Option<String>,
    pub x: Option<i32>,
    pub y: Option<i32>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub z_index: Option<i32>,
    pub background_color: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLayerBlockDto {
    pub layer_id: Uuid,
    pub playlist_id: Option<Uuid>,
    pub media_item_id: Option<Uuid>,
    pub start_time_seconds: i32,
    pub duration_seconds: i32,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLayerBlockDto {
    pub start_time_seconds: Option<i32>,
    pub duration_seconds: Option<i32>,
    pub transition_type: Option<String>,
    pub order_index: Option<i32>,
    pub is_muted: Option<bool>,
    pub volume_level: Option<i32>,
}
