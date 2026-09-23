use sqlx::PgPool;
use std::str::FromStr;
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::grpc::proto::studio::v1::layer::{
    layer_item_override_service_server::LayerItemOverrideService as LayerItemOverrideServiceTrait,
    CreateLayerItemOverrideRequest, DeleteLayerItemOverrideRequest,
    DeleteLayerItemOverrideResponse, GetLayerItemOverrideRequest, LayerPlaylistItemOverride as ProtoOverride,
    ListLayerItemOverridesRequest, ListLayerItemOverridesResponse, UpdateLayerItemOverrideRequest,
};

use crate::modules::studio::layer::item_override::{
    model::{CreateLayerItemOverrideDto, LayerPlaylistItemOverrideEntity, UpdateLayerItemOverrideDto},
    services::LayerItemOverrideService,
};

pub struct LayerItemOverrideServiceImpl {
    pub pool: PgPool,
}

impl LayerItemOverrideServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub fn map_override(ov: LayerPlaylistItemOverrideEntity) -> ProtoOverride {
        ProtoOverride {
            id: ov.id.to_string(),
            layer_playlist_id: ov.layer_block_id.to_string(),
            playlist_item_id: ov.playlist_item_id.to_string(),
            is_muted: ov.is_muted.unwrap_or(false),
            volume_level: ov.volume_level.unwrap_or(100),
        }
    }
}

#[tonic::async_trait]
impl LayerItemOverrideServiceTrait for LayerItemOverrideServiceImpl {
    async fn create_layer_item_override(
        &self,
        request: Request<CreateLayerItemOverrideRequest>,
    ) -> Result<Response<ProtoOverride>, Status> {
        let req = request.into_inner();
        let layer_block_id = Uuid::from_str(&req.layer_playlist_id)
            .map_err(|_| Status::invalid_argument("Invalid layer_playlist_id"))?;
        let playlist_item_id = Uuid::from_str(&req.playlist_item_id)
            .map_err(|_| Status::invalid_argument("Invalid playlist_item_id"))?;

        let dto = CreateLayerItemOverrideDto {
            layer_block_id,
            playlist_item_id,
            is_muted: req.is_muted,
            volume_level: req.volume_level,
        };

        let ov = LayerItemOverrideService::create(&self.pool, dto)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Self::map_override(ov)))
    }

    async fn get_layer_item_override(
        &self,
        request: Request<GetLayerItemOverrideRequest>,
    ) -> Result<Response<ProtoOverride>, Status> {
        let req = request.into_inner();
        let id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid id"))?;

        let ov = LayerItemOverrideService::get_by_id(&self.pool, id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Self::map_override(ov)))
    }

    async fn list_layer_item_overrides(
        &self,
        request: Request<ListLayerItemOverridesRequest>,
    ) -> Result<Response<ListLayerItemOverridesResponse>, Status> {
        let req = request.into_inner();
        let layer_playlist_id = req.layer_playlist_id.and_then(|id| Uuid::from_str(&id).ok());

        let (overrides, total) = LayerItemOverrideService::list(&self.pool, layer_playlist_id, req.page, req.limit)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(ListLayerItemOverridesResponse {
            overrides: overrides.into_iter().map(Self::map_override).collect(),
            total,
            page: req.page,
            limit: req.limit,
        }))
    }

    async fn update_layer_item_override(
        &self,
        request: Request<UpdateLayerItemOverrideRequest>,
    ) -> Result<Response<ProtoOverride>, Status> {
        let req = request.into_inner();
        let id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid id"))?;

        let dto = UpdateLayerItemOverrideDto {
            is_muted: req.is_muted,
            volume_level: req.volume_level,
        };

        let ov = LayerItemOverrideService::update(&self.pool, id, dto)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Self::map_override(ov)))
    }

    async fn delete_layer_item_override(
        &self,
        request: Request<DeleteLayerItemOverrideRequest>,
    ) -> Result<Response<DeleteLayerItemOverrideResponse>, Status> {
        let req = request.into_inner();
        let id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid id"))?;

        let success = LayerItemOverrideService::delete(&self.pool, id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(DeleteLayerItemOverrideResponse { success }))
    }
}
