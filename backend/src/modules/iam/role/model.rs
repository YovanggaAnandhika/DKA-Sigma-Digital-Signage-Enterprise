use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct RoleEntity {
    pub id: Uuid,
    pub corporation_id: Uuid,
    pub branch_id: Option<Uuid>,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub is_system: bool,
    pub created_by_user_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Default)]
pub struct CreateRoleDto {
    pub corporation_id: Option<Uuid>,
    pub branch_id: Option<Uuid>,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub permission_ids: Option<Vec<Uuid>>,
    pub created_by_user_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRoleDto {
    pub name: Option<String>,
    pub description: Option<String>,
    pub permission_ids: Option<Vec<Uuid>>,
}
