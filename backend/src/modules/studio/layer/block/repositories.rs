use sqlx::PgPool;
use uuid::Uuid;
use super::model::{LayerBlockEntity, CreateLayerBlockDto, UpdateLayerBlockDto};

pub struct LayerBlockRepository;

impl LayerBlockRepository {
    pub async fn create(pool: &PgPool, dto: CreateLayerBlockDto) -> Result<LayerBlockEntity, sqlx::Error> {
        let max_order: (Option<i32>,) = sqlx::query_as(
            "SELECT MAX(order_index) FROM layer_blocks WHERE layer_id = $1"
        )
        .bind(dto.layer_id)
        .fetch_one(pool)
        .await?;

        let next_order = max_order.0.unwrap_or(0) + 1;

        let block = sqlx::query_as::<_, LayerBlockEntity>(
            r#"
            INSERT INTO layer_blocks (
                layer_id, playlist_id, media_item_id, start_time_seconds, duration_seconds, order_index, trim_start_seconds, trim_end_seconds, transition_id, visual_filter_id
            ) VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 0), $8, $9, $10)
            RETURNING *
            "#
        )
        .bind(dto.layer_id)
        .bind(dto.playlist_id)
        .bind(dto.media_item_id)
        .bind(dto.start_time_seconds)
        .bind(dto.duration_seconds)
        .bind(next_order)
        .bind(dto.trim_start_seconds)
        .bind(dto.trim_end_seconds)
        .bind(dto.transition_id)
        .bind(dto.visual_filter_id)
        .fetch_one(pool)
        .await?;

        Ok(block)
    }

    pub async fn get_by_id(pool: &PgPool, id: Uuid) -> Result<Option<LayerBlockEntity>, sqlx::Error> {
        sqlx::query_as::<_, LayerBlockEntity>("SELECT * FROM layer_blocks WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await
    }

    pub async fn list(pool: &PgPool, layer_id: Option<Uuid>, limit: i64, offset: i64) -> Result<(Vec<LayerBlockEntity>, i64), sqlx::Error> {
        let (total,): (i64,) = if let Some(lid) = layer_id {
            sqlx::query_as("SELECT COUNT(*) FROM layer_blocks WHERE layer_id = $1").bind(lid).fetch_one(pool).await?
        } else {
            sqlx::query_as("SELECT COUNT(*) FROM layer_blocks").fetch_one(pool).await?
        };

        let blocks = if let Some(lid) = layer_id {
            sqlx::query_as::<_, LayerBlockEntity>("SELECT * FROM layer_blocks WHERE layer_id = $1 ORDER BY order_index ASC LIMIT $2 OFFSET $3")
                .bind(lid).bind(limit).bind(offset).fetch_all(pool).await?
        } else {
            sqlx::query_as::<_, LayerBlockEntity>("SELECT * FROM layer_blocks ORDER BY created_at DESC LIMIT $1 OFFSET $2")
                .bind(limit).bind(offset).fetch_all(pool).await?
        };

        Ok((blocks, total))
    }

    pub async fn update(pool: &PgPool, id: Uuid, dto: UpdateLayerBlockDto) -> Result<LayerBlockEntity, sqlx::Error> {
        let block = sqlx::query_as::<_, LayerBlockEntity>(
            r#"
            UPDATE layer_blocks
            SET
                start_time_seconds = COALESCE($2, start_time_seconds),
                duration_seconds = COALESCE($3, duration_seconds),
                trim_start_seconds = COALESCE($4, trim_start_seconds),
                trim_end_seconds = COALESCE($5, trim_end_seconds),
                transition_id = COALESCE($6, transition_id),
                visual_filter_id = COALESCE($7, visual_filter_id),
                order_index = COALESCE($8, order_index),
                is_muted = COALESCE($9, is_muted),
                volume_level = COALESCE($10, volume_level),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#
        )
        .bind(id)
        .bind(dto.start_time_seconds)
        .bind(dto.duration_seconds)
        .bind(dto.trim_start_seconds)
        .bind(dto.trim_end_seconds)
        .bind(dto.transition_id)
        .bind(dto.visual_filter_id)
        .bind(dto.order_index)
        .bind(dto.is_muted)
        .bind(dto.volume_level)
        .fetch_one(pool)
        .await?;

        Ok(block)
    }

    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM layer_blocks WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }
}
