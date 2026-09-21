use super::model::{CreateDisplayGroupDto, DisplayGroupEntity, UpdateDisplayGroupDto};
use crate::db::DbPool;
use uuid::Uuid;

pub struct DisplayGroupRepository;

impl DisplayGroupRepository {
    pub async fn create(
        pool: &DbPool,
        dto: CreateDisplayGroupDto,
    ) -> Result<DisplayGroupEntity, sqlx::Error> {
        let group = sqlx::query_as::<_, DisplayGroupEntity>(
            r#"
            INSERT INTO display_groups (name, description, default_layout_id, schedule_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            "#,
        )
        .bind(dto.name)
        .bind(dto.description)
        .bind(dto.default_layout_id)
        .bind(dto.schedule_id)
        .fetch_one(pool)
        .await?;

        Ok(group)
    }

    pub async fn find_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<Option<DisplayGroupEntity>, sqlx::Error> {
        let group = sqlx::query_as::<_, DisplayGroupEntity>("SELECT * FROM display_groups WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await?;

        Ok(group)
    }

    pub async fn find_all(pool: &DbPool) -> Result<Vec<DisplayGroupEntity>, sqlx::Error> {
        let groups = sqlx::query_as::<_, DisplayGroupEntity>(
            "SELECT * FROM display_groups ORDER BY created_at DESC",
        )
        .fetch_all(pool)
        .await?;

        Ok(groups)
    }

    pub async fn update(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateDisplayGroupDto,
    ) -> Result<DisplayGroupEntity, sqlx::Error> {
        let group = sqlx::query_as::<_, DisplayGroupEntity>(
            r#"
            UPDATE display_groups
            SET 
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                default_layout_id = COALESCE($4, default_layout_id),
                schedule_id = COALESCE($5, schedule_id),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(dto.name)
        .bind(dto.description)
        .bind(dto.default_layout_id)
        .bind(dto.schedule_id)
        .fetch_one(pool)
        .await?;

        Ok(group)
    }

    pub async fn delete(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM display_groups WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
