use sqlx::PgPool;
use std::str::FromStr;
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::grpc::proto::studio::v1::layer::{
    layer_block_service_server::LayerBlockService as LayerBlockServiceTrait,
    CreateLayerBlockRequest, DeleteLayerBlockRequest,
    DeleteLayerBlockResponse, GetLayerBlockRequest, LayerPlaylist as ProtoLayerBlock,
    ListLayerBlocksRequest, ListLayerBlocksResponse, UpdateLayerBlockRequest,
};

use crate::modules::studio::layer::block::{
    model::{CreateLayerBlockDto, LayerBlockEntity, UpdateLayerBlockDto},
    services::LayerBlockService,
};

pub struct LayerBlockServiceImpl {
    pub pool: PgPool,
}

impl LayerBlockServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub fn map_layer_block(block: LayerBlockEntity) -> ProtoLayerBlock {
        ProtoLayerBlock {
            id: block.id.to_string(),
            layer_id: block.layer_id.to_string(),
            playlist_id: block.playlist_id.map(|id| id.to_string()).unwrap_or_default(),
            playlist: None,
            media_item_id: block.media_item_id.map(|id| id.to_string()).unwrap_or_default(),
            media_item: None,
            start_time_seconds: block.start_time_seconds,
            duration_seconds: block.duration_seconds,
            trim_start_seconds: block.trim_start_seconds,
            trim_end_seconds: block.trim_end_seconds,
            transition_id: block.transition_id.map(|id| id.to_string()),
            visual_filter_id: block.visual_filter_id.map(|id| id.to_string()),
            order_index: block.order_index,
            is_muted: block.is_muted,
            volume_level: block.volume_level,
            created_at: block.created_at.to_rfc3339(),
            item_overrides: vec![], // Populated elsewhere if needed
            transition: None,
            visual_filter: None,
        }
    }
}

#[tonic::async_trait]
impl LayerBlockServiceTrait for LayerBlockServiceImpl {
    async fn create_layer_block(
        &self,
        request: Request<CreateLayerBlockRequest>,
    ) -> Result<Response<ProtoLayerBlock>, Status> {
        let req = request.into_inner();
        let layer_id = Uuid::from_str(&req.layer_id)
            .map_err(|_| Status::invalid_argument("Invalid layer_id"))?;

        let playlist_id = req.playlist_id.and_then(|id| Uuid::from_str(&id).ok());
        let media_item_id = req.media_item_id.and_then(|id| Uuid::from_str(&id).ok());

        let dto = CreateLayerBlockDto {
            layer_id,
            playlist_id,
            media_item_id,
            start_time_seconds: req.start_time_seconds,
            duration_seconds: req.duration_seconds,
            trim_start_seconds: req.trim_start_seconds,
            trim_end_seconds: req.trim_end_seconds,
            transition_id: req.transition_id.and_then(|id| Uuid::from_str(&id).ok()),
            visual_filter_id: req.visual_filter_id.and_then(|id| Uuid::from_str(&id).ok()),
        };

        let block = LayerBlockService::create(&self.pool, dto)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Self::map_layer_block(block)))
    }

    async fn get_layer_block(
        &self,
        request: Request<GetLayerBlockRequest>,
    ) -> Result<Response<ProtoLayerBlock>, Status> {
        let req = request.into_inner();
        let id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid id"))?;

        let block = LayerBlockService::get_by_id(&self.pool, id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Self::map_layer_block(block)))
    }

    async fn list_layer_blocks(
        &self,
        request: Request<ListLayerBlocksRequest>,
    ) -> Result<Response<ListLayerBlocksResponse>, Status> {
        let req = request.into_inner();
        let layer_id = req.layer_id.and_then(|id| Uuid::from_str(&id).ok());

        let (blocks, total) = LayerBlockService::list(&self.pool, layer_id, req.page, req.limit)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(ListLayerBlocksResponse {
            blocks: blocks.into_iter().map(Self::map_layer_block).collect(),
            total,
            page: req.page,
            limit: req.limit,
        }))
    }

    async fn update_layer_block(
        &self,
        request: Request<UpdateLayerBlockRequest>,
    ) -> Result<Response<ProtoLayerBlock>, Status> {
        let req = request.into_inner();
        let id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid id"))?;

        let dto = UpdateLayerBlockDto {
            start_time_seconds: req.start_time_seconds,
            duration_seconds: req.duration_seconds,
            trim_start_seconds: req.trim_start_seconds,
            trim_end_seconds: req.trim_end_seconds,
            transition_id: req.transition_id.and_then(|id| Uuid::from_str(&id).ok()),
            visual_filter_id: req.visual_filter_id.and_then(|id| Uuid::from_str(&id).ok()),
            order_index: req.order_index,
            is_muted: req.is_muted,
            volume_level: req.volume_level,
        };

        let block = LayerBlockService::update(&self.pool, id, dto)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Self::map_layer_block(block)))
    }

    async fn delete_layer_block(
        &self,
        request: Request<DeleteLayerBlockRequest>,
    ) -> Result<Response<DeleteLayerBlockResponse>, Status> {
        let req = request.into_inner();
        let id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid id"))?;

        let success = LayerBlockService::delete(&self.pool, id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(DeleteLayerBlockResponse { success }))
    }
}
