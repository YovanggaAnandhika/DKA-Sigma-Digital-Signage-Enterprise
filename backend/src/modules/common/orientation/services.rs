use sqlx::PgPool;
use uuid::Uuid;
use crate::common::AppError;
use super::model::OrientationEntity;
use super::repositories::OrientationRepository;

pub struct OrientationService;

impl OrientationService {
    pub async fn list_orientations(pool: &PgPool) -> Result<Vec<OrientationEntity>, AppError> {
        OrientationRepository::find_all(pool).await
    }

    pub async fn get_orientation_by_id(pool: &PgPool, id: Uuid) -> Result<OrientationEntity, AppError> {
        OrientationRepository::find_by_id(pool, id).await
    }

    pub async fn create_orientation(pool: &PgPool, name: &str, value: &str) -> Result<OrientationEntity, AppError> {
        OrientationRepository::create(pool, name, value).await
    }

    pub async fn update_orientation(pool: &PgPool, id: Uuid, name: &str, value: &str) -> Result<OrientationEntity, AppError> {
        OrientationRepository::update(pool, id, name, value).await
    }

    pub async fn delete_orientation(pool: &PgPool, id: Uuid) -> Result<bool, AppError> {
        OrientationRepository::delete(pool, id).await
    }
}

