use super::model::{
    CreateLayoutDto, CreateZoneDto, LayoutEntity, UpdateLayoutDto, UpdateZoneDto, ZoneBlockEntity, ZoneBlockDto, ZoneEntity, ZoneWithBlocksDto,
};
use crate::db::DbPool;
use uuid::Uuid;

pub struct LayoutRepository;

impl LayoutRepository {
    pub async fn create(pool: &DbPool, dto: CreateLayoutDto) -> Result<LayoutEntity, sqlx::Error> {
        let layout = sqlx::query_as::<_, LayoutEntity>(
            r#"
            INSERT INTO layouts (
                name, description, canvas_width, canvas_height, orientation,
                background_color, background_image_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            "#,
        )
        .bind(dto.name)
        .bind(dto.description)
        .bind(dto.canvas_width.unwrap_or(1920))
        .bind(dto.canvas_height.unwrap_or(1080))
        .bind(dto.orientation.unwrap_or_else(|| "landscape".to_string()))
        .bind(dto.background_color.unwrap_or_else(|| "#000000".to_string()))
        .bind(dto.background_image_url)
        .fetch_one(pool)
        .await?;

        Ok(layout)
    }

    pub async fn find_by_id(pool: &DbPool, id: Uuid) -> Result<Option<LayoutEntity>, sqlx::Error> {
        let layout = sqlx::query_as::<_, LayoutEntity>("SELECT * FROM layouts WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await?;

        Ok(layout)
    }

    pub async fn find_all(pool: &DbPool) -> Result<Vec<LayoutEntity>, sqlx::Error> {
        let layouts = sqlx::query_as::<_, LayoutEntity>(
            "SELECT * FROM layouts ORDER BY name ASC",
        )
        .fetch_all(pool)
        .await?;

        Ok(layouts)
    }

    pub async fn update(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateLayoutDto,
    ) -> Result<LayoutEntity, sqlx::Error> {
        let layout = sqlx::query_as::<_, LayoutEntity>(
            r#"
            UPDATE layouts
            SET 
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                canvas_width = COALESCE($4, canvas_width),
                canvas_height = COALESCE($5, canvas_height),
                orientation = COALESCE($6, orientation),
                background_color = COALESCE($7, background_color),
                background_image_url = COALESCE($8, background_image_url),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(dto.name)
        .bind(dto.description)
        .bind(dto.canvas_width)
        .bind(dto.canvas_height)
        .bind(dto.orientation)
        .bind(dto.background_color)
        .bind(dto.background_image_url)
        .fetch_one(pool)
        .await?;

        Ok(layout)
    }

    pub async fn delete(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM layouts WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    // Zones CRUD
    pub async fn get_zones_by_layout_id(
        pool: &DbPool,
        layout_id: Uuid,
    ) -> Result<Vec<ZoneWithBlocksDto>, sqlx::Error> {
        let zones = sqlx::query_as::<_, ZoneEntity>(
            "SELECT * FROM zones WHERE layout_id = $1 ORDER BY z_index ASC",
        )
        .bind(layout_id)
        .fetch_all(pool)
        .await?;

        let mut result = Vec::new();
        for zone in zones {
            let blocks = sqlx::query_as::<_, ZoneBlockEntity>(
                "SELECT * FROM zone_blocks WHERE zone_id = $1 ORDER BY order_index ASC",
            )
            .bind(zone.id)
            .fetch_all(pool)
            .await?;

            let mut block_dtos = Vec::new();
            for block in blocks {
                let overrides = sqlx::query_as::<_, crate::modules::studio::layout::model::ZonePlaylistItemOverrideEntity>(
                    "SELECT * FROM zone_playlist_item_overrides WHERE zone_block_id = $1",
                )
                .bind(block.id)
                .fetch_all(pool)
                .await?;
                
                block_dtos.push(ZoneBlockDto {
                    block,
                    item_overrides: overrides,
                });
            }

            result.push(ZoneWithBlocksDto { zone, blocks: block_dtos });
        }

        Ok(result)
    }

    pub async fn create_zone(pool: &DbPool, dto: CreateZoneDto) -> Result<ZoneEntity, sqlx::Error> {
        let zone = sqlx::query_as::<_, ZoneEntity>(
            r#"
            INSERT INTO zones (
                layout_id, name, x, y, width, height, z_index, background_color
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            "#,
        )
        .bind(dto.layout_id)
        .bind(dto.name.unwrap_or_else(|| "Zone".to_string()))
        .bind(dto.x)
        .bind(dto.y)
        .bind(dto.width)
        .bind(dto.height)
        .bind(dto.z_index.unwrap_or(0))
        .bind(dto.background_color.unwrap_or_else(|| "transparent".to_string()))
        .fetch_one(pool)
        .await?;

        Ok(zone)
    }

    pub async fn find_zone_by_id(pool: &DbPool, id: Uuid) -> Result<Option<ZoneEntity>, sqlx::Error> {
        let zone = sqlx::query_as::<_, ZoneEntity>(
            "SELECT * FROM zones WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(zone)
    }

    pub async fn update_zone(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateZoneDto,
    ) -> Result<ZoneEntity, sqlx::Error> {
        let zone = sqlx::query_as::<_, ZoneEntity>(
            r#"
            UPDATE zones
            SET 
                name = COALESCE($2, name),
                x = COALESCE($3, x),
                y = COALESCE($4, y),
                width = COALESCE($5, width),
                height = COALESCE($6, height),
                z_index = COALESCE($7, z_index),
                background_color = COALESCE($8, background_color),
                updated_at = NOW()
            WHERE id = $1
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

        Ok(zone)
    }

    pub async fn delete_zone(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM zones WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn add_playlist_block(
        pool: &DbPool,
        zone_id: Uuid,
        playlist_id: Uuid,
        start_time_seconds: i32,
        duration_seconds: i32,
    ) -> Result<ZoneBlockEntity, sqlx::Error> {
        // get max order_index
        let max_order: (Option<i32>,) = sqlx::query_as(
            "SELECT MAX(order_index) FROM zone_blocks WHERE zone_id = $1"
        )
        .bind(zone_id)
        .fetch_one(pool)
        .await?;

        let next_order = max_order.0.unwrap_or(0) + 1;

        let block = sqlx::query_as::<_, ZoneBlockEntity>(
            r#"
            INSERT INTO zone_blocks (
                zone_id, playlist_id, start_time_seconds, duration_seconds, order_index
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#
        )
        .bind(zone_id)
        .bind(playlist_id)
        .bind(start_time_seconds)
        .bind(duration_seconds)
        .bind(next_order)
        .fetch_one(pool)
        .await?;

        Ok(block)
    }

    pub async fn add_media_block(
        pool: &DbPool,
        zone_id: Uuid,
        media_item_id: Uuid,
        start_time_seconds: i32,
        duration_seconds: i32,
    ) -> Result<ZoneBlockEntity, sqlx::Error> {
        let max_order: (Option<i32>,) = sqlx::query_as(
            "SELECT MAX(order_index) FROM zone_blocks WHERE zone_id = $1"
        )
        .bind(zone_id)
        .fetch_one(pool)
        .await?;

        let next_order = max_order.0.unwrap_or(0) + 1;

        let block = sqlx::query_as::<_, ZoneBlockEntity>(
            r#"
            INSERT INTO zone_blocks (
                zone_id, media_item_id, start_time_seconds, duration_seconds, order_index
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#
        )
        .bind(zone_id)
        .bind(media_item_id)
        .bind(start_time_seconds)
        .bind(duration_seconds)
        .bind(next_order)
        .fetch_one(pool)
        .await?;

        Ok(block)
    }

    pub async fn update_playlist_block(
        pool: &DbPool,
        id: Uuid,
        start_time_seconds: Option<i32>,
        duration_seconds: Option<i32>,
        transition_type: Option<String>,
        order_index: Option<i32>,
        is_muted: Option<bool>,
    ) -> Result<ZoneBlockEntity, sqlx::Error> {
        let block = sqlx::query_as::<_, ZoneBlockEntity>(
            r#"
            UPDATE zone_blocks
            SET
                start_time_seconds = COALESCE($2, start_time_seconds),
                duration_seconds = COALESCE($3, duration_seconds),
                transition_type = CASE WHEN $4 = 'none' THEN NULL WHEN $4 IS NOT NULL THEN $4 ELSE transition_type END,
                order_index = COALESCE($5, order_index),
                is_muted = COALESCE($6, is_muted)
            WHERE id = $1
            RETURNING *
            "#
        )
        .bind(id)
        .bind(start_time_seconds)
        .bind(duration_seconds)
        .bind(transition_type)
        .bind(order_index)
        .bind(is_muted)
        .fetch_one(pool)
        .await?;

        Ok(block)
    }

    pub async fn remove_playlist_block(pool: &DbPool, block_id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM zone_blocks WHERE id = $1")
            .bind(block_id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn set_playlist_item_override(
        pool: &DbPool,
        zone_playlist_id: Uuid,
        playlist_item_id: Uuid,
        is_muted: bool,
    ) -> Result<crate::modules::studio::layout::model::ZonePlaylistItemOverrideEntity, sqlx::Error> {
        let override_ent = sqlx::query_as::<_, crate::modules::studio::layout::model::ZonePlaylistItemOverrideEntity>(
            r#"
            INSERT INTO zone_playlist_item_overrides (zone_block_id, playlist_item_id, is_muted)
            VALUES ($1, $2, $3)
            ON CONFLICT (zone_block_id, playlist_item_id)
            DO UPDATE SET is_muted = $3, updated_at = CURRENT_TIMESTAMP
            RETURNING *
            "#,
        )
        .bind(zone_playlist_id)
        .bind(playlist_item_id)
        .bind(is_muted)
        .fetch_one(pool)
        .await?;

        Ok(override_ent)
    }
}
