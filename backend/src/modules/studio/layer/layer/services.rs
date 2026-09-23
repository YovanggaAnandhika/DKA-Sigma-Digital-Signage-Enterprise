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

    
    
    
    
    
    

}
