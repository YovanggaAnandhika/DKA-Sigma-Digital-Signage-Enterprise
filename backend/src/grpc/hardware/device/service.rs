use tonic::{Request, Response, Status};
use uuid::Uuid;
use crate::db::DbPool;
use crate::modules::hardware::device::model::{DeviceEntity, HeartbeatDto, PairDeviceDto, RegisterDeviceDto, UpdateDeviceDto};
use crate::modules::hardware::device::repositories::DeviceRepository;
use crate::modules::hardware::device::services::DeviceService;
use crate::grpc::proto::hardware::v1::device::{
    device_service_server::DeviceService as DeviceServiceTrait,
    Device, DeviceOrientation, GetDeviceRequest, HeartbeatRequest, HeartbeatResponse,
    ListDevicesRequest, ListDevicesResponse, PairDeviceRequest, PairDeviceResponse,
    RegisterDeviceRequest, RegisterDeviceResponse, UpdateDeviceRequest, DeleteDeviceRequest,
    DeleteDeviceResponse, CheckPairingStatusRequest, CheckPairingStatusResponse,
    IngestDeviceAnalyticsRequest, IngestDeviceAnalyticsResponse,
    IngestDeviceAnalyticsBatchRequest, IngestDeviceAnalyticsBatchResponse,
    GetDeviceAnalyticsHistoryRequest, GetDeviceAnalyticsHistoryResponse,
    DeviceAnalyticsRecord,
};

pub struct DeviceServiceImpl {
    pub pool: DbPool,
}

impl DeviceServiceImpl {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    fn map_device_entity(dev: DeviceEntity) -> Device {
        let orientation = match dev.orientation.to_lowercase().as_str() {
            "portrait" => DeviceOrientation::OrientationPortrait as i32,
            _ => DeviceOrientation::OrientationLandscape as i32,
        };

        let is_online = if let Some(last_hb) = dev.last_heartbeat_at {
            let elapsed = chrono::Utc::now().signed_duration_since(last_hb);
            dev.is_online && elapsed.num_seconds() >= 0 && elapsed.num_seconds() <= 10
        } else {
            false
        };

        Device {
            id: dev.id.to_string(),
            name: dev.name,
            pairing_code: "".to_string(),
            is_paired: dev.is_paired,
            device_token: "".to_string(),
            screen_width: dev.screen_width,
            screen_height: dev.screen_height,
            orientation,
            ip_address: dev.ip_address.unwrap_or_default(),
            mac_address: dev.mac_address.unwrap_or_default(),
            app_version: dev.app_version.unwrap_or_default(),
            android_version: dev.android_version.unwrap_or_default(),
            storage_total_bytes: dev.storage_total_bytes,
            storage_free_bytes: dev.storage_free_bytes,
            current_layout_id: dev.current_layout_id.map(|id| id.to_string()).unwrap_or_default(),
            current_layout_name: "".to_string(),
            canary_group_id: dev.canary_group_id.map(|id| id.to_string()).unwrap_or_default(),
            is_online,
            last_heartbeat_at: dev.last_heartbeat_at.map(|t| t.to_rfc3339()).unwrap_or_default(),
            created_at: dev.created_at.to_rfc3339(),
            updated_at: dev.updated_at.to_rfc3339(),
            display_group_id: dev.display_group_id.map(|id| id.to_string()).unwrap_or_default(),
            schedule_id: dev.schedule_id.map(|id| id.to_string()).unwrap_or_default(),
            timezone: dev.timezone,
            sleep_time: dev.sleep_time.map(|t| t.format("%H:%M:%S").to_string()),
            wake_time: dev.wake_time.map(|t| t.format("%H:%M:%S").to_string()),
            power_schedule_enabled: dev.power_schedule_enabled,
            hardware_fingerprint: dev.hardware_fingerprint.unwrap_or_default(),
        }
    }
}

