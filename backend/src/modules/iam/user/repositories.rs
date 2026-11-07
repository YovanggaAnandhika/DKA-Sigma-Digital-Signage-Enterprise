use super::model::{CreateUserDto, UpdateUserDto, UserEntity};
use crate::db::DbPool;
use uuid::Uuid;

pub struct UserRepository;

impl UserRepository {
    pub async fn create(
        pool: &DbPool,
        dto: CreateUserDto,
        password_hash: String,
    ) -> Result<UserEntity, sqlx::Error> {
        let mut tx = pool.begin().await?;
        let default_corp = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
        let corp_id = dto.corporation_id.unwrap_or(default_corp);

        let user = sqlx::query_as::<_, UserEntity>(
            r#"
            INSERT INTO iam_users (corporation_id, branch_id, email, password_hash, full_name, created_by_user_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, corporation_id, branch_id, email, password_hash, full_name, is_active, created_by_user_id, created_at, updated_at
            "#,
        )
        .bind(corp_id)
        .bind(dto.branch_id)
        .bind(dto.email)
        .bind(password_hash)
        .bind(dto.full_name)
        .bind(dto.created_by_user_id)
        .fetch_one(&mut *tx)
        .await?;

        if let Some(role_ids) = dto.role_ids {
            for role_id in role_ids {
                sqlx::query(
                    r#"
                    INSERT INTO iam_user_roles (user_id, role_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                    "#,
                )
                .bind(user.id)
                .bind(role_id)
                .execute(&mut *tx)
                .await?;
            }
        }

        if let Some(group_ids) = dto.role_group_ids {
            for group_id in group_ids {
                sqlx::query(
                    r#"
                    INSERT INTO iam_user_role_groups (user_id, role_group_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                    "#,
                )
                .bind(user.id)
                .bind(group_id)
                .execute(&mut *tx)
                .await?;
            }
        }

        tx.commit().await?;
        Ok(user)
    }

    pub async fn find_by_id(pool: &DbPool, id: Uuid) -> Result<Option<UserEntity>, sqlx::Error> {
        let user = sqlx::query_as::<_, UserEntity>(
            r#"
            SELECT id, corporation_id, branch_id, email, password_hash, full_name, is_active, created_by_user_id, created_at, updated_at
            FROM iam_users
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    pub async fn find_by_email(pool: &DbPool, email: &str) -> Result<Option<UserEntity>, sqlx::Error> {
        let user = sqlx::query_as::<_, UserEntity>(
            r#"
            SELECT id, corporation_id, branch_id, email, password_hash, full_name, is_active, created_by_user_id, created_at, updated_at
            FROM iam_users
            WHERE email = $1
            "#,
        )
        .bind(email)
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    pub async fn find_all(pool: &DbPool) -> Result<Vec<UserEntity>, sqlx::Error> {
        let users = sqlx::query_as::<_, UserEntity>(
            r#"
            SELECT id, corporation_id, branch_id, email, password_hash, full_name, is_active, created_by_user_id, created_at, updated_at
            FROM iam_users
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(users)
    }

    pub async fn update(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateUserDto,
    ) -> Result<UserEntity, sqlx::Error> {
        let mut tx = pool.begin().await?;

        let user = sqlx::query_as::<_, UserEntity>(
            r#"
            UPDATE iam_users
            SET 
                full_name = COALESCE($2, full_name),
                is_active = COALESCE($3, is_active),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, corporation_id, branch_id, email, password_hash, full_name, is_active, created_by_user_id, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(dto.full_name)
        .bind(dto.is_active)
        .fetch_one(&mut *tx)
        .await?;

        if let Some(role_ids) = dto.role_ids {
            sqlx::query("DELETE FROM iam_user_roles WHERE user_id = $1")
                .bind(id)
                .execute(&mut *tx)
                .await?;

            for role_id in role_ids {
                sqlx::query(
                    r#"
                    INSERT INTO iam_user_roles (user_id, role_id)
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

        if let Some(group_ids) = dto.role_group_ids {
            sqlx::query("DELETE FROM iam_user_role_groups WHERE user_id = $1")
                .bind(id)
                .execute(&mut *tx)
                .await?;

            for group_id in group_ids {
                sqlx::query(
                    r#"
                    INSERT INTO iam_user_role_groups (user_id, role_group_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                    "#,
                )
                .bind(id)
                .bind(group_id)
                .execute(&mut *tx)
                .await?;
            }
        }

        tx.commit().await?;
        Ok(user)
    }

    pub async fn delete(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM iam_users WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn get_user_roles(pool: &DbPool, user_id: Uuid) -> Result<Vec<crate::modules::iam::role::model::RoleEntity>, sqlx::Error> {
        sqlx::query_as::<_, crate::modules::iam::role::model::RoleEntity>(
            r#"
            SELECT r.id, r.corporation_id, r.branch_id, r.name, r.slug, r.description, r.is_system, r.created_by_user_id, r.created_at, r.updated_at
            FROM iam_roles r
            JOIN iam_user_roles ur ON ur.role_id = r.id
            WHERE ur.user_id = $1
            "#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await
    }

    pub async fn get_user_role_groups(pool: &DbPool, user_id: Uuid) -> Result<Vec<crate::modules::iam::role_group::model::RoleGroupEntity>, sqlx::Error> {
        sqlx::query_as::<_, crate::modules::iam::role_group::model::RoleGroupEntity>(
            r#"
            SELECT rg.id, rg.corporation_id, rg.branch_id, rg.name, rg.slug, rg.description, rg.created_by_user_id, rg.created_at, rg.updated_at
            FROM iam_role_groups rg
            JOIN iam_user_role_groups urg ON urg.role_group_id = rg.id
            WHERE urg.user_id = $1
            "#,
        )
        .bind(user_id)
        .fetch_all(pool)
        .await
    }
}
