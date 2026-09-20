use super::model::{CreateRoleDto, RoleEntity, UpdateRoleDto};
use crate::db::DbPool;
use uuid::Uuid;

pub struct RoleRepository;

impl RoleRepository {
    pub async fn create(pool: &DbPool, dto: CreateRoleDto) -> Result<RoleEntity, sqlx::Error> {
        let mut tx = pool.begin().await?;

        let role = sqlx::query_as::<_, RoleEntity>(
            r#"
            INSERT INTO roles (name, slug, description)
            VALUES ($1, $2, $3)
            RETURNING id, name, slug, description, is_system, created_at, updated_at
            "#,
        )
        .bind(dto.name)
        .bind(dto.slug)
        .bind(dto.description)
        .fetch_one(&mut *tx)
        .await?;

        if let Some(perm_ids) = dto.permission_ids {
            for perm_id in perm_ids {
                sqlx::query(
                    r#"
                    INSERT INTO role_permissions (role_id, permission_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                    "#,
                )
                .bind(role.id)
                .bind(perm_id)
                .execute(&mut *tx)
                .await?;
            }
        }

        tx.commit().await?;
        Ok(role)
    }

    pub async fn find_by_id(pool: &DbPool, id: Uuid) -> Result<Option<RoleEntity>, sqlx::Error> {
        let role = sqlx::query_as::<_, RoleEntity>(
            r#"
            SELECT id, name, slug, description, is_system, created_at, updated_at
            FROM roles
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(role)
    }

    pub async fn find_by_slug(pool: &DbPool, slug: &str) -> Result<Option<RoleEntity>, sqlx::Error> {
        let role = sqlx::query_as::<_, RoleEntity>(
            r#"
            SELECT id, name, slug, description, is_system, created_at, updated_at
            FROM roles
            WHERE slug = $1
            "#,
        )
        .bind(slug)
        .fetch_optional(pool)
        .await?;

        Ok(role)
    }

    pub async fn find_all(pool: &DbPool) -> Result<Vec<RoleEntity>, sqlx::Error> {
        let roles = sqlx::query_as::<_, RoleEntity>(
            r#"
            SELECT id, name, slug, description, is_system, created_at, updated_at
            FROM roles
            ORDER BY name ASC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(roles)
    }

    pub async fn update(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateRoleDto,
    ) -> Result<RoleEntity, sqlx::Error> {
        let mut tx = pool.begin().await?;

        let role = sqlx::query_as::<_, RoleEntity>(
            r#"
            UPDATE roles
            SET 
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, name, slug, description, is_system, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(dto.name)
        .bind(dto.description)
        .fetch_one(&mut *tx)
        .await?;

        if let Some(perm_ids) = dto.permission_ids {
            sqlx::query("DELETE FROM role_permissions WHERE role_id = $1")
                .bind(id)
                .execute(&mut *tx)
                .await?;

            for perm_id in perm_ids {
                sqlx::query(
                    r#"
                    INSERT INTO role_permissions (role_id, permission_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                    "#,
                )
                .bind(id)
                .bind(perm_id)
                .execute(&mut *tx)
                .await?;
            }
        }

        tx.commit().await?;
        Ok(role)
    }

    pub async fn delete(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM roles WHERE id = $1 AND is_system = FALSE")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn assign_permissions(
        pool: &DbPool,
        role_id: Uuid,
        perm_ids: Vec<Uuid>,
    ) -> Result<(), sqlx::Error> {
        let mut tx = pool.begin().await?;

        sqlx::query("DELETE FROM role_permissions WHERE role_id = $1")
            .bind(role_id)
            .execute(&mut *tx)
            .await?;

        for perm_id in perm_ids {
            sqlx::query(
                r#"
                INSERT INTO role_permissions (role_id, permission_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
                "#,
            )
            .bind(role_id)
            .bind(perm_id)
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;
        Ok(())
    }
}
