use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CanaryGroupEntity {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub rollout_percentage: i32,
    pub is_active: bool,
    pub target_layout_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCanaryGroupDto {
    pub name: String,
    pub description: Option<String>,
    pub rollout_percentage: Option<i32>,
    pub is_active: Option<bool>,
    pub target_layout_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCanaryGroupDto {
    pub name: Option<String>,
    pub description: Option<String>,
    pub rollout_percentage: Option<i32>,
    pub is_active: Option<bool>,
    pub target_layout_id: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct CanaryEvaluationResult {
    pub is_in_canary: bool,
    pub effective_layout_id: Uuid,
    pub canary_group_id: Option<Uuid>,
}
