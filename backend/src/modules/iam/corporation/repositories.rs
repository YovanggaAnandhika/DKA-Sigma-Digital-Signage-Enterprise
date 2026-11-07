use super::model::{CorporationEntity, CreateCorporationDto, UpdateCorporationDto};
use crate::db::DbPool;
use uuid::Uuid;

pub struct CorporationRepository;

impl CorporationRepository {
    pub async fn create(
        pool: &DbPool,
        dto: CreateCorporationDto,
    ) -> Result<CorporationEntity, sqlx::Error> {
        let max_screens = dto.max_screens.unwrap_or(10);
        let max_branches = dto.max_branches.unwrap_or(5);
        let tier = dto.subscription_tier.unwrap_or_else(|| "standard".to_string());

        let entity = sqlx::query_as::<_, CorporationEntity>(
            r#"
            INSERT INTO system_corporations (
                name, slug, description, active_until, max_screens, max_branches, subscription_tier
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, name, slug, description, active_until, max_screens, max_branches, subscription_tier, is_active, created_at, updated_at
            "#,
        )
        .bind(dto.name)
        .bind(dto.slug)
        .bind(dto.description)
        .bind(dto.active_until)
        .bind(max_screens)
        .bind(max_branches)
        .bind(tier)
        .fetch_one(pool)
        .await?;

        Ok(entity)
    }

    pub async fn find_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<Option<CorporationEntity>, sqlx::Error> {
        let entity = sqlx::query_as::<_, CorporationEntity>(
            r#"
            SELECT id, name, slug, description, active_until, max_screens, max_branches, subscription_tier, is_active, created_at, updated_at
            FROM system_corporations
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(entity)
    }

    pub async fn find_by_slug(
        pool: &DbPool,
        slug: &str,
    ) -> Result<Option<CorporationEntity>, sqlx::Error> {
        let entity = sqlx::query_as::<_, CorporationEntity>(
            r#"
            SELECT id, name, slug, description, active_until, max_screens, max_branches, subscription_tier, is_active, created_at, updated_at
            FROM system_corporations
            WHERE slug = $1
            LIMIT 1
            "#,
        )
        .bind(slug)
        .fetch_optional(pool)
        .await?;

        Ok(entity)
    }

    pub async fn find_all(
        pool: &DbPool,
        search: Option<&str>,
    ) -> Result<Vec<CorporationEntity>, sqlx::Error> {
        let query = if let Some(s) = search {
            let pattern = format!("%{}%", s);
            sqlx::query_as::<_, CorporationEntity>(
                r#"
                SELECT id, name, slug, description, active_until, max_screens, max_branches, subscription_tier, is_active, created_at, updated_at
                FROM system_corporations
                WHERE name ILIKE $1 OR slug ILIKE $1
                ORDER BY created_at DESC
                "#,
            )
            .bind(pattern)
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as::<_, CorporationEntity>(
                r#"
                SELECT id, name, slug, description, active_until, max_screens, max_branches, subscription_tier, is_active, created_at, updated_at
                FROM system_corporations
                ORDER BY created_at DESC
                "#,
            )
            .fetch_all(pool)
            .await?
        };

        Ok(query)
    }

    pub async fn update(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateCorporationDto,
    ) -> Result<CorporationEntity, sqlx::Error> {
        let entity = sqlx::query_as::<_, CorporationEntity>(
            r#"
            UPDATE system_corporations
            SET
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                active_until = COALESCE($4, active_until),
                max_screens = COALESCE($5, max_screens),
                max_branches = COALESCE($6, max_branches),
                subscription_tier = COALESCE($7, subscription_tier),
                is_active = COALESCE($8, is_active),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, name, slug, description, active_until, max_screens, max_branches, subscription_tier, is_active, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(dto.name)
        .bind(dto.description)
        .bind(dto.active_until)
        .bind(dto.max_screens)
        .bind(dto.max_branches)
        .bind(dto.subscription_tier)
        .bind(dto.is_active)
        .fetch_one(pool)
        .await?;

        Ok(entity)
    }

    pub async fn delete(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let default_corp = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
        if id == default_corp {
            return Ok(false); // Protect default corporation from deletion
        }
        let result = sqlx::query("DELETE FROM system_corporations WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}

