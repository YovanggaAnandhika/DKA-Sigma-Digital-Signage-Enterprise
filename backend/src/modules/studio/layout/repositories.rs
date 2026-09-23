use super::model::{
    CreateLayoutDto, LayoutEntity, UpdateLayoutDto, LayoutWithLayersDto
};
use crate::modules::studio::layer::model::{LayerEntity, LayerBlockEntity, LayerBlockDto, LayerPlaylistItemOverrideEntity, LayerWithBlocksDto};
use crate::db::DbPool;
use uuid::Uuid;

pub struct LayoutRepository;

impl LayoutRepository {
    pub async fn create(pool: &DbPool, dto: CreateLayoutDto) -> Result<LayoutEntity, sqlx::Error> {
        let layout = sqlx::query_as::<_, LayoutEntity>(
            r#"
            INSERT INTO layouts (
                name, description, canvas_width, canvas_height, orientation_id,
                background_color, background_image_url
            )
            VALUES (, , , , , , )
            RETURNING *
            "#,
        )
        .bind(dto.name)
        .bind(dto.description)
        .bind(dto.canvas_width.unwrap_or(1920))
        .bind(dto.canvas_height.unwrap_or(1080))
        .bind(dto.orientation_id)
        .bind(dto.background_color.unwrap_or_else(|| "#000000".to_string()))
        .bind(dto.background_image_url)
        .fetch_one(pool)
        .await?;

        Ok(layout)
    }

    pub async fn find_by_id(pool: &DbPool, id: Uuid) -> Result<Option<LayoutEntity>, sqlx::Error> {
        let layout = sqlx::query_as::<_, LayoutEntity>("SELECT * FROM layouts WHERE id = ")
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
                name = COALESCE(, name),
                description = COALESCE(, description),
                canvas_width = COALESCE(, canvas_width),
                canvas_height = COALESCE(, canvas_height),
                orientation_id = COALESCE(, orientation_id),
                background_color = COALESCE(, background_color),
                background_image_url = COALESCE(, background_image_url),
                updated_at = NOW()
            WHERE id = 
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(dto.name)
        .bind(dto.description)
        .bind(dto.canvas_width)
        .bind(dto.canvas_height)
        .bind(dto.orientation_id)
        .bind(dto.background_color)
        .bind(dto.background_image_url)
        .fetch_one(pool)
        .await?;

        Ok(layout)
    }

    pub async fn delete(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM layouts WHERE id = ")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn get_layers_by_layout_id(
        pool: &DbPool,
        layout_id: Uuid,
    ) -> Result<Vec<LayerWithBlocksDto>, sqlx::Error> {
        let layers = sqlx::query_as::<_, LayerEntity>(
            "SELECT * FROM layers WHERE layout_id =  ORDER BY z_index ASC",
        )
        .bind(layout_id)
        .fetch_all(pool)
        .await?;

        let mut result = Vec::new();
        for layer in layers {
            let blocks = sqlx::query_as::<_, LayerBlockEntity>(
                "SELECT * FROM layer_blocks WHERE layer_id =  ORDER BY order_index ASC",
            )
            .bind(layer.id)
            .fetch_all(pool)
            .await?;

            let mut block_dtos = Vec::new();
            for block in blocks {
                let overrides = sqlx::query_as::<_, LayerPlaylistItemOverrideEntity>(
                    "SELECT * FROM layer_playlist_item_overrides WHERE layer_block_id = ",
                )
                .bind(block.id)
                .fetch_all(pool)
                .await?;
                
                block_dtos.push(LayerBlockDto {
                    block,
                    item_overrides: overrides,
                });
            }

            result.push(LayerWithBlocksDto { layer, blocks: block_dtos });
        }

        Ok(result)
    }
}
