use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LiveCommandType {
    ReloadManifest,
    CaptureScreenshot,
    RebootPlayer,
    EmergencyBroadcast,
    ClearCache,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerCommandMessage {
    pub command_id: Uuid,
    pub device_id: Uuid,
    pub command_type: LiveCommandType,
    pub payload_json: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct PushCommandDto {
    pub device_id: Uuid,
    pub command_type: LiveCommandType,
    pub payload_json: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PushCommandResultDto {
    pub success: bool,
    pub command_id: Uuid,
    pub message: String,
}