#[tonic::async_trait]
impl DeviceServiceTrait for DeviceServiceImpl {
    async fn register_device(
        &self,
        request: Request<RegisterDeviceRequest>,
    ) -> Result<Response<RegisterDeviceResponse>, Status> {
        let req = request.into_inner();
        let orientation_str = match req.orientation() {
            DeviceOrientation::OrientationPortrait => "portrait".to_string(),
            _ => "landscape".to_string(),
        };

        let dto = RegisterDeviceDto {
            name: req.device_name.filter(|s| !s.trim().is_empty()),
            mac_address: if req.mac_address.is_empty() { None } else { Some(req.mac_address) },
            hardware_fingerprint: if req.hardware_fingerprint.is_empty() { None } else { Some(req.hardware_fingerprint) },
            ip_address: if req.ip_address.is_empty() { None } else { Some(req.ip_address) },
            app_version: if req.app_version.is_empty() { None } else { Some(req.app_version) },
            android_version: if req.android_version.is_empty() { None } else { Some(req.android_version) },
            screen_width: Some(req.screen_width),
            screen_height: Some(req.screen_height),
            orientation: Some(orientation_str),
        };

        let (device, is_paired, token_opt, pairing_code) = DeviceService::register_device(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(RegisterDeviceResponse {
            device_id: device.id.to_string(),
            is_paired,
            device_token: token_opt.unwrap_or_default(),
            pairing_code,
        }))
    }

    async fn pair_device(
        &self,
        request: Request<PairDeviceRequest>,
    ) -> Result<Response<PairDeviceResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let req = request.into_inner();

        let device_id = if !req.device_id.is_empty() {
            Uuid::parse_str(&req.device_id)
                .map_err(|_| Status::invalid_argument("ID Device tidak valid"))?
        } else if let Some(code) = req.pairing_code.as_deref().filter(|s| !s.is_empty()) {
            let (dev, _) = crate::modules::hardware::device::repositories::DeviceRepository::find_pending_pairing(&self.pool, code)
                .await
                .map_err(|e| Status::internal(e.to_string()))?
                .ok_or_else(|| Status::not_found("Kode pairing tidak valid atau kadaluarsa"))?;
            dev.id
        } else {
            return Err(Status::invalid_argument("device_id diperlukan untuk menyetujui layar"));
        };

        let default_layout_id = req.default_layout_id.as_deref().and_then(|s| Uuid::parse_str(s).ok());
        let canary_group_id = req.canary_group_id.as_deref().and_then(|s| Uuid::parse_str(s).ok());

        let dto = PairDeviceDto {
            device_id,
            pairing_code: req.pairing_code,
            device_name: req.device_name,
            store_location: req.store_location,
            default_layout_id,
            canary_group_id,
        };

        let res = DeviceService::pair_device(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        let mut proto_dev = Self::map_device_entity(res.device);
        proto_dev.device_token = res.device_token.clone();

        Ok(Response::new(PairDeviceResponse {
            success: true,
            device: Some(proto_dev),
            device_token: res.device_token,
        }))
    }

    async fn check_pairing_status(
        &self,
        request: Request<CheckPairingStatusRequest>,
    ) -> Result<Response<CheckPairingStatusResponse>, Status> {
        let req = request.into_inner();
        let dev_id_opt = if !req.device_id.is_empty() { Some(req.device_id.as_str()) } else { None };
        let code_opt = req.pairing_code.as_deref();

        let status_opt = DeviceService::get_pairing_status(&self.pool, dev_id_opt, code_opt)
            .await
            .map_err(Status::from)?;

        if let Some((device_id, status, token_opt)) = status_opt {
            let is_paired = status == "paired";
            Ok(Response::new(CheckPairingStatusResponse {
                is_paired,
                device_id: device_id.to_string(),
                device_token: token_opt.unwrap_or_default(),
            }))
        } else {
            Ok(Response::new(CheckPairingStatusResponse {
                is_paired: false,
                device_id: String::new(),
                device_token: String::new(),
            }))
        }
    }

