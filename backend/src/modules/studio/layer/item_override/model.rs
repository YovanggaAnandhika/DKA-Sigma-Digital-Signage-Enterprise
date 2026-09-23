use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::FromRow;

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
pub struct CreateLayerItemOverrideDto {
    pub layer_block_id: Uuid,
    pub playlist_item_id: Uuid,
    pub is_muted: bool,
    pub volume_level: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateLayerItemOverrideDto {
    pub is_muted: Option<bool>,
    pub volume_level: Option<i32>,
}
