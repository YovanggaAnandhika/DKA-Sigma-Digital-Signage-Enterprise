use sqlx::PgPool;
use uuid::Uuid;
use super::model::{LayerPlaylistItemOverrideEntity, CreateLayerItemOverrideDto, UpdateLayerItemOverrideDto};

pub struct LayerItemOverrideRepository;

impl LayerItemOverrideRepository {
    pub async fn create(pool: &PgPool, dto: CreateLayerItemOverrideDto) -> Result<LayerPlaylistItemOverrideEntity, sqlx::Error> {
        let override_ent = sqlx::query_as::<_, LayerPlaylistItemOverrideEntity>(
            r#"
            INSERT INTO layer_playlist_item_overrides (
                layer_block_id, playlist_item_id, is_muted, volume_level
            ) VALUES ($1, $2, $3, $4)
            RETURNING *
            "#
        )
        .bind(dto.layer_block_id)
        .bind(dto.playlist_item_id)
        .bind(dto.is_muted)
        .bind(dto.volume_level)
        .fetch_one(pool)
        .await?;

        Ok(override_ent)
    }

    pub async fn get_by_id(pool: &PgPool, id: Uuid) -> Result<Option<LayerPlaylistItemOverrideEntity>, sqlx::Error> {
        sqlx::query_as::<_, LayerPlaylistItemOverrideEntity>("SELECT * FROM layer_playlist_item_overrides WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await
    }

    pub async fn list(pool: &PgPool, layer_block_id: Option<Uuid>, limit: i64, offset: i64) -> Result<(Vec<LayerPlaylistItemOverrideEntity>, i64), sqlx::Error> {
        let (total,): (i64,) = if let Some(lid) = layer_block_id {
            sqlx::query_as("SELECT COUNT(*) FROM layer_playlist_item_overrides WHERE layer_block_id = $1").bind(lid).fetch_one(pool).await?
        } else {
            sqlx::query_as("SELECT COUNT(*) FROM layer_playlist_item_overrides").fetch_one(pool).await?
        };

        let overrides = if let Some(lid) = layer_block_id {
            sqlx::query_as::<_, LayerPlaylistItemOverrideEntity>("SELECT * FROM layer_playlist_item_overrides WHERE layer_block_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3")
                .bind(lid).bind(limit).bind(offset).fetch_all(pool).await?
        } else {
            sqlx::query_as::<_, LayerPlaylistItemOverrideEntity>("SELECT * FROM layer_playlist_item_overrides ORDER BY created_at DESC LIMIT $1 OFFSET $2")
                .bind(limit).bind(offset).fetch_all(pool).await?
        };

        Ok((overrides, total))
    }

    pub async fn update(pool: &PgPool, id: Uuid, dto: UpdateLayerItemOverrideDto) -> Result<LayerPlaylistItemOverrideEntity, sqlx::Error> {
        let override_ent = sqlx::query_as::<_, LayerPlaylistItemOverrideEntity>(
            r#"
            UPDATE layer_playlist_item_overrides
            SET
                is_muted = COALESCE($2, is_muted),
                volume_level = COALESCE($3, volume_level),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#
        )
        .bind(id)
        .bind(dto.is_muted)
        .bind(dto.volume_level)
        .fetch_one(pool)
        .await?;

        Ok(override_ent)
    }

    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM layer_playlist_item_overrides WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }
}