    async fn send_heartbeat(
        &self,
        request: Request<HeartbeatRequest>,
    ) -> Result<Response<HeartbeatResponse>, Status> {
        let req = request.into_inner();
        let device_id = Uuid::parse_str(&req.device_id)
            .map_err(|_| Status::invalid_argument("ID Device tidak valid"))?;

        let current_playing_media_id = if req.current_playing_media_id.is_empty() {
            None
        } else {
            Uuid::parse_str(&req.current_playing_media_id).ok()
        };

        let active_layout_id = if req.active_layout_id.is_empty() {
            None
        } else {
            Uuid::parse_str(&req.active_layout_id).ok()
        };

        let client_hash = if req.active_manifest_hash.is_empty() {
            None
        } else {
            Some(req.active_manifest_hash)
        };

        let dto = HeartbeatDto {
            device_id,
            device_token: req.device_token,
            storage_free_bytes: Some(req.storage_free_bytes),
            storage_total_bytes: Some(req.storage_total_bytes),
            memory_percent: Some(req.memory_usage_percent),
            current_playing_media_id,
            active_layout_id,
            active_manifest_hash: client_hash.clone(),
        };

        DeviceService::process_heartbeat(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        let mut needs_manifest_sync = match crate::modules::distribution::manifest::services::ManifestService::get_manifest_for_device(&self.pool, device_id, client_hash).await {
            Ok(res) => !res.is_up_to_date,
            Err(_) => false,
        };

        // Periksa apakah ada perintah tertunda (seperti CAPTURE_SCREENSHOT atau RELOAD_MANIFEST)
        let pending_command = if let Ok(Some(row)) = sqlx::query_scalar::<_, serde_json::Value>(
            "SELECT payload_json FROM hardware_device_telemetry WHERE device_id = $1 AND payload_json->>'command_type' IS NOT NULL AND (payload_json->>'consumed')::boolean IS NOT TRUE ORDER BY created_at DESC LIMIT 1"
        )
        .bind(device_id)
        .fetch_optional(&self.pool)
        .await {
            let cmd_type = row.get("command_type").and_then(|v| v.as_str()).map(|s| s.to_string());
            let cmd_id = row.get("command_id").and_then(|v| v.as_str()).map(|s| s.to_string());
            if let Some(cid) = cmd_id {
                let _ = sqlx::query("UPDATE hardware_device_telemetry SET payload_json = payload_json || '{\"consumed\": true}'::jsonb WHERE device_id = $1 AND payload_json->>'command_id' = $2")
                    .bind(device_id)
                    .bind(cid)
                    .execute(&self.pool)
                    .await;
            }
            if let Some(ref c) = cmd_type {
                if c.to_lowercase().contains("reload") {
                    needs_manifest_sync = true;
                }
            }
            cmd_type
        } else {
            None
        };

        Ok(Response::new(HeartbeatResponse {
            acknowledged: true,
            needs_manifest_sync,
            server_time: chrono::Utc::now().to_rfc3339(),
            pending_command,
        }))
    }

    async fn get_device(
        &self,
        request: Request<GetDeviceRequest>,
    ) -> Result<Response<Device>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let req = request.into_inner();
        let device_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Device tidak valid"))?;

        let dev = DeviceService::get_device_by_id(&self.pool, device_id)
            .await
            .map_err(Status::from)?;

        let mut proto = Self::map_device_entity(dev);
        if !proto.is_paired {
            if let Ok(Some(code)) = sqlx::query_scalar::<_, String>(
                "SELECT pairing_code FROM hardware_device_pairings WHERE device_id = $1 AND status = 'pending' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1"
            )
            .bind(device_id)
            .fetch_optional(&self.pool)
            .await {
                proto.pairing_code = code;
            }
        }

        Ok(Response::new(proto))
    }

    async fn list_devices(
        &self,
        request: Request<ListDevicesRequest>,
    ) -> Result<Response<ListDevicesResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let devices = DeviceService::list_devices(&self.pool)
            .await
            .map_err(Status::from)?;

