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
        
        let transitions = sqlx::query_as::<_, Transition>(
            r#"
            SELECT * FROM studio_transitions
            WHERE name ILIKE $1
            ORDER BY name ASC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(&search_term)
        .bind(limit as i64)
        .bind(offset as i64)
        .fetch_all(&self.pool)
        .await?;

        let total_row: (i64,) = sqlx::query_as(
            r#"
            SELECT count(*) FROM studio_transitions
            WHERE name ILIKE $1
            "#,
        )
        .bind(&search_term)
        .fetch_one(&self.pool)
        .await?;

        Ok((transitions, total_row.0 as i32))
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<Transition>, sqlx::Error> {
        sqlx::query_as::<_, Transition>(
            r#"
            SELECT * FROM studio_transitions WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn create(&self, name: &str, css_class: &str, duration_ms: i32) -> Result<Transition, sqlx::Error> {
        sqlx::query_as::<_, Transition>(
            r#"
            INSERT INTO studio_transitions (name, css_class, duration_ms)
            VALUES ($1, $2, $3)
            RETURNING *
            "#,
        )
        .bind(name)
        .bind(css_class)
        .bind(duration_ms)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn update(&self, id: Uuid, name: Option<&str>, css_class: Option<&str>, duration_ms: Option<i32>) -> Result<Transition, sqlx::Error> {
        sqlx::query_as::<_, Transition>(
            r#"
            UPDATE studio_transitions
            SET
                name = COALESCE($2, name),
                css_class = COALESCE($3, css_class),
                duration_ms = COALESCE($4, duration_ms),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(name)
        .bind(css_class)
        .bind(duration_ms)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            r#"
            DELETE FROM studio_transitions WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}
