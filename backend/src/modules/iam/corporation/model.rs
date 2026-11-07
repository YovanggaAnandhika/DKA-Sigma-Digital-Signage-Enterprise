use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CorporationEntity {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub active_until: Option<DateTime<Utc>>,
    pub max_screens: i32,
    pub max_branches: i32,
    pub subscription_tier: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Default)]
pub struct CreateCorporationDto {
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub active_until: Option<DateTime<Utc>>,
    pub max_screens: Option<i32>,
    pub max_branches: Option<i32>,
    pub subscription_tier: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCorporationDto {
    pub name: Option<String>,
    pub description: Option<String>,
    pub active_until: Option<DateTime<Utc>>,
    pub max_screens: Option<i32>,
    pub max_branches: Option<i32>,
    pub subscription_tier: Option<String>,
    pub is_active: Option<bool>,
}

