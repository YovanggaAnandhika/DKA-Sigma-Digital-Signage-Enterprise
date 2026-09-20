use super::model::{CreateRoleGroupDto, RoleGroupEntity, UpdateRoleGroupDto};
use crate::db::DbPool;
use uuid::Uuid;

pub struct RoleGroupRepository;

impl RoleGroupRepository {
    pub async fn create(
        pool: &DbPool,
        dto: CreateRoleGroupDto,
    ) -> Result<RoleGroupEntity, sqlx::Error> {
        let mut tx = pool.begin().await?;

        let group = sqlx::query_as::<_, RoleGroupEntity>(
            r#"
            INSERT INTO roles_groups (name, slug, description)
            VALUES ($1, $2, $3)
            RETURNING id, name, slug, description, created_at, updated_at
            "#,
        )
        .bind(dto.name)
        .bind(dto.slug)
        .bind(dto.description)
        .fetch_one(&mut *tx)
        .await?;

        if let Some(role_ids) = dto.role_ids {
            for role_id in role_ids {
                sqlx::query(
                    r#"
                    INSERT INTO roles_groups_roles (role_group_id, role_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                    "#,
                )
                .bind(group.id)
                .bind(role_id)
                .execute(&mut *tx)
                .await?;
            }
        }

        tx.commit().await?;
        Ok(group)
    }

    pub async fn find_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<Option<RoleGroupEntity>, sqlx::Error> {
        let group = sqlx::query_as::<_, RoleGroupEntity>(
            r#"
            SELECT id, name, slug, description, created_at, updated_at
            FROM roles_groups
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(group)
    }

    pub async fn find_all(pool: &DbPool) -> Result<Vec<RoleGroupEntity>, sqlx::Error> {
        let groups = sqlx::query_as::<_, RoleGroupEntity>(
            r#"
            SELECT id, name, slug, description, created_at, updated_at
            FROM roles_groups
            ORDER BY name ASC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(groups)
    }

    pub async fn update(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateRoleGroupDto,
    ) -> Result<RoleGroupEntity, sqlx::Error> {
        let mut tx = pool.begin().await?;

        let group = sqlx::query_as::<_, RoleGroupEntity>(
            r#"
            UPDATE roles_groups
            SET 
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, name, slug, description, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(dto.name)
        .bind(dto.description)
        .fetch_one(&mut *tx)
        .await?;

        if let Some(role_ids) = dto.role_ids {
            sqlx::query("DELETE FROM roles_groups_roles WHERE role_group_id = $1")
                .bind(id)
                .execute(&mut *tx)
                .await?;

            for role_id in role_ids {
                sqlx::query(
                    r#"
                    INSERT INTO roles_groups_roles (role_group_id, role_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                    "#,
                )
                .bind(id)
                .bind(role_id)
                .execute(&mut *tx)
                .await?;
            }
        }

        tx.commit().await?;
        Ok(group)
    }

    pub async fn delete(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM roles_groups WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