        let mut items = Vec::new();
        for dev in devices {
            let mut proto = Self::map_device_entity(dev);
            if !proto.is_paired {
                if let Ok(dev_uuid) = Uuid::parse_str(&proto.id) {
                    if let Ok(Some(code)) = sqlx::query_scalar::<_, String>(
                        "SELECT pairing_code FROM hardware_device_pairings WHERE device_id = $1 AND status = 'pending' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1"
                    )
                    .bind(dev_uuid)
                    .fetch_optional(&self.pool)
                    .await {
                        proto.pairing_code = code;
                    }
                }
            }
            items.push(proto);
        }

        Ok(Response::new(ListDevicesResponse {
            items,
            pagination: None,
        }))
    }

    async fn update_device(
        &self,
        request: Request<UpdateDeviceRequest>,
    ) -> Result<Response<Device>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let req = request.into_inner();
        let device_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Device tidak valid"))?;

        let orientation_str = match req.orientation() {
            DeviceOrientation::OrientationPortrait => Some("portrait".to_string()),
            DeviceOrientation::OrientationLandscape => Some("landscape".to_string()),
            _ => None,
        };

        let current_layout_id = if req.current_layout_id.is_empty() {
            None
        } else {
            Uuid::parse_str(&req.current_layout_id).ok()
        };

        let canary_group_id = if req.canary_group_id.is_empty() {
            None
        } else {
            Uuid::parse_str(&req.canary_group_id).ok()
        };

        let display_group_id = if req.display_group_id.is_empty() {
            None
        } else {
            Uuid::parse_str(&req.display_group_id).ok()
        };

        let schedule_id = if req.schedule_id.is_empty() {
            None
        } else {
            Uuid::parse_str(&req.schedule_id).ok()
        };

        let dto = UpdateDeviceDto {
            name: if req.name.is_empty() { None } else { Some(req.name) },
            screen_width: if req.screen_width > 0 { Some(req.screen_width) } else { None },
            screen_height: if req.screen_height > 0 { Some(req.screen_height) } else { None },
            orientation: orientation_str,
            current_layout_id,
            canary_group_id,
            display_group_id,
            schedule_id,
            timezone: if req.timezone.is_empty() { None } else { Some(req.timezone) },
            sleep_time: req.sleep_time,
            wake_time: req.wake_time,
            power_schedule_enabled: req.power_schedule_enabled,
        };

        let dev = DeviceService::update_device(&self.pool, device_id, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_device_entity(dev)))
    }

    async fn delete_device(
        &self,
        request: Request<DeleteDeviceRequest>,
    ) -> Result<Response<DeleteDeviceResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let req = request.into_inner();
        let device_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Device tidak valid"))?;

        let success = DeviceService::delete_device(&self.pool, device_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(DeleteDeviceResponse { success }))
    }

    async fn ingest_device_analytics(
        &self,
        request: Request<IngestDeviceAnalyticsRequest>,
    ) -> Result<Response<IngestDeviceAnalyticsResponse>, Status> {
        let req = request.into_inner();
        let device_id = Uuid::parse_str(&req.device_id)
            .map_err(|_| Status::invalid_argument("ID Device tidak valid"))?;

        if let Some(snap) = req.snapshot {
            let snap_id = if snap.id.is_empty() {
                Uuid::new_v4()
            } else {
                Uuid::parse_str(&snap.id).unwrap_or_else(|_| Uuid::new_v4())
            };

            let io_json: serde_json::Value = serde_json::from_str(&snap.input_output_json)
                .unwrap_or_else(|_| serde_json::json!({}));
            let assets_json: serde_json::Value = serde_json::from_str(&snap.assets_stats_json)
                .unwrap_or_else(|_| serde_json::json!({}));
            let recorded_at = chrono::DateTime::parse_from_rfc3339(&snap.recorded_at)
                .map(|dt| dt.with_timezone(&chrono::Utc))
                .unwrap_or_else(|_| chrono::Utc::now());

            let _ = sqlx::query(
                r#"
                INSERT INTO hardware_device_analytics (id, device_id, input_output, assets_stats, recorded_at)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO NOTHING
                "#,
            )
            .bind(snap_id)
            .bind(device_id)
            .bind(io_json)
            .bind(assets_json)
            .bind(recorded_at)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(format!("Gagal menyimpan analitik: {}", e)))?;
        }

        Ok(Response::new(IngestDeviceAnalyticsResponse { success: true }))
    }

    async fn ingest_device_analytics_batch(
        &self,
        request: Request<IngestDeviceAnalyticsBatchRequest>,
    ) -> Result<Response<IngestDeviceAnalyticsBatchResponse>, Status> {
        let req = request.into_inner();
        let device_id = Uuid::parse_str(&req.device_id)
            .map_err(|_| Status::invalid_argument("ID Device tidak valid"))?;

        let mut inserted_count = 0;
        for snap in req.snapshots {
            let snap_id = if snap.id.is_empty() {
                Uuid::new_v4()
            } else {
                Uuid::parse_str(&snap.id).unwrap_or_else(|_| Uuid::new_v4())
            };

            let io_json: serde_json::Value = serde_json::from_str(&snap.input_output_json)
                .unwrap_or_else(|_| serde_json::json!({}));
            let assets_json: serde_json::Value = serde_json::from_str(&snap.assets_stats_json)
                .unwrap_or_else(|_| serde_json::json!({}));
            let recorded_at = chrono::DateTime::parse_from_rfc3339(&snap.recorded_at)
                .map(|dt| dt.with_timezone(&chrono::Utc))
                .unwrap_or_else(|_| chrono::Utc::now());

            let res = sqlx::query(
                r#"
                INSERT INTO hardware_device_analytics (id, device_id, input_output, assets_stats, recorded_at)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO NOTHING
                "#,
            )
            .bind(snap_id)
            .bind(device_id)
            .bind(io_json)
            .bind(assets_json)
            .bind(recorded_at)
            .execute(&self.pool)
            .await;

            if let Ok(r) = res {
                inserted_count += r.rows_affected() as i32;
            }
        }

        Ok(Response::new(IngestDeviceAnalyticsBatchResponse {
            success: true,
            inserted_count,
        }))
    }

    async fn get_device_analytics_history(
        &self,
        request: Request<GetDeviceAnalyticsHistoryRequest>,
    ) -> Result<Response<GetDeviceAnalyticsHistoryResponse>, Status> {
        let req = request.into_inner();
        let device_id = Uuid::parse_str(&req.device_id)
            .map_err(|_| Status::invalid_argument("ID Device tidak valid"))?;

        let limit = if req.limit <= 0 || req.limit > 500 { 100 } else { req.limit as i64 };

        let interval_str = match req.time_range.as_str() {
            "15m" => "15 minutes",
            "1h" => "1 hour",
            "6h" => "6 hours",
            "24h" => "24 hours",
            "7d" => "7 days",
            _ => "1 hour",
        };

        #[derive(sqlx::FromRow)]
        struct AnalyticsRow {
            id: Uuid,
            device_id: Uuid,
            input_output: serde_json::Value,
            assets_stats: serde_json::Value,
            recorded_at: chrono::DateTime<chrono::Utc>,
        }

        let query = format!(
            r#"
            SELECT id, device_id, input_output, assets_stats, recorded_at
            FROM hardware_device_analytics
            WHERE device_id = $1
              AND recorded_at >= NOW() - INTERVAL '{}'
            ORDER BY recorded_at ASC
            LIMIT $2
            "#,
            interval_str
        );

        let rows = sqlx::query_as::<_, AnalyticsRow>(&query)
            .bind(device_id)
            .bind(limit)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| Status::internal(format!("Gagal mengambil histori analitik: {}", e)))?;

        let records = rows.into_iter().map(|r| DeviceAnalyticsRecord {
            id: r.id.to_string(),
            device_id: r.device_id.to_string(),
            input_output_json: r.input_output.to_string(),
            assets_stats_json: r.assets_stats.to_string(),
            recorded_at: r.recorded_at.to_rfc3339(),
        }).collect();

        Ok(Response::new(GetDeviceAnalyticsHistoryResponse { records }))
    }
}
