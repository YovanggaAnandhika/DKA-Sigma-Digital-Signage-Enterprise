use sqlx::PgPool;
use uuid::Uuid;
use crate::error::AppError;
use super::model::OrientationEntity;

pub struct OrientationRepository;

impl OrientationRepository {
    pub async fn find_all(pool: &PgPool) -> Result<Vec<OrientationEntity>, AppError> {
        let items = sqlx::query_as::<_, OrientationEntity>(
            "SELECT id, name, value, created_at, updated_at FROM orientations ORDER BY name ASC"
        )
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::Database(e))?;

        Ok(items)
    }

    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<OrientationEntity, AppError> {
        let item = sqlx::query_as::<_, OrientationEntity>(
            "SELECT id, name, value, created_at, updated_at FROM orientations WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Database(e))?
        .ok_or_else(|| AppError::NotFound("Orientation not found".into()))?;

        Ok(item)
    }
}
