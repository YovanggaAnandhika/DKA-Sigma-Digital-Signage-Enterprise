use tonic::{Request, Response, Status};
use uuid::Uuid;
use crate::db::DbPool;
use crate::grpc::proto::hardware::v1::device::DeviceOrientation;
use crate::modules::studio::layout::model::{CreateLayoutDto, CreateZoneDto, LayoutWithZonesDto, UpdateLayoutDto, UpdateZoneDto, ZoneEntity};
use crate::modules::studio::layout::services::LayoutService;
use crate::grpc::proto::studio::v1::layout::{
    layout_service_server::LayoutService as LayoutServiceTrait,
    Layout, Zone, CreateLayoutRequest, GetLayoutRequest,
    ListLayoutsRequest, ListLayoutsResponse, UpdateLayoutRequest,
    DeleteLayoutRequest, DeleteLayoutResponse, CreateZoneRequest,
    GetZoneRequest, UpdateZoneRequest, DeleteZoneRequest, DeleteZoneResponse,
    AssignPlaylistToZoneRequest, AssignPlaylistToZoneResponse,
};

pub struct LayoutServiceImpl {
    pub pool: DbPool,
}

impl LayoutServiceImpl {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    fn map_layout_with_zones(dto: LayoutWithZonesDto) -> Layout {
        let orientation = match dto.layout.orientation.to_lowercase().as_str() {
            "portrait" => crate::grpc::proto::hardware::v1::device::DeviceOrientation::OrientationPortrait as i32,
            _ => crate::grpc::proto::hardware::v1::device::DeviceOrientation::OrientationLandscape as i32,
        };

        let zones = dto.zones.into_iter().map(Self::map_zone_entity).collect();

        Layout {
            id: dto.layout.id.to_string(),
            name: dto.layout.name,
            description: dto.layout.description.unwrap_or_default(),
            canvas_width: dto.layout.canvas_width,
            canvas_height: dto.layout.canvas_height,
            orientation,
            background_color: dto.layout.background_color,
            background_image_url: dto.layout.background_image_url.unwrap_or_default(),
            zones,
            created_at: dto.layout.created_at.to_rfc3339(),
            updated_at: dto.layout.updated_at.to_rfc3339(),
        }
    }

    fn map_zone_entity(zone: ZoneEntity) -> Zone {
        Zone {
            id: zone.id.to_string(),
            layout_id: zone.layout_id.to_string(),
            name: zone.name,
            x: zone.x,
            y: zone.y,
            width: zone.width,
            height: zone.height,
            z_index: zone.z_index,
            assigned_playlist_id: zone.assigned_playlist_id.map(|id| id.to_string()).unwrap_or_default(),
            assigned_playlist: None,
            background_color: zone.background_color,
            created_at: zone.created_at.to_rfc3339(),
            updated_at: zone.updated_at.to_rfc3339(),
        }
    }
}

#[tonic::async_trait]
impl LayoutServiceTrait for LayoutServiceImpl {
    async fn create_layout(
        &self,
        request: Request<CreateLayoutRequest>,
    ) -> Result<Response<Layout>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();

        let orientation_str = match req.orientation() {
            crate::grpc::proto::hardware::v1::device::DeviceOrientation::OrientationPortrait => "portrait".to_string(),
            _ => "landscape".to_string(),
        };

        let dto = CreateLayoutDto {
            name: req.name,
            description: if req.description.is_empty() { None } else { Some(req.description) },
            canvas_width: if req.canvas_width > 0 { Some(req.canvas_width) } else { Some(1920) },
            canvas_height: if req.canvas_height > 0 { Some(req.canvas_height) } else { Some(1080) },
            orientation: Some(orientation_str),
            background_color: if req.background_color.is_empty() { None } else { Some(req.background_color) },
            background_image_url: if req.background_image_url.is_empty() { None } else { Some(req.background_image_url) },
        };

