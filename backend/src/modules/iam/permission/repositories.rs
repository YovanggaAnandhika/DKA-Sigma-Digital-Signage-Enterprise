use super::model::{CreatePermissionDto, PermissionEntity, UpdatePermissionDto};
use crate::db::DbPool;
use uuid::Uuid;

pub struct PermissionRepository;

impl PermissionRepository {
    pub async fn create(
        pool: &DbPool,
        dto: CreatePermissionDto,
    ) -> Result<PermissionEntity, sqlx::Error> {
        let perm = sqlx::query_as::<_, PermissionEntity>(
            r#"
            INSERT INTO permissions (code, name, description, module)
            VALUES ($1, $2, $3, $4)
            RETURNING id, code, name, description, module, created_at, updated_at
            "#,
        )
        .bind(dto.code)
        .bind(dto.name)
        .bind(dto.description)
        .bind(dto.module)
        .fetch_one(pool)
        .await?;

        Ok(perm)
    }

    pub async fn find_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<Option<PermissionEntity>, sqlx::Error> {
        let perm = sqlx::query_as::<_, PermissionEntity>(
            r#"
            SELECT id, code, name, description, module, created_at, updated_at
            FROM permissions
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(perm)
    }

    pub async fn find_by_code(
        pool: &DbPool,
        code: &str,
    ) -> Result<Option<PermissionEntity>, sqlx::Error> {
        let perm = sqlx::query_as::<_, PermissionEntity>(
            r#"
            SELECT id, code, name, description, module, created_at, updated_at
            FROM permissions
            WHERE code = $1
            "#,
        )
        .bind(code)
        .fetch_optional(pool)
        .await?;

        Ok(perm)
    }

    pub async fn find_all(pool: &DbPool) -> Result<Vec<PermissionEntity>, sqlx::Error> {
        let perms = sqlx::query_as::<_, PermissionEntity>(
            r#"
            SELECT id, code, name, description, module, created_at, updated_at
            FROM permissions
            ORDER BY module ASC, code ASC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(perms)
    }

    pub async fn update(
        pool: &DbPool,
        id: Uuid,
        dto: UpdatePermissionDto,
    ) -> Result<PermissionEntity, sqlx::Error> {
        let perm = sqlx::query_as::<_, PermissionEntity>(
            r#"
            UPDATE permissions
            SET 
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                module = COALESCE($4, module),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, code, name, description, module, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(dto.name)
        .bind(dto.description)
        .bind(dto.module)
        .fetch_one(pool)
        .await?;

        Ok(perm)
    }

    pub async fn delete(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM permissions WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn get_user_permissions(
        pool: &DbPool,
        user_id: Uuid,
    ) -> Result<Vec<String>, sqlx::Error> {
        // Collect permissions directly assigned through user_roles AND indirectly through user_role_groups
        let rows = sqlx::query_scalar::<_, String>(
            r#"
            SELECT DISTINCT p.code
            FROM permissions p
            JOIN role_permissions rp ON rp.permission_id = p.id
            JOIN user_roles ur ON ur.role_id = rp.role_id
            WHERE ur.user_id = $1
            UNION
            SELECT DISTINCT p.code
            FROM permissions p
            JOIN role_permissions rp ON rp.permission_id = p.id
            JOIN roles_groups_roles rgr ON rgr.role_id = rp.role_id
            JOIN user_role_groups urg ON urg.role_group_id = rgr.role_group_id
            WHERE urg.user_id = $1
            "#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?;

        Ok(rows)
    }
}
