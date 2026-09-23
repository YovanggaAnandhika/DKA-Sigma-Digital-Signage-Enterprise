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
    DeleteDeviceResponse,
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

        Device {
            id: dev.id.to_string(),
            name: dev.name,
            pairing_code: dev.pairing_code,
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
            is_online: dev.is_online,
            last_heartbeat_at: dev.last_heartbeat_at.map(|t| t.to_rfc3339()).unwrap_or_default(),
            created_at: dev.created_at.to_rfc3339(),
            updated_at: dev.updated_at.to_rfc3339(),
            display_group_id: dev.display_group_id.map(|id| id.to_string()).unwrap_or_default(),
            schedule_id: dev.schedule_id.map(|id| id.to_string()).unwrap_or_default(),
            timezone: dev.timezone,
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
            mac_address: if req.mac_address.is_empty() { None } else { Some(req.mac_address) },
            app_version: if req.app_version.is_empty() { None } else { Some(req.app_version) },
            android_version: if req.android_version.is_empty() { None } else { Some(req.android_version) },
            screen_width: Some(req.screen_width),
            screen_height: Some(req.screen_height),
            orientation: Some(orientation_str),
        };

        let device = DeviceService::register_device(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(RegisterDeviceResponse {
            device_id: device.id.to_string(),
            pairing_code: device.pairing_code,
            expires_in_seconds: 3600,
        }))
    }

    async fn pair_device(
        &self,
        request: Request<PairDeviceRequest>,
    ) -> Result<Response<PairDeviceResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let req = request.into_inner();

        let default_layout_id = if req.default_layout_id.is_empty() {
            None
        } else {
            Uuid::parse_str(&req.default_layout_id).ok()
        };

        let canary_group_id = if req.canary_group_id.is_empty() {
            None
        } else {
            Uuid::parse_str(&req.canary_group_id).ok()
        };

        let dto = PairDeviceDto {
            pairing_code: req.pairing_code,
            device_name: req.device_name,
            store_location: if req.store_location.is_empty() { None } else { Some(req.store_location) },
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

        let dto = HeartbeatDto {
            device_id,
            device_token: req.device_token,
            storage_free_bytes: Some(req.storage_free_bytes),
            storage_total_bytes: Some(req.storage_total_bytes),
            memory_percent: Some(req.memory_usage_percent),
            current_playing_media_id,
            active_layout_id,
            active_manifest_hash: if req.active_manifest_hash.is_empty() { None } else { Some(req.active_manifest_hash) },
        };

        DeviceService::process_heartbeat(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(HeartbeatResponse {
            acknowledged: true,
            needs_manifest_sync: false,
            server_time: chrono::Utc::now().to_rfc3339(),
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

        Ok(Response::new(Self::map_device_entity(dev)))
    }

    async fn list_devices(
        &self,
        request: Request<ListDevicesRequest>,
    ) -> Result<Response<ListDevicesResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let devices = DeviceService::list_devices(&self.pool)
            .await
            .map_err(Status::from)?;

        let items = devices.into_iter().map(Self::map_device_entity).collect();

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
}