        let layout = LayoutService::create_layout(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        let full_dto = LayoutService::get_layout_by_id(&self.pool, layout.id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_layout_with_zones(full_dto)))
    }

    async fn get_layout(
        &self,
        request: Request<GetLayoutRequest>,
    ) -> Result<Response<Layout>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_view_layouts")?;
        let req = request.into_inner();
        let layout_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Layout tidak valid"))?;

        let dto = LayoutService::get_layout_by_id(&self.pool, layout_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_layout_with_zones(dto)))
    }

    async fn list_layouts(
        &self,
        request: Request<ListLayoutsRequest>,
    ) -> Result<Response<ListLayoutsResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_view_layouts")?;
        let layouts = LayoutService::list_layouts(&self.pool)
            .await
            .map_err(Status::from)?;

        let mut items = Vec::new();
        for l in layouts {
            let dto = LayoutService::get_layout_by_id(&self.pool, l.id)
                .await
                .map_err(Status::from)?;
            items.push(Self::map_layout_with_zones(dto));
        }

        Ok(Response::new(ListLayoutsResponse {
            items,
            pagination: None,
        }))
    }

    async fn update_layout(
        &self,
        request: Request<UpdateLayoutRequest>,
    ) -> Result<Response<Layout>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();
        let layout_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Layout tidak valid"))?;

        let orientation_str = match req.orientation() {
            crate::grpc::proto::hardware::v1::device::DeviceOrientation::OrientationPortrait => Some("portrait".to_string()),
            crate::grpc::proto::hardware::v1::device::DeviceOrientation::OrientationLandscape => Some("landscape".to_string()),
            _ => None,
        };

        let dto = UpdateLayoutDto {
            name: if req.name.is_empty() { None } else { Some(req.name) },
            description: if req.description.is_empty() { None } else { Some(req.description) },
            canvas_width: if req.canvas_width > 0 { Some(req.canvas_width) } else { None },
            canvas_height: if req.canvas_height > 0 { Some(req.canvas_height) } else { None },
            orientation: orientation_str,
            background_color: if req.background_color.is_empty() { None } else { Some(req.background_color) },
            background_image_url: if req.background_image_url.is_empty() { None } else { Some(req.background_image_url) },
        };

        LayoutService::update_layout(&self.pool, layout_id, dto)
            .await
            .map_err(Status::from)?;

        let full_dto = LayoutService::get_layout_by_id(&self.pool, layout_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_layout_with_zones(full_dto)))
    }

    async fn delete_layout(
        &self,
        request: Request<DeleteLayoutRequest>,
    ) -> Result<Response<DeleteLayoutResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();
        let layout_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Layout tidak valid"))?;

        let success = LayoutService::delete_layout(&self.pool, layout_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(DeleteLayoutResponse { success }))
    }

    async fn create_zone(
        &self,
        request: Request<CreateZoneRequest>,
    ) -> Result<Response<Zone>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();
        let layout_id = Uuid::parse_str(&req.layout_id)
            .map_err(|_| Status::invalid_argument("ID Layout tidak valid"))?;

        let assigned_playlist_id = if req.assigned_playlist_id.is_empty() {
            None
        } else {
            Uuid::parse_str(&req.assigned_playlist_id).ok()
        };

        let dto = CreateZoneDto {
            layout_id,
            name: if req.name.is_empty() { None } else { Some(req.name) },
            x: req.x,
            y: req.y,
            width: req.width,
            height: req.height,
            z_index: Some(req.z_index),
            assigned_playlist_id,
            background_color: if req.background_color.is_empty() { None } else { Some(req.background_color) },
        };

        let zone = LayoutService::create_zone(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_zone_entity(zone)))
    }

    async fn get_zone(
        &self,
        request: Request<GetZoneRequest>,
    ) -> Result<Response<Zone>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_view_layouts")?;
        let req = request.into_inner();
        let zone_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Zone tidak valid"))?;

        let zone = LayoutService::get_zone_by_id(&self.pool, zone_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_zone_entity(zone)))
    }

    async fn update_zone(
        &self,
        request: Request<UpdateZoneRequest>,
    ) -> Result<Response<Zone>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();
        let zone_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Zone tidak valid"))?;

        let assigned_playlist_id = if req.assigned_playlist_id.is_empty() {
            None
        } else {
            Uuid::parse_str(&req.assigned_playlist_id).ok()
        };

        let dto = UpdateZoneDto {
            name: if req.name.is_empty() { None } else { Some(req.name) },
            x: if req.width > 0 { Some(req.x) } else { None },
            y: if req.height > 0 { Some(req.y) } else { None },
            width: if req.width > 0 { Some(req.width) } else { None },
            height: if req.height > 0 { Some(req.height) } else { None },
            z_index: Some(req.z_index),
            assigned_playlist_id,
            background_color: if req.background_color.is_empty() { None } else { Some(req.background_color) },
        };

        let zone = LayoutService::update_zone(&self.pool, zone_id, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_zone_entity(zone)))
    }

    async fn delete_zone(
        &self,
        request: Request<DeleteZoneRequest>,
    ) -> Result<Response<DeleteZoneResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();
        let zone_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Zone tidak valid"))?;

        let success = LayoutService::delete_zone(&self.pool, zone_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(DeleteZoneResponse { success }))
    }

    async fn assign_playlist_to_zone(
        &self,
        request: Request<AssignPlaylistToZoneRequest>,
    ) -> Result<Response<AssignPlaylistToZoneResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();
        let zone_id = Uuid::parse_str(&req.zone_id)
            .map_err(|_| Status::invalid_argument("ID Zone tidak valid"))?;

        let assigned_playlist_id = if req.playlist_id.is_empty() {
            None
        } else {
            Uuid::parse_str(&req.playlist_id).ok()
        };

        let dto = UpdateZoneDto {
            name: None,
            x: None,
            y: None,
            width: None,
            height: None,
            z_index: None,
            assigned_playlist_id,
            background_color: None,
        };

        let zone = LayoutService::update_zone(&self.pool, zone_id, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(AssignPlaylistToZoneResponse {
            success: true,
            zone: Some(Self::map_zone_entity(zone)),
        }))
    }
}
