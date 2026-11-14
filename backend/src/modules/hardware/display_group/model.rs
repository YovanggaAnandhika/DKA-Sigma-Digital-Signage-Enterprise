use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DisplayGroupEntity {
    pub id: Uuid,
    pub corporation_id: Uuid,
    pub branch_id: Option<Uuid>,
    pub name: String,
    pub description: Option<String>,
    pub default_layout_id: Option<Uuid>,
    pub default_layout_name: Option<String>,
    pub schedule_id: Option<Uuid>,
    pub schedule_name: Option<String>,
    pub schedule_assigned_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDisplayGroupDto {
    pub corporation_id: Uuid,
    pub branch_id: Option<Uuid>,
    pub user_id: Option<Uuid>,
    pub name: String,
    pub description: Option<String>,
    pub default_layout_id: Option<Uuid>,
    pub schedule_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDisplayGroupDto {
    pub name: Option<String>,
    pub description: Option<String>,
    pub default_layout_id: Option<Uuid>,
    pub schedule_id: Option<Uuid>,
}
