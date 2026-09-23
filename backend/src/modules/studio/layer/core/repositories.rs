use super::model::{
    CreateLayerDto, LayerEntity, UpdateLayerDto, LayerBlockEntity, LayerBlockDto, LayerPlaylistItemOverrideEntity
};
use crate::db::DbPool;
use uuid::Uuid;

pub struct LayerRepository;

impl LayerRepository {
    pub async fn create_layer(pool: &DbPool, dto: CreateLayerDto) -> Result<LayerEntity, sqlx::Error> {
        let layer = sqlx::query_as::<_, LayerEntity>(
            r#"
            INSERT INTO layers (
                layout_id, name, x, y, width, height, z_index, background_color
            )
            VALUES (, , , , , , , )
            RETURNING *
            "#,
        )
        .bind(dto.layout_id)
        .bind(dto.name.unwrap_or_else(|| "Layer".to_string()))
        .bind(dto.x)
        .bind(dto.y)
        .bind(dto.width)
        .bind(dto.height)
        .bind(dto.z_index.unwrap_or(0))
        .bind(dto.background_color.unwrap_or_else(|| "transparent".to_string()))
        .fetch_one(pool)
        .await?;

        Ok(layer)
    }

    pub async fn find_layer_by_id(pool: &DbPool, id: Uuid) -> Result<Option<LayerEntity>, sqlx::Error> {
        let layer = sqlx::query_as::<_, LayerEntity>(
            "SELECT * FROM layers WHERE id = ",
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(layer)
    }

    pub async fn update_layer(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateLayerDto,
    ) -> Result<LayerEntity, sqlx::Error> {
        let layer = sqlx::query_as::<_, LayerEntity>(
            r#"
            UPDATE layers
            SET 
                name = COALESCE(, name),
                x = COALESCE(, x),
                y = COALESCE(, y),
                width = COALESCE(, width),
                height = COALESCE(, height),
                z_index = COALESCE(, z_index),
                background_color = COALESCE(, background_color),
                updated_at = NOW()
            WHERE id = 
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(dto.name)
        .bind(dto.x)
        .bind(dto.y)
        .bind(dto.width)
        .bind(dto.height)
        .bind(dto.z_index)
        .bind(dto.background_color)
        .fetch_one(pool)
        .await?;

        Ok(layer)
    }

    pub async fn delete_layer(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM layers WHERE id = ")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    
    
    
    
    
    pub async fn create_block(pool: &DbPool, dto: super::model::CreateLayerBlockDto) -> Result<LayerBlockEntity, sqlx::Error> {
        let max_order: (Option<i32>,) = sqlx::query_as(
            "SELECT MAX(order_index) FROM layer_blocks WHERE layer_id = "
        )
        .bind(dto.layer_id)
        .fetch_one(pool)
        .await?;

        let next_order = max_order.0.unwrap_or(0) + 1;

        let block = sqlx::query_as::<_, LayerBlockEntity>(
            r#"
            INSERT INTO layer_blocks (
                layer_id, playlist_id, media_item_id, start_time_seconds, duration_seconds, order_index
            ) VALUES (, , , , , )
            RETURNING *
            "#
        )
        .bind(dto.layer_id)
        .bind(dto.playlist_id)
        .bind(dto.media_item_id)
        .bind(dto.start_time_seconds)
        .bind(dto.duration_seconds)
        .bind(next_order)
        .fetch_one(pool)
        .await?;

        Ok(block)
    }

    pub async fn update_block(pool: &DbPool, id: Uuid, dto: super::model::UpdateLayerBlockDto) -> Result<LayerBlockEntity, sqlx::Error> {
        let block = sqlx::query_as::<_, LayerBlockEntity>(
            r#"
            UPDATE layer_blocks
            SET
                start_time_seconds = COALESCE(, start_time_seconds),
                duration_seconds = COALESCE(, duration_seconds),
                transition_type = CASE WHEN  = 'none' THEN NULL WHEN  IS NOT NULL THEN  ELSE transition_type END,
                order_index = COALESCE(, order_index),
                is_muted = COALESCE(, is_muted),
                volume_level = COALESCE(, volume_level)
            WHERE id = 
            RETURNING *
            "#
        )
        .bind(id)
        .bind(dto.start_time_seconds)
        .bind(dto.duration_seconds)
        .bind(dto.transition_type)
        .bind(dto.order_index)
        .bind(dto.is_muted)
        .bind(dto.volume_level)
        .fetch_one(pool)
        .await?;

        Ok(block)
    }

    pub async fn delete_block(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM layer_blocks WHERE id = ")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

}
