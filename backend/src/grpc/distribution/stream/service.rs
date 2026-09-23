use std::pin::Pin;
use tokio_stream::Stream;
use tonic::{Request, Response, Status, Streaming};
use uuid::Uuid;
use crate::db::DbPool;
use crate::modules::distribution::stream::model::{LiveCommandType, PushCommandDto};
use crate::modules::distribution::stream::services::StreamConnectionManager;
use crate::grpc::proto::distribution::v1::stream::{
    stream_service_server::StreamService as StreamServiceTrait,
    StreamClientMessage, StreamServerMessage, PushCommandRequest, PushCommandResponse,
    ServerCommandType,
};

pub struct StreamServiceImpl {
    pub pool: DbPool,
    pub manager: StreamConnectionManager,
}

impl StreamServiceImpl {
    pub fn new(pool: DbPool, manager: StreamConnectionManager) -> Self {
        Self { pool, manager }
    }
}

type DisplayStreamResponse = Pin<Box<dyn Stream<Item = Result<StreamServerMessage, Status>> + Send + 'static>>;

#[tonic::async_trait]
impl StreamServiceTrait for StreamServiceImpl {
    type DisplayStreamStream = DisplayStreamResponse;

    async fn display_stream(
        &self,
        request: Request<Streaming<StreamClientMessage>>,
    ) -> Result<Response<Self::DisplayStreamStream>, Status> {
        let mut in_stream = request.into_inner();
        let (tx, mut rx) = tokio::sync::mpsc::channel(32);

        let manager = self.manager.clone();
        let pool = self.pool.clone();

        let output_stream = async_stream::try_stream! {
            let mut registered_device_id: Option<Uuid> = None;

            loop {
                tokio::select! {
                    msg_res = in_stream.message() => {
                        match msg_res {
                            Ok(Some(client_msg)) => {
                                if let Ok(dev_id) = Uuid::parse_str(&client_msg.device_id) {
                                    if registered_device_id.is_none() {
                                        registered_device_id = Some(dev_id);
                                        manager.register_connection(dev_id, tx.clone()).await;
                                    }

                                    // Log ping telemetry to device_telemetry if ping message present
                                    if let Some(crate::grpc::proto::distribution::v1::stream::stream_client_message::Payload::Ping(ping)) = client_msg.payload {
                                        let telemetry_json = serde_json::json!({
                                            "memory_percent": ping.memory_percent,
                                            "storage_free_bytes": ping.storage_free_bytes,
                                            "current_playing_media_id": ping.current_playing_media_id,
                                        });

                                        let _ = sqlx::query(
                                            "INSERT INTO device_telemetry (device_id, payload_json) VALUES ($1, $2)"
                                        )
                                        .bind(dev_id)
                                        .bind(telemetry_json)
                                        .execute(&pool)
                                        .await;
                                    }
                                }

                                // Acknowledge received message to keep stream alive
                                yield StreamServerMessage {
                                    message_id: Uuid::new_v4().to_string(),
                                    timestamp: chrono::Utc::now().timestamp_millis(),
                                    command_type: ServerCommandType::CommandUnspecified as i32,
                                    payload_json: String::new(),
                                };
                            }
                            Ok(None) | Err(_) => {
                                if let Some(id) = registered_device_id {
                                    manager.unregister_connection(&id).await;
                                }
                                break;
                            }
                        }
                    }
                    Some(server_cmd) = rx.recv() => {
                        let cmd_type = match server_cmd.command_type {
                            LiveCommandType::ReloadManifest => ServerCommandType::CommandReloadManifest as i32,
                            LiveCommandType::CaptureScreenshot => ServerCommandType::CommandCaptureScreenshot as i32,
                            LiveCommandType::RebootPlayer => ServerCommandType::CommandRebootPlayer as i32,
                            LiveCommandType::EmergencyBroadcast => ServerCommandType::CommandEmergencyBroadcast as i32,
                            LiveCommandType::ClearCache => ServerCommandType::CommandClearCache as i32,
                        };

                        yield StreamServerMessage {
                            message_id: server_cmd.command_id.to_string(),
                            timestamp: chrono::Utc::now().timestamp_millis(),
                            command_type: cmd_type,
                            payload_json: server_cmd.payload_json.unwrap_or_default(),
                        };
                    }
                    else => {
                        if let Some(id) = registered_device_id {
                            manager.unregister_connection(&id).await;
                        }
                        break;
                    }
                }
            }
        };

        Ok(Response::new(Box::pin(output_stream) as DisplayStreamResponse))
    }

    async fn push_command(
        &self,
        request: Request<PushCommandRequest>,
    ) -> Result<Response<PushCommandResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_distribution")?;
        let req = request.into_inner();
        let device_id = Uuid::parse_str(&req.device_id)
            .map_err(|_| Status::invalid_argument("ID Device tidak valid"))?;

        let cmd_type = match req.command_type() {
            ServerCommandType::CommandReloadManifest => LiveCommandType::ReloadManifest,
            ServerCommandType::CommandCaptureScreenshot => LiveCommandType::CaptureScreenshot,
            ServerCommandType::CommandRebootPlayer => LiveCommandType::RebootPlayer,
            ServerCommandType::CommandEmergencyBroadcast => LiveCommandType::EmergencyBroadcast,
            ServerCommandType::CommandClearCache => LiveCommandType::ClearCache,
            _ => LiveCommandType::ReloadManifest,
        };

        let dto = PushCommandDto {
            device_id,
            command_type: cmd_type,
            payload_json: if req.payload_json.is_empty() { None } else { Some(req.payload_json) },
        };

        let res = self.manager.send_command(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(PushCommandResponse {
            queued: true,
            command_id: res.command_id.to_string(),
        }))
    }
}
