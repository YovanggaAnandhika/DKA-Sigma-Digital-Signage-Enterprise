use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct BranchEntity {
    pub id: Uuid,
    pub corporation_id: Uuid,
    pub name: String,
    pub code: String,
    pub address: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Default)]
pub struct CreateBranchDto {
    pub corporation_id: Uuid,
    pub name: String,
    pub code: String,
    pub address: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBranchDto {
    pub name: Option<String>,
    pub code: Option<String>,
    pub address: Option<String>,
    pub is_active: Option<bool>,
}

