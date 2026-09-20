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
    AddPlaylistBlockRequest, UpdatePlaylistBlockRequest, RemovePlaylistBlockRequest, PlaylistBlockResponse, ZonePlaylist
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

        let zones = dto.zones.into_iter().map(Self::map_zone_with_blocks).collect();

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

    fn map_zone_with_blocks(dto: crate::modules::studio::layout::model::ZoneWithBlocksDto) -> Zone {
        Zone {
            id: dto.zone.id.to_string(),
            layout_id: dto.zone.layout_id.to_string(),
            name: dto.zone.name,
            x: dto.zone.x,
            y: dto.zone.y,
            width: dto.zone.width,
            height: dto.zone.height,
            z_index: dto.zone.z_index,
            background_color: dto.zone.background_color,
            blocks: dto.blocks.into_iter().map(|b| ZonePlaylist {
                id: b.id.to_string(),
                zone_id: b.zone_id.to_string(),
                playlist_id: b.playlist_id.to_string(),
                playlist: None,
                start_time_seconds: b.start_time_seconds,
                duration_seconds: b.duration_seconds,
                transition_type: b.transition_type.unwrap_or_default(),
                order_index: b.order_index,
                created_at: b.created_at.to_rfc3339(),
            }).collect(),
            created_at: dto.zone.created_at.to_rfc3339(),
            updated_at: dto.zone.updated_at.to_rfc3339(),
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
            .map_err(|e| Status::internal(e.to_string()))?;

        let full_dto = LayoutService::get_layout_by_id(&self.pool, layout.id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

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
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Self::map_layout_with_zones(dto)))
    }

    async fn list_layouts(
        &self,
        request: Request<ListLayoutsRequest>,
    ) -> Result<Response<ListLayoutsResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_view_layouts")?;
        let layouts = LayoutService::list_layouts(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        let mut items = Vec::new();
        for l in layouts {
            let dto = LayoutService::get_layout_by_id(&self.pool, l.id)
                .await
                .map_err(|e| Status::internal(e.to_string()))?;
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
            .map_err(|e| Status::internal(e.to_string()))?;

        let full_dto = LayoutService::get_layout_by_id(&self.pool, layout_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

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
            .map_err(|e| Status::internal(e.to_string()))?;

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

        let dto = CreateZoneDto {
            layout_id,
            name: if req.name.is_empty() { None } else { Some(req.name) },
            x: req.x,
            y: req.y,
            width: req.width,
            height: req.height,
            z_index: Some(req.z_index),
            background_color: if req.background_color.is_empty() { None } else { Some(req.background_color) },
        };

        let zone = LayoutService::create_zone(&self.pool, dto)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        let zone_dto = crate::modules::studio::layout::model::ZoneWithBlocksDto {
            zone,
            blocks: vec![],
        };

        Ok(Response::new(Self::map_zone_with_blocks(zone_dto)))
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
            .map_err(|e| Status::internal(e.to_string()))?;

        let blocks = sqlx::query_as::<_, crate::modules::studio::layout::model::ZonePlaylistEntity>(
            "SELECT * FROM zone_playlists WHERE zone_id = $1 ORDER BY order_index ASC"
        ).bind(zone.id).fetch_all(&self.pool).await.unwrap_or_default();

        let zone_dto = crate::modules::studio::layout::model::ZoneWithBlocksDto { zone, blocks };

        Ok(Response::new(Self::map_zone_with_blocks(zone_dto)))
    }

    async fn update_zone(
        &self,
        request: Request<UpdateZoneRequest>,
    ) -> Result<Response<Zone>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();
        let zone_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Zone tidak valid"))?;

        let dto = UpdateZoneDto {
            name: if req.name.is_empty() { None } else { Some(req.name) },
            x: if req.width > 0 { Some(req.x) } else { None },
            y: if req.height > 0 { Some(req.y) } else { None },
            width: if req.width > 0 { Some(req.width) } else { None },
            height: if req.height > 0 { Some(req.height) } else { None },
            z_index: Some(req.z_index),
            background_color: if req.background_color.is_empty() { None } else { Some(req.background_color) },
        };

        let zone = LayoutService::update_zone(&self.pool, zone_id, dto)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        // For update and get, we should really fetch blocks.
        // Let's refetch from layout to get blocks, but for now we'll just return empty blocks.
        // Wait, better to query the blocks here.
        let blocks = sqlx::query_as::<_, crate::modules::studio::layout::model::ZonePlaylistEntity>(
            "SELECT * FROM zone_playlists WHERE zone_id = $1 ORDER BY order_index ASC"
        ).bind(zone.id).fetch_all(&self.pool).await.unwrap_or_default();

        let zone_dto = crate::modules::studio::layout::model::ZoneWithBlocksDto { zone, blocks };

        Ok(Response::new(Self::map_zone_with_blocks(zone_dto)))
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
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(DeleteZoneResponse { success }))
    }

    async fn add_playlist_block(
        &self,
        request: Request<AddPlaylistBlockRequest>,
    ) -> Result<Response<PlaylistBlockResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();
        let zone_id = Uuid::parse_str(&req.zone_id)
            .map_err(|_| Status::invalid_argument("ID Zone tidak valid"))?;
        let playlist_id = Uuid::parse_str(&req.playlist_id)
            .map_err(|_| Status::invalid_argument("ID Playlist tidak valid"))?;

        let block = crate::modules::studio::layout::repositories::LayoutRepository::add_playlist_block(
            &self.pool,
            zone_id,
            playlist_id,
            req.start_time_seconds,
            if req.duration_seconds > 0 { req.duration_seconds } else { 10 },
        )
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(PlaylistBlockResponse {
            success: true,
            block: Some(ZonePlaylist {
                id: block.id.to_string(),
                zone_id: block.zone_id.to_string(),
                playlist_id: block.playlist_id.to_string(),
                playlist: None,
                start_time_seconds: block.start_time_seconds,
                duration_seconds: block.duration_seconds,
                transition_type: block.transition_type.unwrap_or_default(),
                order_index: block.order_index,
                created_at: block.created_at.to_rfc3339(),
            }),
        }))
    }

    async fn update_playlist_block(
        &self,
        request: Request<UpdatePlaylistBlockRequest>,
    ) -> Result<Response<PlaylistBlockResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();
        let block_id = Uuid::parse_str(&req.block_id)
            .map_err(|_| Status::invalid_argument("ID Block tidak valid"))?;

        let block = crate::modules::studio::layout::repositories::LayoutRepository::update_playlist_block(
            &self.pool,
            block_id,
            Some(req.start_time_seconds),
            if req.duration_seconds > 0 { Some(req.duration_seconds) } else { None },
            if req.transition_type.is_empty() { None } else { Some(req.transition_type) },
            if req.order_index > 0 { Some(req.order_index) } else { None },
        )
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(PlaylistBlockResponse {
            success: true,
            block: Some(ZonePlaylist {
                id: block.id.to_string(),
                zone_id: block.zone_id.to_string(),
                playlist_id: block.playlist_id.to_string(),
                playlist: None,
                start_time_seconds: block.start_time_seconds,
                duration_seconds: block.duration_seconds,
                transition_type: block.transition_type.unwrap_or_default(),
                order_index: block.order_index,
                created_at: block.created_at.to_rfc3339(),
            }),
        }))
    }

    async fn remove_playlist_block(
        &self,
        request: Request<RemovePlaylistBlockRequest>,
    ) -> Result<Response<PlaylistBlockResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();
        let block_id = Uuid::parse_str(&req.block_id)
            .map_err(|_| Status::invalid_argument("ID Block tidak valid"))?;

        let success = crate::modules::studio::layout::repositories::LayoutRepository::remove_playlist_block(&self.pool, block_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(PlaylistBlockResponse {
            success,
            block: None,
        }))
    }
}
