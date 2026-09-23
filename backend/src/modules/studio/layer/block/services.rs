use sqlx::PgPool;
use uuid::Uuid;
use crate::common::AppError;
use super::model::{LayerBlockEntity, CreateLayerBlockDto, UpdateLayerBlockDto};
use super::repositories::LayerBlockRepository;

pub struct LayerBlockService;

impl LayerBlockService {
    pub async fn create(pool: &PgPool, dto: CreateLayerBlockDto) -> Result<LayerBlockEntity, AppError> {
        LayerBlockRepository::create(pool, dto).await.map_err(AppError::Database)
    }

    pub async fn get_by_id(pool: &PgPool, id: Uuid) -> Result<LayerBlockEntity, AppError> {
        LayerBlockRepository::get_by_id(pool, id)
            .await
            .map_err(AppError::Database)?
            .ok_or_else(|| AppError::NotFound("Layer block not found".into()))
    }

    pub async fn list(pool: &PgPool, layer_id: Option<Uuid>, page: i32, limit: i32) -> Result<(Vec<LayerBlockEntity>, i32), AppError> {
        let offset = ((page - 1) * limit) as i64;
        let (blocks, total) = LayerBlockRepository::list(pool, layer_id, limit as i64, offset).await.map_err(AppError::Database)?;
        Ok((blocks, total as i32))
    }

    pub async fn update(pool: &PgPool, id: Uuid, dto: UpdateLayerBlockDto) -> Result<LayerBlockEntity, AppError> {
        LayerBlockRepository::update(pool, id, dto).await.map_err(AppError::Database)
    }

    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, AppError> {
        LayerBlockRepository::delete(pool, id).await.map_err(AppError::Database)
    }
}
