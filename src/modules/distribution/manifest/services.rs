use super::model::{
    CompiledManifestDto, ManifestAssetDto, ManifestSyncResponseDto, ZoneWithPlaylistDto,
};
use super::repositories::ManifestRepository;
use crate::common::AppError;
use crate::db::DbPool;
use crate::modules::distribution::canary::services::CanaryService;
use crate::modules::hardware::device::repositories::DeviceRepository;
use crate::modules::studio::layout::repositories::LayoutRepository;
use crate::modules::studio::playlist::services::PlaylistService;
use chrono::Utc;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use uuid::Uuid;

pub struct ManifestService;

impl ManifestService {
    pub async fn get_manifest_for_device(
        pool: &DbPool,
        device_id: Uuid,
        client_hash: Option<String>,
    ) -> Result<ManifestSyncResponseDto, AppError> {
        let device = DeviceRepository::find_by_id(pool, device_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Device not found".into()))?;

        let base_layout_id = match device.current_layout_id {
            Some(id) => id,
            None => {
                return Err(AppError::BadRequest(
                    "No layout is assigned to this device yet".into(),
                ));
            }
        };

        // Evaluate Canary gradual rollout
        let canary_res = CanaryService::evaluate_canary(
            pool,
            device.id,
            device.canary_group_id,
            base_layout_id,
        )
        .await?;

        let effective_layout_id = canary_res.effective_layout_id;

        // Fetch Layout
        let layout = LayoutRepository::find_by_id(pool, effective_layout_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Layout not found".into()))?;

        let zones = LayoutRepository::get_zones_by_layout_id(pool, effective_layout_id).await?;

        let mut enriched_zones = Vec::new();
        let mut required_assets_map: HashMap<Uuid, ManifestAssetDto> = HashMap::new();

        for dto_zone in zones {
            let mut mapped_blocks = Vec::new();
            for block in dto_zone.blocks {
                if let Ok(pl) = PlaylistService::get_playlist_by_id(pool, block.playlist_id).await {
                    for item in &pl.items {
                        if !required_assets_map.contains_key(&item.media_item_id) {
                            required_assets_map.insert(
                                item.media_item_id,
                                ManifestAssetDto {
                                    media_id: item.media_item_id,
                                    name: item.media_name.clone(),
                                    url: item.media_url.clone(),
                                    sha256_hash: "hash_placeholder".to_string(),
                                    file_size_bytes: 0,
                                    local_filename: format!("{}_{}", item.media_item_id, item.media_name),
                                    media_type: item.media_type.clone(),
                                },
                            );
                        }
                    }
                    mapped_blocks.push(crate::modules::distribution::manifest::model::ZonePlaylistBlockDto {
                        id: block.id,
                        start_time_seconds: block.start_time_seconds,
                        duration_seconds: block.duration_seconds,
                        transition_type: block.transition_type,
                        order_index: block.order_index,
                        playlist: pl,
                    });
                }
            }

            enriched_zones.push(ZoneWithPlaylistDto {
                id: dto_zone.zone.id,
                name: dto_zone.zone.name,
                x: dto_zone.zone.x,
                y: dto_zone.zone.y,
                width: dto_zone.zone.width,
                height: dto_zone.zone.height,
                z_index: dto_zone.zone.z_index,
                background_color: dto_zone.zone.background_color,
                blocks: mapped_blocks,
            });
        }

        let total_size: i64 = required_assets_map.values().map(|a| a.file_size_bytes).sum();
        let assets_vec: Vec<ManifestAssetDto> = required_assets_map.into_values().collect();

        // Compute checksum of the entire manifest structure
        let mut hasher = Sha256::new();
        hasher.update(format!("{}:{}:{:?}", effective_layout_id, enriched_zones.len(), assets_vec.len()).as_bytes());
        let version_hash = format!("{:x}", hasher.finalize());

        if let Some(client_h) = client_hash {
            if client_h == version_hash {
                return Ok(ManifestSyncResponseDto {
                    is_up_to_date: true,
                    manifest: None,
                });
            }
        }

        let compiled = CompiledManifestDto {
            manifest_id: Uuid::new_v4(),
            device_id,
            version_hash,
            generated_at: Utc::now().to_rfc3339(),
            layout_id: layout.id,
            layout_name: layout.name,
            canvas_width: layout.canvas_width,
            canvas_height: layout.canvas_height,
            orientation: layout.orientation,
            background_color: layout.background_color,
            background_image_url: layout.background_image_url,
            zones: enriched_zones,
            required_assets: assets_vec,
            total_download_size_bytes: total_size,
            is_canary: canary_res.is_in_canary,
        };

        Ok(ManifestSyncResponseDto {
            is_up_to_date: false,
            manifest: Some(compiled),
        })
    }

    pub async fn assign_layout(
        pool: &DbPool,
        device_id: Uuid,
        layout_id: Uuid,
    ) -> Result<(), AppError> {
        ManifestRepository::assign_layout_to_device(pool, device_id, layout_id).await?;
        Ok(())
    }
}
