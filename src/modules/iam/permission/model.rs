use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PermissionEntity {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub module: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePermissionDto {
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub module: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePermissionDto {
    pub name: Option<String>,
    pub description: Option<String>,
    pub module: Option<String>,
}
