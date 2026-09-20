use super::model::{CreateMediaDto, MediaEntity, UpdateMediaDto};
use super::repositories::MediaRepository;
use crate::common::AppError;
use crate::db::DbPool;
use uuid::Uuid;

pub struct MediaService;

impl MediaService {
    pub async fn create_media(
        pool: &DbPool,
        dto: CreateMediaDto,
    ) -> Result<MediaEntity, AppError> {
        let media = MediaRepository::create(pool, dto).await?;
        Ok(media)
    }

    pub async fn get_media_by_id(pool: &DbPool, id: Uuid) -> Result<MediaEntity, AppError> {
        MediaRepository::find_by_id(pool, id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Media item {} not found", id)))
    }

    pub async fn list_media(pool: &DbPool) -> Result<Vec<MediaEntity>, AppError> {
        let media = MediaRepository::find_all(pool).await?;
        Ok(media)
    }

    pub async fn update_media(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateMediaDto,
    ) -> Result<MediaEntity, AppError> {
        let media = MediaRepository::update(pool, id, dto).await?;
        Ok(media)
    }

    pub async fn delete_media(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let deleted = MediaRepository::delete(pool, id).await?;
        Ok(deleted)
    }
}
