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
    ServerCommandType, ReportPlaybackBatchRequest, ReportPlaybackBatchResponse,
    ListPlaybackLogsRequest, ListPlaybackLogsResponse, PlaybackRecord,
    ListDeviceScreenshotsRequest, ListDeviceScreenshotsResponse, DeviceScreenshotItem,
    GetLatestDeviceTelemetryRequest, GetLatestDeviceTelemetryResponse, LatestTelemetryData,
    UploadScreenshotRequest, UploadScreenshotResponse,
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
                    timed_msg = tokio::time::timeout(tokio::time::Duration::from_secs(45), in_stream.message()) => {
                        match timed_msg {
                            Ok(Ok(Some(client_msg))) => {
                                if let Ok(dev_id) = Uuid::parse_str(&client_msg.device_id) {
                                    if registered_device_id.is_none() {
                                        registered_device_id = Some(dev_id);
                                        manager.register_connection(dev_id, tx.clone()).await;
                                        let _ = sqlx::query("UPDATE devices SET is_online = TRUE, last_heartbeat_at = NOW() WHERE id = $1")
                                            .bind(dev_id)
                                            .execute(&pool)
                                            .await;
                                    }

                                    // Handle stream client payload (Ping telemetry, Screenshot upload, Command ACK)
                                    if let Some(payload) = client_msg.payload {
                                        match payload {
                                            crate::grpc::proto::distribution::v1::stream::stream_client_message::Payload::Ping(ping) => {
                                                let _ = sqlx::query("UPDATE devices SET is_online = TRUE, last_heartbeat_at = NOW() WHERE id = $1")
                                                    .bind(dev_id)
                                                    .execute(&pool)
                                                    .await;

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
                                            crate::grpc::proto::distribution::v1::stream::stream_client_message::Payload::Screenshot(screenshot) => {
                                                if !screenshot.image_data.is_empty() {
                                                    let upload_dir = std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "./uploads".to_string());
                                                    let screenshots_dir = std::path::Path::new(&upload_dir).join("screenshots");
                                                    let _ = tokio::fs::create_dir_all(&screenshots_dir).await;

                                                    let filename = format!("{}_{}.jpg", dev_id, chrono::Utc::now().timestamp_millis());
                                                    let file_path = screenshots_dir.join(&filename);
                                                    if let Ok(_) = tokio::fs::write(&file_path, &screenshot.image_data).await {
                                                        let file_url = format!("/api/assets/screenshots/{}", filename);
                                                        let _ = sqlx::query(
                                                            "INSERT INTO device_screenshots (device_id, file_url) VALUES ($1, $2)"
                                                        )
                                                        .bind(dev_id)
                                                        .bind(file_url)
                                                        .execute(&pool)
                                                        .await;
                                                    }
                                                }
                                            }
                                            crate::grpc::proto::distribution::v1::stream::stream_client_message::Payload::CommandAck(ack) => {
                                                tracing::info!("Received command ACK from device {}: success={}, msg={}", dev_id, ack.success, ack.error_message);
                                            }
                                        }
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
                            Ok(Ok(None)) | Ok(Err(_)) => {
                                if let Some(id) = registered_device_id {
                                    manager.unregister_connection(&id).await;
                                    let _ = sqlx::query("UPDATE devices SET is_online = FALSE WHERE id = $1")
                                        .bind(id)
                                        .execute(&pool)
                                        .await;
                                }
                                break;
                            }
                            Err(_) => {
                                // 45s socket timeout: player stopped pinging (dead connection or dropped wifi/cell)
                                tracing::warn!("Dead socket detected: device {:?} inactive for 45s, disconnecting", registered_device_id);
                                if let Some(id) = registered_device_id {
                                    manager.unregister_connection(&id).await;
                                    let _ = sqlx::query("UPDATE devices SET is_online = FALSE WHERE id = $1")
                                        .bind(id)
                                        .execute(&pool)
                                        .await;
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
                            let _ = sqlx::query("UPDATE devices SET is_online = FALSE WHERE id = $1")
                                .bind(id)
                                .execute(&pool)
                                .await;
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

    async fn report_playback_batch(
        &self,
        request: Request<ReportPlaybackBatchRequest>,
    ) -> Result<Response<ReportPlaybackBatchResponse>, Status> {
        let req = request.into_inner();
        let device_id = Uuid::parse_str(&req.device_id)
            .map_err(|_| Status::invalid_argument("ID Device tidak valid"))?;

        let mut recorded = 0;
        for item in req.items {
            let media_id = Uuid::parse_str(&item.media_id).ok();
            let layout_id = Uuid::parse_str(&item.layout_id).ok();
            let started_at = chrono::DateTime::from_timestamp(item.started_at, 0)
                .unwrap_or_else(|| chrono::Utc::now());

            let res = sqlx::query(
                r#"
                INSERT INTO playback_logs (device_id, media_id, layout_id, started_at, duration_seconds, is_completed)
                VALUES ($1, $2, $3, $4, $5, $6)
                "#,
            )
            .bind(device_id)
            .bind(media_id)
            .bind(layout_id)
            .bind(started_at)
            .bind(item.duration_seconds)
            .bind(item.is_completed)
            .execute(&self.pool)
            .await;

            if res.is_ok() {
                recorded += 1;
            }
        }

        Ok(Response::new(ReportPlaybackBatchResponse {
            success: true,
            recorded_count: recorded,
        }))
    }

    async fn list_playback_logs(
        &self,
        request: Request<ListPlaybackLogsRequest>,
    ) -> Result<Response<ListPlaybackLogsResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_distribution")
            .or_else(|_| crate::grpc::middleware::require_permission(&request, "can_manage_devices"))?;
        let req = request.into_inner();

        let device_id = req.device_id.as_deref().and_then(|id| Uuid::parse_str(id).ok());
        let media_id = req.media_id.as_deref().and_then(|id| Uuid::parse_str(id).ok());
        let limit = if req.limit <= 0 || req.limit > 100 { 50 } else { req.limit as i64 };
        let offset = if req.offset < 0 { 0 } else { req.offset as i64 };

        #[derive(sqlx::FromRow)]
        struct Row {
            id: Uuid,
            device_id: Uuid,
            device_name: Option<String>,
            media_id: Option<Uuid>,
            media_name: Option<String>,
            layout_id: Option<Uuid>,
            layout_name: Option<String>,
            started_at: chrono::DateTime<chrono::Utc>,
            duration_seconds: i32,
            is_completed: bool,
            total_count: Option<i64>,
        }

        let rows = sqlx::query_as::<_, Row>(
            r#"
            SELECT 
                l.id,
                l.device_id,
                d.name as device_name,
                l.media_id,
                m.name as media_name,
                l.layout_id,
                lay.name as layout_name,
                l.started_at,
                l.duration_seconds,
                l.is_completed,
                COUNT(*) OVER() as total_count
            FROM playback_logs l
            LEFT JOIN devices d ON d.id = l.device_id
            LEFT JOIN media_items m ON m.id = l.media_id
            LEFT JOIN layouts lay ON lay.id = l.layout_id
            WHERE ($1::uuid IS NULL OR l.device_id = $1)
              AND ($2::uuid IS NULL OR l.media_id = $2)
            ORDER BY l.started_at DESC
            LIMIT $3 OFFSET $4
            "#,
        )
        .bind(device_id)
        .bind(media_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let total_count = rows.first().and_then(|r| r.total_count).unwrap_or(0) as i32;

        let items = rows.into_iter().map(|r| PlaybackRecord {
            id: r.id.to_string(),
            device_id: r.device_id.to_string(),
            device_name: r.device_name.unwrap_or_default(),
            media_id: r.media_id.map(|id| id.to_string()).unwrap_or_default(),
            media_name: r.media_name.unwrap_or_default(),
            layout_id: r.layout_id.map(|id| id.to_string()).unwrap_or_default(),
            layout_name: r.layout_name.unwrap_or_default(),
            started_at: r.started_at.to_rfc3339(),
            duration_seconds: r.duration_seconds,
            is_completed: r.is_completed,
        }).collect();

        Ok(Response::new(ListPlaybackLogsResponse {
            items,
            total_count,
        }))
    }

    async fn list_device_screenshots(
        &self,
        request: Request<ListDeviceScreenshotsRequest>,
    ) -> Result<Response<ListDeviceScreenshotsResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_devices")
            .or_else(|_| crate::grpc::middleware::require_permission(&request, "can_manage_distribution"))?;
        let req = request.into_inner();
        let device_id = Uuid::parse_str(&req.device_id)
            .map_err(|_| Status::invalid_argument("ID Device tidak valid"))?;
        let limit = if req.limit <= 0 || req.limit > 50 { 10 } else { req.limit as i64 };

        #[derive(sqlx::FromRow)]
        struct ScreenshotRow {
            id: Uuid,
            device_id: Uuid,
            file_url: String,
            captured_at: chrono::DateTime<chrono::Utc>,
        }

        let rows = sqlx::query_as::<_, ScreenshotRow>(
            r#"
            SELECT id, device_id, file_url, captured_at
            FROM device_screenshots
            WHERE device_id = $1
            ORDER BY captured_at DESC
            LIMIT $2
            "#,
        )
        .bind(device_id)
        .bind(limit)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let items = rows.into_iter().map(|r| DeviceScreenshotItem {
            id: r.id.to_string(),
            device_id: r.device_id.to_string(),
            file_url: r.file_url,
            captured_at: r.captured_at.to_rfc3339(),
        }).collect();

        Ok(Response::new(ListDeviceScreenshotsResponse { items }))
    }

    async fn get_latest_device_telemetry(
        &self,
        request: Request<GetLatestDeviceTelemetryRequest>,
    ) -> Result<Response<GetLatestDeviceTelemetryResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_devices")
            .or_else(|_| crate::grpc::middleware::require_permission(&request, "can_manage_distribution"))?;
        let req = request.into_inner();
        let device_id = Uuid::parse_str(&req.device_id)
            .map_err(|_| Status::invalid_argument("ID Device tidak valid"))?;

        #[derive(sqlx::FromRow)]
        struct TelemetryRow {
            memory_percent: Option<i32>,
            storage_free_bytes: Option<i64>,
            storage_total_bytes: Option<i64>,
            ip_address: Option<String>,
            current_playing_media_id: Option<Uuid>,
            created_at: chrono::DateTime<chrono::Utc>,
        }

        let row = sqlx::query_as::<_, TelemetryRow>(
            r#"
            SELECT memory_percent, storage_free_bytes, storage_total_bytes, ip_address, current_playing_media_id, created_at
            FROM device_telemetry
            WHERE device_id = $1
            ORDER BY created_at DESC
            LIMIT 1
            "#,
        )
        .bind(device_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let telemetry = row.map(|r| LatestTelemetryData {
            memory_percent: r.memory_percent.unwrap_or(0),
            storage_free_bytes: r.storage_free_bytes.unwrap_or(0),
            storage_total_bytes: r.storage_total_bytes.unwrap_or(0),
            ip_address: r.ip_address.unwrap_or_default(),
            current_playing_media_id: r.current_playing_media_id.map(|id| id.to_string()).unwrap_or_default(),
            reported_at: r.created_at.to_rfc3339(),
        });

        Ok(Response::new(GetLatestDeviceTelemetryResponse { telemetry }))
    }

    async fn upload_screenshot(
        &self,
        request: Request<UploadScreenshotRequest>,
    ) -> Result<Response<UploadScreenshotResponse>, Status> {
        let req = request.into_inner();
        let device_id = Uuid::parse_str(&req.device_id)
            .map_err(|_| Status::invalid_argument("ID Device tidak valid"))?;

        if req.image_data.is_empty() {
            return Err(Status::invalid_argument("Data gambar kosong"));
        }

        let upload_dir = std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "./uploads".to_string());
        let screenshots_dir = std::path::Path::new(&upload_dir).join("screenshots");
        let _ = tokio::fs::create_dir_all(&screenshots_dir).await;

        let filename = format!("{}_{}.jpg", device_id, chrono::Utc::now().timestamp_millis());
        let file_path = screenshots_dir.join(&filename);
        tokio::fs::write(&file_path, &req.image_data)
            .await
            .map_err(|e| Status::internal(format!("Gagal menyimpan file screenshot: {}", e)))?;

        let file_url = format!("/api/assets/screenshots/{}", filename);
        sqlx::query(
            "INSERT INTO device_screenshots (device_id, file_url) VALUES ($1, $2)"
        )
        .bind(device_id)
        .bind(&file_url)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("Gagal mencatat screenshot ke database: {}", e)))?;

        Ok(Response::new(UploadScreenshotResponse {
            success: true,
            file_url,
        }))
    }
}
