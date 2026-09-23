use sqlx::PgPool;
use std::str::FromStr;
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::grpc::proto::studio::v1::layer::{
    layer_service_server::LayerService as LayerServiceTrait,
    CreateLayerRequest, DeleteLayerRequest,
    DeleteLayerResponse, GetLayerRequest, Layer as ProtoLayer, LayerPlaylist,
    LayerPlaylistItemOverride,
    CreateLayerBlockRequest, UpdateLayerBlockRequest, DeleteLayerBlockRequest,
    LayerBlockResponse, DeleteLayerBlockResponse,
    SetPlaylistItemOverrideRequest, SetPlaylistItemOverrideResponse, UpdateLayerRequest,
};
use crate::grpc::proto::studio::v1::media::MediaItem as ProtoMediaItem;
use crate::grpc::proto::studio::v1::playlist::Playlist as ProtoPlaylist;

use crate::modules::studio::layer::{
    model::{CreateLayerDto, LayerBlockDto, UpdateLayerDto, CreateLayerBlockDto, UpdateLayerBlockDto},
    services::LayerService,
};

pub struct LayerServiceImpl {
    pub pool: PgPool,
}

impl LayerServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub fn map_layer_with_blocks(dto: crate::modules::studio::layer::model::LayerWithBlocksDto) -> ProtoLayer {
        ProtoLayer {
            id: dto.layer.id.to_string(),
            layout_id: dto.layer.layout_id.to_string(),
            name: dto.layer.name,
            x: dto.layer.x,
            y: dto.layer.y,
            width: dto.layer.width,
            height: dto.layer.height,
            z_index: dto.layer.z_index,
            background_color: dto.layer.background_color,
            created_at: dto.layer.created_at.to_rfc3339(),
            updated_at: dto.layer.updated_at.to_rfc3339(),
            blocks: dto.blocks.into_iter().map(Self::map_layer_block).collect(),
        }
    }

    pub fn map_layer_block(dto: LayerBlockDto) -> LayerPlaylist {
        LayerPlaylist {
            id: dto.block.id.to_string(),
            layer_id: dto.block.layer_id.to_string(),
            playlist_id: dto.block.playlist_id.map(|id| id.to_string()).unwrap_or_default(),
            playlist: None, // Filled later if needed via JOIN
            media_item_id: dto.block.media_item_id.map(|id| id.to_string()).unwrap_or_default(),
            media_item: None, // Filled later if needed via JOIN
            start_time_seconds: dto.block.start_time_seconds,
            duration_seconds: dto.block.duration_seconds,
            transition_type: dto.block.transition_type.unwrap_or_default(),
            order_index: dto.block.order_index,
            is_muted: dto.block.is_muted,
            volume_level: dto.block.volume_level,
            created_at: dto.block.created_at.to_rfc3339(),
            item_overrides: dto
                .item_overrides
                .into_iter()
                .map(|ov| LayerPlaylistItemOverride {
                    id: ov.id.to_string(),
                    layer_playlist_id: ov.layer_block_id.to_string(),
                    playlist_item_id: ov.playlist_item_id.to_string(),
                    is_muted: ov.is_muted.unwrap_or(false),
                    volume_level: ov.volume_level.unwrap_or(100),
                })
                .collect(),
        }
    }
}

#[tonic::async_trait]
impl LayerServiceTrait for LayerServiceImpl {
    async fn create_layer(
        &self,
        request: Request<CreateLayerRequest>,
    ) -> Result<Response<ProtoLayer>, Status> {
        let req = request.into_inner();
        let layout_id = Uuid::from_str(&req.layout_id)
            .map_err(|_| Status::invalid_argument("Invalid layout_id"))?;

        let dto = CreateLayerDto {
            layout_id,
            name: if req.name.is_empty() { None } else { Some(req.name) },
            x: req.x,
            y: req.y,
            width: req.width,
            height: req.height,
            z_index: Some(req.z_index),
            background_color: if req.background_color.is_empty() { None } else { Some(req.background_color) },
        };

        let layer = LayerService::create_layer(&self.pool, dto)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        let full_dto = crate::modules::studio::layer::model::LayerWithBlocksDto {
            layer,
            blocks: vec![],
        };

        Ok(Response::new(Self::map_layer_with_blocks(full_dto)))
    }

