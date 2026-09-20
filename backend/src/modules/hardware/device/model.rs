use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DeviceEntity {
    pub id: Uuid,
    pub name: String,
    pub pairing_code: String,
    pub is_paired: bool,
    #[serde(skip_serializing)]
    pub device_token_hash: Option<String>,
    pub screen_width: i32,
    pub screen_height: i32,
    pub orientation: String,
    pub ip_address: Option<String>,
    pub mac_address: Option<String>,
    pub app_version: Option<String>,
    pub android_version: Option<String>,
    pub storage_total_bytes: i64,
    pub storage_free_bytes: i64,
    pub current_layout_id: Option<Uuid>,
    pub canary_group_id: Option<Uuid>,
    pub is_online: bool,
    pub last_heartbeat_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterDeviceDto {
    pub mac_address: Option<String>,
    pub app_version: Option<String>,
    pub android_version: Option<String>,
    pub screen_width: Option<i32>,
    pub screen_height: Option<i32>,
    pub orientation: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PairDeviceDto {
    pub pairing_code: String,
    pub device_name: String,
    pub default_layout_id: Option<Uuid>,
    pub canary_group_id: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct PairDeviceResultDto {
    pub device: DeviceEntity,
    pub device_token: String,
}

#[derive(Debug, Deserialize)]
pub struct HeartbeatDto {
    pub device_id: Uuid,
    pub device_token: String,
    pub storage_free_bytes: Option<i64>,
    pub storage_total_bytes: Option<i64>,
    pub memory_percent: Option<i32>,
    pub current_playing_media_id: Option<Uuid>,
    pub active_layout_id: Option<Uuid>,
    pub active_manifest_hash: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDeviceDto {
    pub name: Option<String>,
    pub screen_width: Option<i32>,
    pub screen_height: Option<i32>,
    pub orientation: Option<String>,
    pub current_layout_id: Option<Uuid>,
    pub canary_group_id: Option<Uuid>,
}
