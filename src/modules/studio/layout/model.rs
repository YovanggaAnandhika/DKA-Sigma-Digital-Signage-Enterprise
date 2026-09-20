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
    pub assigned_playlist_id: Option<Uuid>,
    pub background_color: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LayoutWithZonesDto {
    #[serde(flatten)]
    pub layout: LayoutEntity,
    pub zones: Vec<ZoneEntity>,
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
    pub assigned_playlist_id: Option<Uuid>,
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
    pub assigned_playlist_id: Option<Uuid>,
    pub clear_playlist: bool,
    pub background_color: Option<String>,
}
