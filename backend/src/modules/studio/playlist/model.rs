use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PlaylistEntity {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub is_shuffle: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PlaylistItemEntity {
    pub id: Uuid,
    pub playlist_id: Uuid,
    pub media_item_id: Uuid,
    pub position: i32,
    pub duration_seconds: i32,
    pub transition_type: String,
    pub is_muted: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaylistWithItemsDto {
    #[serde(flatten)]
    pub playlist: PlaylistEntity,
    pub items: Vec<PlaylistItemWithMediaDto>,
    pub total_duration_seconds: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PlaylistItemWithMediaDto {
    pub id: Uuid,
    pub playlist_id: Uuid,
    pub media_item_id: Uuid,
    pub media_name: String,
    pub media_url: String,
    pub media_type: String,
    pub position: i32,
    pub duration_seconds: i32,
    pub transition_type: String,
    pub is_muted: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreatePlaylistDto {
    pub name: String,
    pub description: Option<String>,
    pub is_shuffle: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePlaylistDto {
    pub name: Option<String>,
    pub description: Option<String>,
    pub is_shuffle: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct AddPlaylistItemDto {
    pub playlist_id: Uuid,
    pub media_item_id: Uuid,
    pub duration_seconds: Option<i32>,
    pub transition_type: Option<String>,
    pub position: Option<i32>,
    pub is_muted: Option<bool>,
}
