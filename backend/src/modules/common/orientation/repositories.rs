use sqlx::PgPool;
use uuid::Uuid;
use crate::common::AppError;
use super::model::OrientationEntity;

pub struct OrientationRepository;

impl OrientationRepository {
    pub async fn find_all(pool: &PgPool) -> Result<Vec<OrientationEntity>, AppError> {
        let items = sqlx::query_as::<_, OrientationEntity>(
            "SELECT id, name, value, created_at, updated_at FROM common_orientations ORDER BY name ASC"
        )
        .fetch_all(pool)
        .await
        .map_err(|e| AppError::Database(e))?;

        Ok(items)
    }

    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<OrientationEntity, AppError> {
        let item = sqlx::query_as::<_, OrientationEntity>(
            "SELECT id, name, value, created_at, updated_at FROM common_orientations WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Database(e))?
        .ok_or_else(|| AppError::NotFound("Orientation not found".into()))?;

        Ok(item)
    }

    pub async fn create(pool: &PgPool, name: &str, value: &str) -> Result<OrientationEntity, AppError> {
        let item = sqlx::query_as::<_, OrientationEntity>(
            r#"
            INSERT INTO common_orientations (name, value)
            VALUES ($1, $2)
            RETURNING id, name, value, created_at, updated_at
            "#
        )
        .bind(name)
        .bind(value)
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Database(e))?;

        Ok(item)
    }

    pub async fn update(pool: &PgPool, id: Uuid, name: &str, value: &str) -> Result<OrientationEntity, AppError> {
        let item = sqlx::query_as::<_, OrientationEntity>(
            r#"
            UPDATE common_orientations
            SET name = $1, value = $2, updated_at = NOW()
            WHERE id = $3
            RETURNING id, name, value, created_at, updated_at
            "#
        )
        .bind(name)
        .bind(value)
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Database(e))?
        .ok_or_else(|| AppError::NotFound("Orientation not found".into()))?;

        Ok(item)
    }

    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, AppError> {
        sqlx::query("DELETE FROM common_orientations WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e| AppError::Database(e))?;

        Ok(true)
    }
}

