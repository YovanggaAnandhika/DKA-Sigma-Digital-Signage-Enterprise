use super::model::{
    CreateLayoutDto, CreateZoneDto, LayoutEntity, LayoutWithZonesDto, UpdateLayoutDto,
    UpdateZoneDto, ZoneEntity,
};
use super::repositories::LayoutRepository;
use crate::common::AppError;
use crate::db::DbPool;
use uuid::Uuid;

pub struct LayoutService;

impl LayoutService {
    pub async fn create_layout(
        pool: &DbPool,
        dto: CreateLayoutDto,
    ) -> Result<LayoutEntity, AppError> {
        let layout = LayoutRepository::create(pool, dto).await?;
        Ok(layout)
    }

    pub async fn get_layout_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<LayoutWithZonesDto, AppError> {
        let layout = LayoutRepository::find_by_id(pool, id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Layout {} not found", id)))?;

        let zones = LayoutRepository::get_zones_by_layout_id(pool, id).await?;

        Ok(LayoutWithZonesDto { layout, zones })
    }

    pub async fn list_layouts(pool: &DbPool) -> Result<Vec<LayoutEntity>, AppError> {
        let layouts = LayoutRepository::find_all(pool).await?;
        Ok(layouts)
    }

    pub async fn update_layout(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateLayoutDto,
    ) -> Result<LayoutEntity, AppError> {
        let layout = LayoutRepository::update(pool, id, dto).await?;
        Ok(layout)
    }

    pub async fn delete_layout(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let deleted = LayoutRepository::delete(pool, id).await?;
        Ok(deleted)
    }

    // Zone operations
    pub async fn create_zone(pool: &DbPool, dto: CreateZoneDto) -> Result<ZoneEntity, AppError> {
        let layout = LayoutRepository::find_by_id(pool, dto.layout_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Associated layout not found".into()))?;

        // Validate zone bounding box within canvas dimensions
        if dto.x < 0 || dto.y < 0 || (dto.x + dto.width) > layout.canvas_width || (dto.y + dto.height) > layout.canvas_height {
            return Err(AppError::BadRequest(format!(
                "Zone dimensions ({}, {}, {}x{}) exceed canvas boundaries ({})",
                dto.x, dto.y, dto.width, dto.height, layout.canvas_width
            )));
        }

        let zone = LayoutRepository::create_zone(pool, dto).await?;
        Ok(zone)
    }

    pub async fn get_zone_by_id(pool: &DbPool, id: Uuid) -> Result<ZoneEntity, AppError> {
        LayoutRepository::find_zone_by_id(pool, id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Zone {} not found", id)))
    }

    pub async fn update_zone(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateZoneDto,
    ) -> Result<ZoneEntity, AppError> {
        let zone = LayoutRepository::update_zone(pool, id, dto).await?;
        Ok(zone)
    }

    pub async fn delete_zone(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let deleted = LayoutRepository::delete_zone(pool, id).await?;
        Ok(deleted)
    }
}
