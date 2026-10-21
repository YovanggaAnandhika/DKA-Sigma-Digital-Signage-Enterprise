use sqlx::PgPool;
use uuid::Uuid;
use super::model::VisualFilter;

pub struct VisualFilterRepository {
    pool: PgPool,
}

impl VisualFilterRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_all(&self, search: Option<&str>, limit: i32, offset: i32) -> Result<(Vec<VisualFilter>, i32), sqlx::Error> {
        let search_term = search.map(|s| format!("%{}%", s)).unwrap_or_else(|| "%".to_string());
        
        let filters = sqlx::query_as::<_, VisualFilter>(
            r#"
            SELECT * FROM studio_visual_filters
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
            SELECT count(*) FROM studio_visual_filters
            WHERE name ILIKE $1
            "#,
        )
        .bind(&search_term)
        .fetch_one(&self.pool)
        .await?;

        Ok((filters, total_row.0 as i32))
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<VisualFilter>, sqlx::Error> {
        sqlx::query_as::<_, VisualFilter>(
            r#"
            SELECT * FROM studio_visual_filters WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn create(&self, name: &str, brightness: i32, contrast: i32, saturation: i32, hue_rotate: i32, blur_px: i32) -> Result<VisualFilter, sqlx::Error> {
        sqlx::query_as::<_, VisualFilter>(
            r#"
            INSERT INTO studio_visual_filters (name, brightness, contrast, saturation, hue_rotate, blur_px)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            "#,
        )
        .bind(name)
        .bind(brightness)
        .bind(contrast)
        .bind(saturation)
        .bind(hue_rotate)
        .bind(blur_px)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn update(&self, id: Uuid, name: Option<&str>, brightness: Option<i32>, contrast: Option<i32>, saturation: Option<i32>, hue_rotate: Option<i32>, blur_px: Option<i32>) -> Result<VisualFilter, sqlx::Error> {
        sqlx::query_as::<_, VisualFilter>(
            r#"
            UPDATE studio_visual_filters
            SET
                name = COALESCE($2, name),
                brightness = COALESCE($3, brightness),
                contrast = COALESCE($4, contrast),
                saturation = COALESCE($5, saturation),
                hue_rotate = COALESCE($6, hue_rotate),
                blur_px = COALESCE($7, blur_px),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(name)
        .bind(brightness)
        .bind(contrast)
        .bind(saturation)
        .bind(hue_rotate)
        .bind(blur_px)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query(
            r#"
            DELETE FROM studio_visual_filters WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}
