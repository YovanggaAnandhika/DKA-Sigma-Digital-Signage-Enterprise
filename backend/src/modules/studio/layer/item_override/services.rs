use sqlx::PgPool;
use uuid::Uuid;
use crate::common::AppError;
use super::model::{LayerPlaylistItemOverrideEntity, CreateLayerItemOverrideDto, UpdateLayerItemOverrideDto};
use super::repositories::LayerItemOverrideRepository;

pub struct LayerItemOverrideService;

impl LayerItemOverrideService {
    pub async fn create(pool: &PgPool, dto: CreateLayerItemOverrideDto) -> Result<LayerPlaylistItemOverrideEntity, AppError> {
        LayerItemOverrideRepository::create(pool, dto).await.map_err(AppError::Database)
    }

    pub async fn get_by_id(pool: &PgPool, id: Uuid) -> Result<LayerPlaylistItemOverrideEntity, AppError> {
        LayerItemOverrideRepository::get_by_id(pool, id)
            .await
            .map_err(AppError::Database)?
            .ok_or_else(|| AppError::NotFound("Override not found".into()))
    }

    pub async fn list(pool: &PgPool, layer_block_id: Option<Uuid>, page: i32, limit: i32) -> Result<(Vec<LayerPlaylistItemOverrideEntity>, i32), AppError> {
        let offset = ((page - 1) * limit) as i64;
        let (overrides, total) = LayerItemOverrideRepository::list(pool, layer_block_id, limit as i64, offset).await.map_err(AppError::Database)?;
        Ok((overrides, total as i32))
    }

    pub async fn update(pool: &PgPool, id: Uuid, dto: UpdateLayerItemOverrideDto) -> Result<LayerPlaylistItemOverrideEntity, AppError> {
        LayerItemOverrideRepository::update(pool, id, dto).await.map_err(AppError::Database)
    }

    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, AppError> {
        LayerItemOverrideRepository::delete(pool, id).await.map_err(AppError::Database)
    }
}
