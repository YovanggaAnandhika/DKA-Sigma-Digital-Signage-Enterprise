use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MediaEntity {
    pub id: Uuid,
    pub name: String,
    pub original_filename: String,
    pub file_path: String,
    pub public_url: String,
    pub file_size_bytes: i64,
    pub mime_type: String,
    pub sha256_hash: String,
    pub media_type: String, // 'image', 'video', 'web'
    pub width: i32,
    pub height: i32,
    pub duration_seconds: i32,
    pub thumbnail_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMediaDto {
    pub name: String,
    pub original_filename: String,
    pub file_path: String,
    pub public_url: String,
    pub file_size_bytes: i64,
    pub mime_type: String,
    pub sha256_hash: String,
    pub media_type: String,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub duration_seconds: Option<i32>,
    pub thumbnail_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMediaDto {
    pub name: Option<String>,
    pub duration_seconds: Option<i32>,
}
