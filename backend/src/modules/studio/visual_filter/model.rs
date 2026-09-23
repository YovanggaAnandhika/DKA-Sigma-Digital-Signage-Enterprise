use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct VisualFilter {
    pub id: Uuid,
    pub name: String,
    pub brightness: i32,
    pub contrast: i32,
    pub saturation: i32,
    pub hue_rotate: i32,
    pub blur_px: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
