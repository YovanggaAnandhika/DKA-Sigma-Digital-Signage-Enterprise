use super::model::{
    LiveCommandType, PushCommandDto, PushCommandResultDto, ServerCommandMessage,
};
use super::repositories::StreamRepository;
use crate::common::AppError;
use crate::db::DbPool;
use chrono::Utc;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};
use uuid::Uuid;

pub type CommandSender = mpsc::Sender<ServerCommandMessage>;

#[derive(Clone, Default)]
pub struct StreamConnectionManager {
    // Map of device_id -> channel sender for live connected displays
    active_displays: Arc<Mutex<HashMap<Uuid, CommandSender>>>,
}

impl StreamConnectionManager {
    pub fn new() -> Self {
        Self {
            active_displays: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn register_connection(&self, device_id: Uuid, sender: CommandSender) {
        let mut map = self.active_displays.lock().await;
        map.insert(device_id, sender);
    }

    pub async fn unregister_connection(&self, device_id: &Uuid) {
        let mut map = self.active_displays.lock().await;
        map.remove(device_id);
    }

    pub async fn send_command(
        &self,
        pool: &DbPool,
        dto: PushCommandDto,
    ) -> Result<PushCommandResultDto, AppError> {
        let command = ServerCommandMessage {
            command_id: Uuid::new_v4(),
            device_id: dto.device_id,
            command_type: dto.command_type,
            payload_json: dto.payload_json,
            created_at: Utc::now().to_rfc3339(),
        };

        // Log to telemetry table
        let _ = StreamRepository::log_command(pool, &command).await;

        let map = self.active_displays.lock().await;
        if let Some(tx) = map.get(&dto.device_id) {
            let _ = tx.send(command.clone()).await;
            Ok(PushCommandResultDto {
                success: true,
                command_id: command.command_id,
                message: "Command pushed directly to live connected display".into(),
            })
        } else {
            Ok(PushCommandResultDto {
                success: false,
                command_id: command.command_id,
                message: "Display is currently offline; command queued in history".into(),
            })
        }
    }
}
