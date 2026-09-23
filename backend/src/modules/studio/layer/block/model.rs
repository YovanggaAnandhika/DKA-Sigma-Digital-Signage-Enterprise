use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct LayerBlockEntity {
    pub id: Uuid,
    pub layer_id: Uuid,
    pub playlist_id: Option<Uuid>,
    pub media_item_id: Option<Uuid>,
    pub start_time_seconds: i32,
    pub duration_seconds: i32,
    pub trim_start_seconds: i32,
    pub trim_end_seconds: Option<i32>,
    pub transition_id: Option<Uuid>,
    pub visual_filter_id: Option<Uuid>,
    pub order_index: i32,
    pub is_muted: bool,
    pub volume_level: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateLayerBlockDto {
    pub layer_id: Uuid,
    pub playlist_id: Option<Uuid>,
    pub media_item_id: Option<Uuid>,
    pub start_time_seconds: i32,
    pub duration_seconds: i32,
    pub trim_start_seconds: Option<i32>,
    pub trim_end_seconds: Option<i32>,
    pub transition_id: Option<Uuid>,
    pub visual_filter_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateLayerBlockDto {
    pub start_time_seconds: Option<i32>,
    pub duration_seconds: Option<i32>,
    pub trim_start_seconds: Option<i32>,
    pub trim_end_seconds: Option<i32>,
    pub transition_id: Option<Uuid>,
    pub visual_filter_id: Option<Uuid>,
    pub order_index: Option<i32>,
    pub is_muted: Option<bool>,
    pub volume_level: Option<i32>,
}
