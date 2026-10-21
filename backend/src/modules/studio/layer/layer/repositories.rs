use super::model::{
    CreateLayerDto, LayerEntity, UpdateLayerDto
};
use crate::db::DbPool;
use uuid::Uuid;

pub struct LayerRepository;

impl LayerRepository {
    pub async fn create_layer(pool: &DbPool, dto: CreateLayerDto) -> Result<LayerEntity, sqlx::Error> {
        let layer = sqlx::query_as::<_, LayerEntity>(
            r#"
            INSERT INTO studio_layers (
                layout_id, name, x, y, width, height, z_index, background_color,
                opacity, overlay_color, overlay_opacity, border_radius, border_color, border_width
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
        .bind(dto.opacity.unwrap_or(1.0))
        .bind(dto.overlay_color.unwrap_or_else(|| "transparent".to_string()))
        .bind(dto.overlay_opacity.unwrap_or(0.0))
        .bind(dto.border_radius.unwrap_or(0))
        .bind(dto.border_color.unwrap_or_else(|| "transparent".to_string()))
        .bind(dto.border_width.unwrap_or(0))
        .fetch_one(pool)
        .await?;

        Ok(layer)
    }

    pub async fn find_layer_by_id(pool: &DbPool, id: Uuid) -> Result<Option<LayerEntity>, sqlx::Error> {
        let layer = sqlx::query_as::<_, LayerEntity>(
            "SELECT * FROM studio_layers WHERE id = $1",
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
            UPDATE studio_layers
            SET 
                name = COALESCE($2, name),
                x = COALESCE($3, x),
                y = COALESCE($4, y),
                width = COALESCE($5, width),
                height = COALESCE($6, height),
                z_index = COALESCE($7, z_index),
                background_color = COALESCE($8, background_color),
                opacity = COALESCE($9, opacity),
                overlay_color = COALESCE($10, overlay_color),
                overlay_opacity = COALESCE($11, overlay_opacity),
                border_radius = COALESCE($12, border_radius),
                border_color = COALESCE($13, border_color),
                border_width = COALESCE($14, border_width),
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
        .bind(dto.opacity)
        .bind(dto.overlay_color)
        .bind(dto.overlay_opacity)
        .bind(dto.border_radius)
        .bind(dto.border_color)
        .bind(dto.border_width)
        .fetch_one(pool)
        .await?;

        Ok(layer)
    }

    pub async fn delete_layer(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM studio_layers WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