    async fn get_layer(
        &self,
        request: Request<GetLayerRequest>,
    ) -> Result<Response<ProtoLayer>, Status> {
        let req = request.into_inner();
        let layer_id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid layer id"))?;

        let layer = LayerService::get_layer_by_id(&self.pool, layer_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        let full_dto = crate::modules::studio::layer::model::LayerWithBlocksDto {
            layer,
            blocks: vec![],
        };

        Ok(Response::new(Self::map_layer_with_blocks(full_dto)))
    }

    async fn update_layer(
        &self,
        request: Request<UpdateLayerRequest>,
    ) -> Result<Response<ProtoLayer>, Status> {
        let req = request.into_inner();
        let layer_id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid layer id"))?;

        let dto = UpdateLayerDto {
            name: if req.name.is_empty() { None } else { Some(req.name) },
            x: Some(req.x),
            y: Some(req.y),
            width: Some(req.width),
            height: Some(req.height),
            z_index: Some(req.z_index),
            background_color: if req.background_color.is_empty() { None } else { Some(req.background_color) },
        };

        let layer = LayerService::update_layer(&self.pool, layer_id, dto)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        let full_dto = crate::modules::studio::layer::model::LayerWithBlocksDto {
            layer,
            blocks: vec![],
        };

        Ok(Response::new(Self::map_layer_with_blocks(full_dto)))
    }

    async fn delete_layer(
        &self,
        request: Request<DeleteLayerRequest>,
    ) -> Result<Response<DeleteLayerResponse>, Status> {
        let req = request.into_inner();
        let layer_id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid layer id"))?;

        let success = LayerService::delete_layer(&self.pool, layer_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(DeleteLayerResponse { success }))
    }

    async fn create_layer_block(
        &self,
        request: Request<CreateLayerBlockRequest>,
    ) -> Result<Response<LayerBlockResponse>, Status> {
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
        };

        let block = LayerService::create_block(&self.pool, dto)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        let block_dto = LayerBlockDto {
            block,
            item_overrides: vec![],
        };

        Ok(Response::new(LayerBlockResponse {
            success: true,
            block: Some(Self::map_layer_block(block_dto)),
        }))
    }

    async fn update_layer_block(
        &self,
        request: Request<UpdateLayerBlockRequest>,
    ) -> Result<Response<LayerBlockResponse>, Status> {
        let req = request.into_inner();
        let block_id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid block_id"))?;

        let dto = UpdateLayerBlockDto {
            start_time_seconds: req.start_time_seconds,
            duration_seconds: req.duration_seconds,
            transition_type: req.transition_type,
            order_index: req.order_index,
            is_muted: req.is_muted,
            volume_level: req.volume_level,
        };

        let block = LayerService::update_block(&self.pool, block_id, dto)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        let block_dto = LayerBlockDto {
            block,
            item_overrides: vec![],
        };

        Ok(Response::new(LayerBlockResponse {
            success: true,
            block: Some(Self::map_layer_block(block_dto)),
        }))
    }

    async fn delete_layer_block(
        &self,
        request: Request<DeleteLayerBlockRequest>,
    ) -> Result<Response<DeleteLayerBlockResponse>, Status> {
        let req = request.into_inner();
        let block_id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid block_id"))?;

        let success = LayerService::delete_block(&self.pool, block_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(DeleteLayerBlockResponse {
            success,
        }))
    }

    async fn set_playlist_item_override(
        &self,
        request: Request<SetPlaylistItemOverrideRequest>,
    ) -> Result<Response<SetPlaylistItemOverrideResponse>, Status> {
        let req = request.into_inner();
        let layer_playlist_id = Uuid::from_str(&req.layer_playlist_id)
            .map_err(|_| Status::invalid_argument("Invalid layer_playlist_id"))?;
        let playlist_item_id = Uuid::from_str(&req.playlist_item_id)
            .map_err(|_| Status::invalid_argument("Invalid playlist_item_id"))?;

        let override_ent = LayerService::set_playlist_item_override(
            &self.pool,
            layer_playlist_id,
            playlist_item_id,
            req.is_muted,
            req.volume_level,
        )
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(SetPlaylistItemOverrideResponse {
            success: true,
            override: Some(LayerPlaylistItemOverride {
                id: override_ent.id.to_string(),
                layer_playlist_id: override_ent.layer_block_id.to_string(),
                playlist_item_id: override_ent.playlist_item_id.to_string(),
                is_muted: override_ent.is_muted.unwrap_or(false),
                volume_level: override_ent.volume_level.unwrap_or(100),
            }),
        }))
    }
}
