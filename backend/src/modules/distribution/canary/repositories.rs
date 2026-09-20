use super::model::{CanaryGroupEntity, CreateCanaryGroupDto, UpdateCanaryGroupDto};
use crate::db::DbPool;
use uuid::Uuid;

pub struct CanaryRepository;

impl CanaryRepository {
    pub async fn create(
        pool: &DbPool,
        dto: CreateCanaryGroupDto,
    ) -> Result<CanaryGroupEntity, sqlx::Error> {
        let group = sqlx::query_as::<_, CanaryGroupEntity>(
            r#"
            INSERT INTO canary_groups (name, description, rollout_percentage, is_active, target_layout_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#,
        )
        .bind(dto.name)
        .bind(dto.description)
        .bind(dto.rollout_percentage.unwrap_or(10))
        .bind(dto.is_active.unwrap_or(true))
        .bind(dto.target_layout_id)
        .fetch_one(pool)
        .await?;

        Ok(group)
    }

    pub async fn find_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<Option<CanaryGroupEntity>, sqlx::Error> {
        let group = sqlx::query_as::<_, CanaryGroupEntity>(
            "SELECT * FROM canary_groups WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(group)
    }

    pub async fn find_all(pool: &DbPool) -> Result<Vec<CanaryGroupEntity>, sqlx::Error> {
        let groups = sqlx::query_as::<_, CanaryGroupEntity>(
            "SELECT * FROM canary_groups ORDER BY name ASC",
        )
        .fetch_all(pool)
        .await?;

        Ok(groups)
    }

    pub async fn update(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateCanaryGroupDto,
    ) -> Result<CanaryGroupEntity, sqlx::Error> {
        let group = sqlx::query_as::<_, CanaryGroupEntity>(
            r#"
            UPDATE canary_groups
            SET 
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                rollout_percentage = COALESCE($4, rollout_percentage),
                is_active = COALESCE($5, is_active),
                target_layout_id = COALESCE($6, target_layout_id),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(dto.name)
        .bind(dto.description)
        .bind(dto.rollout_percentage)
        .bind(dto.is_active)
        .bind(dto.target_layout_id)
        .fetch_one(pool)
        .await?;

        Ok(group)
    }

    pub async fn delete(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM canary_groups WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
