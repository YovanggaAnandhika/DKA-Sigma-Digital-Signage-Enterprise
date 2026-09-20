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

        let user = sqlx::query_as::<_, UserEntity>(
            r#"
            INSERT INTO users (email, password_hash, full_name)
            VALUES ($1, $2, $3)
            RETURNING id, email, password_hash, full_name, is_active, created_at, updated_at
            "#,
        )
        .bind(dto.email)
        .bind(password_hash)
        .bind(dto.full_name)
        .fetch_one(&mut *tx)
        .await?;

        if let Some(role_ids) = dto.role_ids {
            for role_id in role_ids {
                sqlx::query(
                    r#"
                    INSERT INTO user_roles (user_id, role_id)
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
                    INSERT INTO user_role_groups (user_id, role_group_id)
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
            SELECT id, email, password_hash, full_name, is_active, created_at, updated_at
            FROM users
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
            SELECT id, email, password_hash, full_name, is_active, created_at, updated_at
            FROM users
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
            SELECT id, email, password_hash, full_name, is_active, created_at, updated_at
            FROM users
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
            UPDATE users
            SET 
                full_name = COALESCE($2, full_name),
                is_active = COALESCE($3, is_active),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, email, password_hash, full_name, is_active, created_at, updated_at
            "#,
        )
        .bind(id)
        .bind(dto.full_name)
        .bind(dto.is_active)
        .fetch_one(&mut *tx)
        .await?;

        if let Some(role_ids) = dto.role_ids {
            sqlx::query("DELETE FROM user_roles WHERE user_id = $1")
                .bind(id)
                .execute(&mut *tx)
                .await?;

            for role_id in role_ids {
                sqlx::query(
                    r#"
                    INSERT INTO user_roles (user_id, role_id)
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
            sqlx::query("DELETE FROM user_role_groups WHERE user_id = $1")
                .bind(id)
                .execute(&mut *tx)
                .await?;

            for group_id in group_ids {
                sqlx::query(
                    r#"
                    INSERT INTO user_role_groups (user_id, role_group_id)
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
        let result = sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
