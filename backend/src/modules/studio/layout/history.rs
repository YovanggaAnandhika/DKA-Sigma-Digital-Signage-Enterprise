use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::FromRow;
use uuid::Uuid;

use crate::common::AppError;
use crate::db::DbPool;
use super::model::LayoutWithLayersDto;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct LayoutHistoryEntity {
    pub id: Uuid,
    pub layout_id: Uuid,
    #[sqlx(default)]
    pub layout_name: Option<String>,
    pub version_hash: String,
    pub snapshot_json: serde_json::Value,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

pub struct LayoutHistoryRepository;

impl LayoutHistoryRepository {
    pub async fn create(
        pool: &DbPool,
        layout_id: Uuid,
        version_hash: &str,
        snapshot_json: serde_json::Value,
        description: Option<&str>,
    ) -> Result<LayoutHistoryEntity, sqlx::Error> {
        let row = sqlx::query_as::<_, LayoutHistoryEntity>(
            r#"
            INSERT INTO layout_history (layout_id, version_hash, snapshot_json, description)
            VALUES ($1, $2, $3, $4)
            RETURNING id, layout_id, NULL as layout_name, version_hash, snapshot_json, description, created_at
            "#,
        )
        .bind(layout_id)
        .bind(version_hash)
        .bind(snapshot_json)
        .bind(description)
        .fetch_one(pool)
        .await?;

        Ok(row)
    }

    pub async fn find_all(
        pool: &DbPool,
        layout_id: Option<Uuid>,
        search: Option<String>,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<LayoutHistoryEntity>, sqlx::Error> {
        let search_pattern = search.map(|s| format!("%{}%", s));

        let rows = sqlx::query_as::<_, LayoutHistoryEntity>(
            r#"
            SELECT h.id, h.layout_id, l.name as layout_name, h.version_hash, h.snapshot_json, h.description, h.created_at
            FROM layout_history h
            JOIN layouts l ON h.layout_id = l.id
            WHERE ($1::uuid IS NULL OR h.layout_id = $1)
              AND ($2::text IS NULL OR l.name ILIKE $2 OR h.version_hash ILIKE $2 OR h.description ILIKE $2)
            ORDER BY h.created_at DESC
            LIMIT $3 OFFSET $4
            "#,
        )
        .bind(layout_id)
        .bind(search_pattern)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        Ok(rows)
    }

    pub async fn count(
        pool: &DbPool,
        layout_id: Option<Uuid>,
        search: Option<String>,
    ) -> Result<i64, sqlx::Error> {
        let search_pattern = search.map(|s| format!("%{}%", s));

        let total = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM layout_history h
            JOIN layouts l ON h.layout_id = l.id
            WHERE ($1::uuid IS NULL OR h.layout_id = $1)
              AND ($2::text IS NULL OR l.name ILIKE $2 OR h.version_hash ILIKE $2 OR h.description ILIKE $2)
            "#,
        )
        .bind(layout_id)
        .bind(search_pattern)
        .fetch_one(pool)
        .await?;

        Ok(total)
    }

    pub async fn find_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<Option<LayoutHistoryEntity>, sqlx::Error> {
        let row = sqlx::query_as::<_, LayoutHistoryEntity>(
            r#"
            SELECT h.id, h.layout_id, l.name as layout_name, h.version_hash, h.snapshot_json, h.description, h.created_at
            FROM layout_history h
            JOIN layouts l ON h.layout_id = l.id
            WHERE h.id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(row)
    }

    pub async fn find_by_version_hash(
        pool: &DbPool,
        version_hash: &str,
    ) -> Result<Option<LayoutHistoryEntity>, sqlx::Error> {
        let row = sqlx::query_as::<_, LayoutHistoryEntity>(
            r#"
            SELECT h.id, h.layout_id, l.name as layout_name, h.version_hash, h.snapshot_json, h.description, h.created_at
            FROM layout_history h
            JOIN layouts l ON h.layout_id = l.id
            WHERE h.version_hash = $1
            ORDER BY h.created_at DESC
            LIMIT 1
            "#,
        )
        .bind(version_hash)
        .fetch_optional(pool)
        .await?;

        Ok(row)
    }

    pub async fn rollback(
        pool: &DbPool,
        history_id: Uuid,
    ) -> Result<Uuid, AppError> {
        let history = Self::find_by_id(pool, history_id)
            .await
            .map_err(AppError::Database)?
            .ok_or_else(|| AppError::NotFound("Riwayat versi tidak ditemukan".to_string()))?;

        let snapshot: LayoutWithLayersDto = serde_json::from_value(history.snapshot_json.clone())
            .map_err(|e| AppError::Internal(format!("Gagal membaca snapshot JSON: {}", e)))?;

        let mut tx = pool.begin().await.map_err(AppError::Database)?;

        // 1. Restore layout metadata
        sqlx::query(
            r#"
            UPDATE layouts
            SET name = $2,
                canvas_width = $3,
                canvas_height = $4,
                background_color = $5,
                background_image_url = $6,
                description = $7,
                updated_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(snapshot.layout.id)
        .bind(&snapshot.layout.name)
        .bind(snapshot.layout.canvas_width)
        .bind(snapshot.layout.canvas_height)
        .bind(&snapshot.layout.background_color)
        .bind(&snapshot.layout.background_image_url)
        .bind(&snapshot.layout.description)
        .execute(&mut *tx)
        .await
        .map_err(AppError::Database)?;

        // 2. Clear current layers & layer_blocks for this layout (cascades blocks)
        sqlx::query("DELETE FROM layers WHERE layout_id = $1")
            .bind(snapshot.layout.id)
            .execute(&mut *tx)
            .await
            .map_err(AppError::Database)?;

        // 3. Re-insert layers & blocks from snapshot
        for layer_dto in &snapshot.layers {
            let l = &layer_dto.layer;
            let layer_id = Uuid::new_v4();

            sqlx::query(
                r#"
                INSERT INTO layers (
                    id, layout_id, name, x, y, width, height, z_index,
                    background_color, opacity, overlay_color, overlay_opacity,
                    border_radius, border_color, border_width, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
                "#,
            )
            .bind(layer_id)
            .bind(snapshot.layout.id)
            .bind(&l.name)
            .bind(l.x)
            .bind(l.y)
            .bind(l.width)
            .bind(l.height)
            .bind(l.z_index)
            .bind(&l.background_color)
            .bind(l.opacity)
            .bind(&l.overlay_color)
            .bind(l.overlay_opacity)
            .bind(l.border_radius)
            .bind(&l.border_color)
            .bind(l.border_width)
            .execute(&mut *tx)
            .await
            .map_err(AppError::Database)?;

            for block_dto in &layer_dto.blocks {
                let b = &block_dto.block;
                let block_id = Uuid::new_v4();
                sqlx::query(
                    r#"
                    INSERT INTO layer_blocks (
                        id, layer_id, playlist_id, media_item_id, start_time_seconds,
                        duration_seconds, trim_start_seconds, trim_end_seconds,
                        transition_id, visual_filter_id, order_index, is_muted,
                        volume_level, ticker_id, clock_id, webview_id, queue_id,
                        album_id, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                        $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
                    )
                    "#,
                )
                .bind(block_id)
                .bind(layer_id)
                .bind(b.playlist_id)
                .bind(b.media_item_id)
                .bind(b.start_time_seconds)
                .bind(b.duration_seconds)
                .bind(b.trim_start_seconds)
                .bind(b.trim_end_seconds)
                .bind(b.transition_id)
                .bind(b.visual_filter_id)
                .bind(b.order_index)
                .bind(b.is_muted)
                .bind(b.volume_level)
                .bind(b.ticker_id)
                .bind(b.clock_id)
                .bind(b.webview_id)
                .bind(b.queue_id)
                .bind(b.album_id)
                .execute(&mut *tx)
                .await
                .map_err(AppError::Database)?;

                for item_override in &block_dto.item_overrides {
                    sqlx::query(
                        r#"
                        INSERT INTO layer_playlist_item_overrides (
                            id, layer_block_id, playlist_item_id, is_muted, volume_level,
                            created_at, updated_at
                        ) VALUES (
                            gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()
                        )
                        "#,
                    )
                    .bind(block_id)
                    .bind(item_override.playlist_item_id)
                    .bind(item_override.is_muted)
                    .bind(item_override.volume_level)
                    .execute(&mut *tx)
                    .await
                    .map_err(AppError::Database)?;
                }
            }
        }

        // 4. Record new history entry for this rollback
        let short_hash = if history.version_hash.len() > 8 {
            &history.version_hash[..8]
        } else {
            &history.version_hash
        };
        let desc = format!("Rollback ke versi {}", short_hash);

        let mut hasher = Sha256::new();
        hasher.update(serde_json::to_string(&snapshot).unwrap_or_default().as_bytes());
        let new_hash = format!("{:x}", hasher.finalize());

        sqlx::query(
            r#"
            INSERT INTO layout_history (layout_id, version_hash, snapshot_json, description)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(snapshot.layout.id)
        .bind(new_hash)
        .bind(history.snapshot_json)
        .bind(desc)
        .execute(&mut *tx)
        .await
        .map_err(AppError::Database)?;

        tx.commit().await.map_err(AppError::Database)?;

        Ok(snapshot.layout.id)
    }
}
