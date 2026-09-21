use chrono::{DateTime, NaiveTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ScheduleEntity {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ScheduleEventEntity {
    pub id: Uuid,
    pub schedule_id: Uuid,
    pub layout_id: Uuid,
    pub start_time: NaiveTime,
    pub end_time: NaiveTime,
    pub days_of_week: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduleWithEventsDto {
    #[serde(flatten)]
    pub schedule: ScheduleEntity,
    pub events: Vec<ScheduleEventEntity>,
}

#[derive(Debug, Deserialize)]
pub struct CreateScheduleDto {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateScheduleDto {
    pub name: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AddScheduleEventDto {
    pub schedule_id: Uuid,
    pub layout_id: Uuid,
    pub start_time: String,
    pub end_time: String,
    pub days_of_week: String,
}
