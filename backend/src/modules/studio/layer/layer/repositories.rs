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
            INSERT INTO layers (
                layout_id, name, x, y, width, height, z_index, background_color
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
            "SELECT * FROM layers WHERE id = $1",
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

        Ok(layer)
    }

    pub async fn delete_layer(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM layers WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
