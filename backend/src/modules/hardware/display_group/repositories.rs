use super::model::{CreateDisplayGroupDto, DisplayGroupEntity, UpdateDisplayGroupDto};
use crate::db::DbPool;
use uuid::Uuid;

pub struct DisplayGroupRepository;

impl DisplayGroupRepository {
    pub async fn create(
        pool: &DbPool,
        dto: CreateDisplayGroupDto,
    ) -> Result<DisplayGroupEntity, sqlx::Error> {
        let inserted_id = sqlx::query_scalar::<_, Uuid>(
            r#"
            INSERT INTO hardware_display_groups (
                corporation_id, branch_id, created_by_user_id, name, description,
                default_layout_id, schedule_id, schedule_assigned_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $7 IS NOT NULL THEN NOW() END)
            RETURNING id
            "#,
        )
        .bind(dto.corporation_id)
        .bind(dto.branch_id)
        .bind(dto.user_id)
        .bind(dto.name)
        .bind(dto.description)
        .bind(dto.default_layout_id)
        .bind(dto.schedule_id)
        .fetch_one(pool)
        .await?;

        Self::find_by_id(pool, inserted_id, Some(dto.corporation_id))
            .await?
            .ok_or(sqlx::Error::RowNotFound)
    }

    pub async fn find_by_id(
        pool: &DbPool,
        id: Uuid,
        corp_id: Option<Uuid>,
    ) -> Result<Option<DisplayGroupEntity>, sqlx::Error> {
        let query = r#"
            SELECT 
                g.id, g.corporation_id, g.branch_id, g.name, g.description,
                g.default_layout_id, l.name AS default_layout_name,
                g.schedule_id, s.name AS schedule_name,
                g.schedule_assigned_at, g.created_at, g.updated_at
            FROM hardware_display_groups g
            LEFT JOIN studio_layouts l ON l.id = g.default_layout_id
            LEFT JOIN studio_schedules s ON s.id = g.schedule_id
            WHERE g.id = $1 AND ($2::uuid IS NULL OR g.corporation_id = $2)
        "#;
        let group = sqlx::query_as::<_, DisplayGroupEntity>(query)
            .bind(id)
            .bind(corp_id)
            .fetch_optional(pool)
            .await?;

        Ok(group)
    }

    pub async fn find_all(
        pool: &DbPool,
        corp_id: Option<Uuid>,
    ) -> Result<Vec<DisplayGroupEntity>, sqlx::Error> {
        let query = r#"
            SELECT 
                g.id, g.corporation_id, g.branch_id, g.name, g.description,
                g.default_layout_id, l.name AS default_layout_name,
                g.schedule_id, s.name AS schedule_name,
                g.schedule_assigned_at, g.created_at, g.updated_at
            FROM hardware_display_groups g
            LEFT JOIN studio_layouts l ON l.id = g.default_layout_id
            LEFT JOIN studio_schedules s ON s.id = g.schedule_id
            WHERE ($1::uuid IS NULL OR g.corporation_id = $1)
            ORDER BY g.created_at DESC
        "#;
        let groups = sqlx::query_as::<_, DisplayGroupEntity>(query)
            .bind(corp_id)
            .fetch_all(pool)
            .await?;

        Ok(groups)
    }

    pub async fn update(
        pool: &DbPool,
        id: Uuid,
        corp_id: Option<Uuid>,
        dto: UpdateDisplayGroupDto,
    ) -> Result<DisplayGroupEntity, sqlx::Error> {
        let result = sqlx::query(
            r#"
            UPDATE hardware_display_groups
            SET 
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                default_layout_id = COALESCE($4, default_layout_id),
                schedule_assigned_at = CASE
                    WHEN $5 IS NOT NULL AND $5 IS DISTINCT FROM schedule_id THEN NOW()
                    WHEN $5 IS NOT NULL AND schedule_assigned_at IS NULL THEN NOW()
                    ELSE schedule_assigned_at
                END,
                schedule_id = COALESCE($5, schedule_id),
                updated_at = NOW()
            WHERE id = $1 AND ($6::uuid IS NULL OR corporation_id = $6)
            "#,
        )
        .bind(id)
        .bind(dto.name)
        .bind(dto.description)
        .bind(dto.default_layout_id)
        .bind(dto.schedule_id)
        .bind(corp_id)
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(sqlx::Error::RowNotFound);
        }

        Self::find_by_id(pool, id, corp_id)
            .await?
            .ok_or(sqlx::Error::RowNotFound)
    }

    pub async fn delete(pool: &DbPool, id: Uuid, corp_id: Option<Uuid>) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM hardware_display_groups WHERE id = $1 AND ($2::uuid IS NULL OR corporation_id = $2)")
            .bind(id)
            .bind(corp_id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
