use super::model::{
    CreateLayoutDto, LayoutEntity, UpdateLayoutDto, LayoutWithLayersDto,
};
use super::repositories::LayoutRepository;
use crate::modules::common::orientation::repositories::OrientationRepository;
use crate::db::DbPool;
use crate::error::AppError;
use uuid::Uuid;

pub struct LayoutService;

impl LayoutService {
    pub async fn create_layout(pool: &DbPool, dto: CreateLayoutDto) -> Result<LayoutEntity, AppError> {
        let layout = LayoutRepository::create(pool, dto).await?;
        Ok(layout)
    }

    pub async fn get_layout_by_id(pool: &DbPool, id: Uuid) -> Result<LayoutWithLayersDto, AppError> {
        let layout = LayoutRepository::find_by_id(pool, id)
            .await?
            .ok_or_else(|| AppError::NotFound("Layout not found".to_string()))?;
        
        let orientation = OrientationRepository::find_by_id(pool, layout.orientation_id)
            .await
            .ok();

        let layers = LayoutRepository::get_layers_by_layout_id(pool, layout.id).await?;

        Ok(LayoutWithLayersDto { layout, orientation, layers })
    }

    pub async fn list_layouts(pool: &DbPool) -> Result<Vec<LayoutEntity>, AppError> {
        let layouts = LayoutRepository::find_all(pool).await?;
        Ok(layouts)
    }

    pub async fn update_layout(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateLayoutDto,
    ) -> Result<LayoutEntity, AppError> {
        let layout = LayoutRepository::update(pool, id, dto).await?;
        Ok(layout)
    }

    pub async fn delete_layout(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let success = LayoutRepository::delete(pool, id).await?;
        Ok(success)
    }
}
