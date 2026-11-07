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
        let default_corp = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
        let corp_id = dto.corporation_id.unwrap_or(default_corp);

        let group = sqlx::query_as::<_, RoleGroupEntity>(
            r#"
            INSERT INTO iam_role_groups (corporation_id, branch_id, name, slug, description, created_by_user_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, corporation_id, branch_id, name, slug, description, created_by_user_id, created_at, updated_at
            "#,
        )
        .bind(corp_id)
        .bind(dto.branch_id)
        .bind(dto.name)
        .bind(dto.slug)
        .bind(dto.description)
        .bind(dto.created_by_user_id)
        .fetch_one(&mut *tx)
        .await?;

        if let Some(role_ids) = dto.role_ids {
            for role_id in role_ids {
                sqlx::query(
                    r#"
                    INSERT INTO iam_role_group_roles (role_group_id, role_id)
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

        if let Some(perm_ids) = dto.permission_ids {
            for perm_id in perm_ids {
                sqlx::query(
                    r#"
                    INSERT INTO iam_role_group_permissions (role_group_id, permission_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                    "#,
                )
                .bind(group.id)
                .bind(perm_id)
                .execute(&mut *tx)
                .await?;
            }
        }

        tx.commit().await?;
        Ok(group)
    }

    pub async fn assign_permissions(
        pool: &DbPool,
        role_group_id: Uuid,
        permission_ids: Vec<Uuid>,
    ) -> Result<(), sqlx::Error> {
        let mut tx = pool.begin().await?;
        for perm_id in permission_ids {
            sqlx::query(
                r#"
                INSERT INTO iam_role_group_permissions (role_group_id, permission_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
                "#,
            )
            .bind(role_group_id)
            .bind(perm_id)
            .execute(&mut *tx)
            .await?;
        }
        tx.commit().await?;
        Ok(())
    }

    pub async fn find_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<Option<RoleGroupEntity>, sqlx::Error> {
        let group = sqlx::query_as::<_, RoleGroupEntity>(
            r#"
            SELECT id, corporation_id, branch_id, name, slug, description, created_by_user_id, created_at, updated_at
            FROM iam_role_groups
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(group)
    }

    pub async fn find_by_slug(
        pool: &DbPool,
        slug: &str,
    ) -> Result<Option<RoleGroupEntity>, sqlx::Error> {
        let group = sqlx::query_as::<_, RoleGroupEntity>(
            r#"
            SELECT id, corporation_id, branch_id, name, slug, description, created_by_user_id, created_at, updated_at
            FROM iam_role_groups
            WHERE slug = $1
            LIMIT 1
            "#,
        )
        .bind(slug)
        .fetch_optional(pool)
        .await?;

        Ok(group)
    }

    pub async fn find_all(pool: &DbPool) -> Result<Vec<RoleGroupEntity>, sqlx::Error> {
        let groups = sqlx::query_as::<_, RoleGroupEntity>(
            r#"
            SELECT id, corporation_id, branch_id, name, slug, description, created_by_user_id, created_at, updated_at
            FROM iam_role_groups
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
            UPDATE iam_role_groups
            SET 
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, corporation_id, branch_id, name, slug, description, created_by_user_id, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(dto.name)
        .bind(dto.description)
        .fetch_one(&mut *tx)
        .await?;

        if let Some(role_ids) = dto.role_ids {
            sqlx::query("DELETE FROM iam_role_group_roles WHERE role_group_id = $1")
                .bind(id)
                .execute(&mut *tx)
                .await?;

            for role_id in role_ids {
                sqlx::query(
                    r#"
                    INSERT INTO iam_role_group_roles (role_group_id, role_id)
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
        let result = sqlx::query("DELETE FROM iam_role_groups WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
