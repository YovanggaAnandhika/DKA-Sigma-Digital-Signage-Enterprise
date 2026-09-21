use super::model::{CreateDisplayGroupDto, DisplayGroupEntity, UpdateDisplayGroupDto};
use super::repositories::DisplayGroupRepository;
use crate::common::AppError;
use crate::db::DbPool;
use uuid::Uuid;

pub struct DisplayGroupService;

impl DisplayGroupService {
    pub async fn create_display_group(
        pool: &DbPool,
        dto: CreateDisplayGroupDto,
    ) -> Result<DisplayGroupEntity, AppError> {
        let group = DisplayGroupRepository::create(pool, dto)
            .await
            .map_err(AppError::Database)?;
        Ok(group)
    }

    pub async fn get_display_group_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<DisplayGroupEntity, AppError> {
        let group = DisplayGroupRepository::find_by_id(pool, id)
            .await
            .map_err(AppError::Database)?
            .ok_or_else(|| AppError::NotFound("Display group not found".to_string()))?;

        Ok(group)
    }

    pub async fn list_display_groups(pool: &DbPool) -> Result<Vec<DisplayGroupEntity>, AppError> {
        let groups = DisplayGroupRepository::find_all(pool)
            .await
            .map_err(AppError::Database)?;
        Ok(groups)
    }

    pub async fn update_display_group(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateDisplayGroupDto,
    ) -> Result<DisplayGroupEntity, AppError> {
        let group = DisplayGroupRepository::update(pool, id, dto)
            .await
            .map_err(|e| match e {
                sqlx::Error::RowNotFound => AppError::NotFound("Display group not found".to_string()),
                _ => AppError::Database(e),
            })?;
        Ok(group)
    }

    pub async fn delete_display_group(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let success = DisplayGroupRepository::delete(pool, id)
            .await
            .map_err(AppError::Database)?;

        if !success {
            return Err(AppError::NotFound("Display group not found".to_string()));
        }

        Ok(true)
    }
}
