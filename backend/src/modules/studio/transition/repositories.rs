use sqlx::PgPool;
use uuid::Uuid;
use super::model::Transition;

pub struct TransitionRepository {
    pool: PgPool,
}

impl TransitionRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_all(&self, search: Option<&str>, limit: i32, offset: i32) -> Result<(Vec<Transition>, i32), sqlx::Error> {
        let search_term = search.map(|s| format!("%{}%", s)).unwrap_or_else(|| "%".to_string());
        
        let transitions = sqlx::query_as!(
            Transition,
            r#"
            SELECT * FROM transitions
            WHERE name ILIKE $1
            ORDER BY name ASC
            LIMIT $2 OFFSET $3
            "#,
            search_term,
            limit as i64,
            offset as i64
        )
        .fetch_all(&self.pool)
        .await?;

        let total_row = sqlx::query!(
            r#"
            SELECT count(*) as "total!" FROM transitions
            WHERE name ILIKE $1
            "#,
            search_term
        )
        .fetch_one(&self.pool)
        .await?;

        Ok((transitions, total_row.total as i32))
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<Transition>, sqlx::Error> {
        sqlx::query_as!(
            Transition,
            r#"
            SELECT * FROM transitions WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn create(&self, name: &str, css_class: &str, duration_ms: i32) -> Result<Transition, sqlx::Error> {
        sqlx::query_as!(
            Transition,
            r#"
            INSERT INTO transitions (name, css_class, duration_ms)
            VALUES ($1, $2, $3)
            RETURNING *
            "#,
            name,
            css_class,
            duration_ms
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn update(&self, id: Uuid, name: Option<&str>, css_class: Option<&str>, duration_ms: Option<i32>) -> Result<Transition, sqlx::Error> {
        sqlx::query_as!(
            Transition,
            r#"
            UPDATE transitions
            SET
                name = COALESCE($2, name),
                css_class = COALESCE($3, css_class),
                duration_ms = COALESCE($4, duration_ms),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
            id,
            name,
            css_class,
            duration_ms
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query!(
            r#"
            DELETE FROM transitions WHERE id = $1
            "#,
            id
        )
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}
