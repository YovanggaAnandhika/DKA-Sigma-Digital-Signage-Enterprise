use super::model::{
    CreateLayerDto, LayerEntity, UpdateLayerDto, LayerBlockEntity, LayerPlaylistItemOverrideEntity
};
use super::repositories::LayerRepository;
use crate::db::DbPool;
use crate::common::AppError;
use uuid::Uuid;

pub struct LayerService;

impl LayerService {
    pub async fn create_layer(pool: &DbPool, dto: CreateLayerDto) -> Result<LayerEntity, AppError> {
        let layer = LayerRepository::create_layer(pool, dto).await?;
        Ok(layer)
    }

    pub async fn get_layer_by_id(pool: &DbPool, id: Uuid) -> Result<LayerEntity, AppError> {
        let layer = LayerRepository::find_layer_by_id(pool, id)
            .await?
            .ok_or_else(|| AppError::NotFound("Layer not found".to_string()))?;
        Ok(layer)
    }

    pub async fn update_layer(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateLayerDto,
    ) -> Result<LayerEntity, AppError> {
        let layer = LayerRepository::update_layer(pool, id, dto).await?;
        Ok(layer)
    }

    pub async fn delete_layer(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let success = LayerRepository::delete_layer(pool, id).await?;
        Ok(success)
    }

    
    
    
    
    
    pub async fn create_block(pool: &DbPool, dto: super::model::CreateLayerBlockDto) -> Result<LayerBlockEntity, AppError> {
        let block = LayerRepository::create_block(pool, dto).await?;
        Ok(block)
    }

    pub async fn update_block(pool: &DbPool, id: Uuid, dto: super::model::UpdateLayerBlockDto) -> Result<LayerBlockEntity, AppError> {
        let block = LayerRepository::update_block(pool, id, dto).await?;
        Ok(block)
    }

    pub async fn delete_block(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let success = LayerRepository::delete_block(pool, id).await?;
        Ok(success)
    }
pub async fn set_playlist_item_override(
        pool: &DbPool,
        layer_playlist_id: Uuid,
        playlist_item_id: Uuid,
        is_muted: bool,
        volume_level: Option<i32>,
    ) -> Result<LayerPlaylistItemOverrideEntity, AppError> {
        let override_ent = LayerRepository::set_playlist_item_override(
            pool,
            layer_playlist_id,
            playlist_item_id,
            is_muted,
            volume_level,
        ).await?;
        Ok(override_ent)
    }
}
