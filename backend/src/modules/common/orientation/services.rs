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
}
