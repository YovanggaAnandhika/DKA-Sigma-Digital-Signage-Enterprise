use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserEntity {
    pub id: Uuid,
    pub corporation_id: Uuid,
    pub branch_id: Option<Uuid>,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub full_name: String,
    pub is_active: bool,
    pub created_by_user_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Default)]
pub struct CreateUserDto {
    pub corporation_id: Option<Uuid>,
    pub branch_id: Option<Uuid>,
    pub email: String,
    pub password: String,
    pub full_name: String,
    pub role_ids: Option<Vec<Uuid>>,
    pub role_group_ids: Option<Vec<Uuid>>,
    pub created_by_user_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserDto {
    pub full_name: Option<String>,
    pub is_active: Option<bool>,
    pub role_ids: Option<Vec<Uuid>>,
    pub role_group_ids: Option<Vec<Uuid>>,
}

#[derive(Debug, Deserialize)]
pub struct LoginDto {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponseDto {
    pub token: String,
    pub user: UserEntity,
    pub permissions: Vec<String>,
}
