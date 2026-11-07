use super::model::{BranchEntity, CreateBranchDto, UpdateBranchDto};
use crate::db::DbPool;
use uuid::Uuid;

pub struct BranchRepository;

impl BranchRepository {
    pub async fn create(
        pool: &DbPool,
        dto: CreateBranchDto,
    ) -> Result<BranchEntity, sqlx::Error> {
        let entity = sqlx::query_as::<_, BranchEntity>(
            r#"
            INSERT INTO system_branches (corporation_id, name, code, address)
            VALUES ($1, $2, $3, $4)
            RETURNING id, corporation_id, name, code, address, is_active, created_at, updated_at
            "#,
        )
        .bind(dto.corporation_id)
        .bind(dto.name)
        .bind(dto.code)
        .bind(dto.address)
        .fetch_one(pool)
        .await?;

        Ok(entity)
    }

    pub async fn count_by_corporation(
        pool: &DbPool,
        corporation_id: Uuid,
    ) -> Result<i64, sqlx::Error> {
        let count = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*) FROM system_branches WHERE corporation_id = $1
            "#,
        )
        .bind(corporation_id)
        .fetch_one(pool)
        .await?;

        Ok(count)
    }

    pub async fn find_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<Option<BranchEntity>, sqlx::Error> {
        let entity = sqlx::query_as::<_, BranchEntity>(
            r#"
            SELECT id, corporation_id, name, code, address, is_active, created_at, updated_at
            FROM system_branches
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(entity)
    }

    pub async fn find_by_code(
        pool: &DbPool,
        corporation_id: Uuid,
        code: &str,
    ) -> Result<Option<BranchEntity>, sqlx::Error> {
        let entity = sqlx::query_as::<_, BranchEntity>(
            r#"
            SELECT id, corporation_id, name, code, address, is_active, created_at, updated_at
            FROM system_branches
            WHERE corporation_id = $1 AND code = $2
            LIMIT 1
            "#,
        )
        .bind(corporation_id)
        .bind(code)
        .fetch_optional(pool)
        .await?;

        Ok(entity)
    }

    pub async fn find_all(
        pool: &DbPool,
        corporation_id: Option<Uuid>,
        search: Option<&str>,
    ) -> Result<Vec<BranchEntity>, sqlx::Error> {
        let search_pattern = search.map(|s| format!("%{}%", s));

        match (corporation_id, search_pattern) {
            (Some(cid), Some(pat)) => {
                sqlx::query_as::<_, BranchEntity>(
                    r#"
                    SELECT id, corporation_id, name, code, address, is_active, created_at, updated_at
                    FROM system_branches
                    WHERE corporation_id = $1 AND (name ILIKE $2 OR code ILIKE $2)
                    ORDER BY code ASC
                    "#,
                )
                .bind(cid)
                .bind(pat)
                .fetch_all(pool)
                .await
            }
            (Some(cid), None) => {
                sqlx::query_as::<_, BranchEntity>(
                    r#"
                    SELECT id, corporation_id, name, code, address, is_active, created_at, updated_at
                    FROM system_branches
                    WHERE corporation_id = $1
                    ORDER BY code ASC
                    "#,
                )
                .bind(cid)
                .fetch_all(pool)
                .await
            }
            (None, Some(pat)) => {
                sqlx::query_as::<_, BranchEntity>(
                    r#"
                    SELECT id, corporation_id, name, code, address, is_active, created_at, updated_at
                    FROM system_branches
                    WHERE name ILIKE $1 OR code ILIKE $1
                    ORDER BY corporation_id ASC, code ASC
                    "#,
                )
                .bind(pat)
                .fetch_all(pool)
                .await
            }
            (None, None) => {
                sqlx::query_as::<_, BranchEntity>(
                    r#"
                    SELECT id, corporation_id, name, code, address, is_active, created_at, updated_at
                    FROM system_branches
                    ORDER BY corporation_id ASC, code ASC
                    "#,
                )
                .fetch_all(pool)
                .await
            }
        }
    }

    pub async fn update(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateBranchDto,
    ) -> Result<BranchEntity, sqlx::Error> {
        let entity = sqlx::query_as::<_, BranchEntity>(
            r#"
            UPDATE system_branches
            SET
                name = COALESCE($2, name),
                code = COALESCE($3, code),
                address = COALESCE($4, address),
                is_active = COALESCE($5, is_active),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, corporation_id, name, code, address, is_active, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(dto.name)
        .bind(dto.code)
        .bind(dto.address)
        .bind(dto.is_active)
        .fetch_one(pool)
        .await?;

        Ok(entity)
    }

    pub async fn delete(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM system_branches WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}

