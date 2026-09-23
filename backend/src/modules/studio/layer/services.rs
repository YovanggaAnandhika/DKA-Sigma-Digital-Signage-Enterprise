use super::model::{
    CreateLayerDto, LayerEntity, UpdateLayerDto, LayerBlockEntity, LayerPlaylistItemOverrideEntity
};
use super::repositories::LayerRepository;
use crate::db::DbPool;
use crate::error::AppError;
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

    pub async fn add_playlist_block(
        pool: &DbPool,
        layer_id: Uuid,
        playlist_id: Uuid,
        start_time_seconds: i32,
        duration_seconds: i32,
    ) -> Result<LayerBlockEntity, AppError> {
        let block = LayerRepository::add_playlist_block(
            pool,
            layer_id,
            playlist_id,
            start_time_seconds,
            duration_seconds,
        ).await?;
        Ok(block)
    }

    pub async fn add_media_block(
        pool: &DbPool,
        layer_id: Uuid,
        media_item_id: Uuid,
        start_time_seconds: i32,
        duration_seconds: i32,
    ) -> Result<LayerBlockEntity, AppError> {
        let block = LayerRepository::add_media_block(
            pool,
            layer_id,
            media_item_id,
            start_time_seconds,
            duration_seconds,
        ).await?;
        Ok(block)
    }

    pub async fn update_playlist_block(
        pool: &DbPool,
        id: Uuid,
        start_time_seconds: Option<i32>,
        duration_seconds: Option<i32>,
        transition_type: Option<String>,
        order_index: Option<i32>,
        is_muted: Option<bool>,
        volume_level: Option<i32>,
    ) -> Result<LayerBlockEntity, AppError> {
        let block = LayerRepository::update_playlist_block(
            pool,
            id,
            start_time_seconds,
            duration_seconds,
            transition_type,
            order_index,
            is_muted,
            volume_level,
        ).await?;
        Ok(block)
    }

    pub async fn remove_playlist_block(pool: &DbPool, block_id: Uuid) -> Result<bool, AppError> {
        let success = LayerRepository::remove_playlist_block(pool, block_id).await?;
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
