use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::modules::common::orientation::model::OrientationEntity;
use crate::modules::studio::layer::layer::model::LayerWithBlocksDto;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct LayoutEntity {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub canvas_width: i32,
    pub canvas_height: i32,
    pub orientation_id: Uuid,
    pub background_color: String,
    pub background_image_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LayoutWithLayersDto {
    #[serde(flatten)]
    pub layout: LayoutEntity,
    pub orientation: Option<OrientationEntity>,
    pub layers: Vec<LayerWithBlocksDto>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLayoutDto {
    pub name: String,
    pub description: Option<String>,
    pub canvas_width: Option<i32>,
    pub canvas_height: Option<i32>,
    pub orientation_id: Uuid,
    pub background_color: Option<String>,
    pub background_image_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLayoutDto {
    pub name: Option<String>,
    pub description: Option<String>,
    pub canvas_width: Option<i32>,
    pub canvas_height: Option<i32>,
    pub orientation_id: Option<Uuid>,
    pub background_color: Option<String>,
    pub background_image_url: Option<String>,
}
