use super::model::{
    CreateLayoutDto, CreateZoneDto, LayoutEntity, UpdateLayoutDto, UpdateZoneDto, ZoneEntity,
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
    ) -> Result<Vec<ZoneEntity>, sqlx::Error> {
        let zones = sqlx::query_as::<_, ZoneEntity>(
            "SELECT * FROM zones WHERE layout_id = $1 ORDER BY z_index ASC",
        )
        .bind(layout_id)
        .fetch_all(pool)
        .await?;

        Ok(zones)
    }

    pub async fn create_zone(pool: &DbPool, dto: CreateZoneDto) -> Result<ZoneEntity, sqlx::Error> {
        let zone = sqlx::query_as::<_, ZoneEntity>(
            r#"
            INSERT INTO zones (
                layout_id, name, x, y, width, height, z_index,
                assigned_playlist_id, background_color
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
        .bind(dto.assigned_playlist_id)
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
                assigned_playlist_id = COALESCE($8, assigned_playlist_id),
                background_color = COALESCE($9, background_color),
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
        .bind(dto.assigned_playlist_id)
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
}
