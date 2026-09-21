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
use chrono::{Datelike, Utc};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use uuid::Uuid;
use crate::modules::hardware::display_group::repositories::DisplayGroupRepository;
use crate::modules::studio::schedule::repositories::ScheduleRepository;
use chrono_tz::Tz;
use std::str::FromStr;

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

        let mut active_layout_id = device.current_layout_id;
        let mut active_schedule_id = device.schedule_id;

        // Display Group Fallback
        if let Some(group_id) = device.display_group_id {
            if let Ok(Some(group)) = DisplayGroupRepository::find_by_id(pool, group_id).await {
                if active_layout_id.is_none() {
                    active_layout_id = group.default_layout_id;
                }
                if active_schedule_id.is_none() {
                    active_schedule_id = group.schedule_id;
                }
            }
        }

        // Schedule Evaluation (Latest Schedule overrides previous)
        if let Some(schedule_id) = active_schedule_id {
            if let Ok(Some(schedule_with_events)) = ScheduleRepository::find_by_id(pool, schedule_id).await {
                let tz: Tz = device.timezone.parse().unwrap_or(chrono_tz::UTC);
                let now_local = Utc::now().with_timezone(&tz);
                let current_time = now_local.time();
                let current_day = now_local.weekday().number_from_monday().to_string(); // 1 = Monday, 7 = Sunday

                let mut latest_matched_event_created_at = None;

                for event in schedule_with_events.events {
                    if event.start_time <= current_time && event.end_time >= current_time {
                        let days: Vec<&str> = event.days_of_week.split(',').collect();
                        if days.contains(&current_day.as_str()) {
                            // Apply latest event logic
                            if let Some(latest_ts) = latest_matched_event_created_at {
                                if event.created_at > latest_ts {
                                    active_layout_id = Some(event.layout_id);
                                    latest_matched_event_created_at = Some(event.created_at);
                                }
                            } else {
                                active_layout_id = Some(event.layout_id);
                                latest_matched_event_created_at = Some(event.created_at);
                            }
                        }
                    }
                }
            }
        }

        let base_layout_id = match active_layout_id {
            Some(id) => id,
            None => {
                return Err(AppError::BadRequest(
                    "No layout is assigned to this device yet (including fallback layout)".into(),
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
                if let Some(pl_id) = block.block.playlist_id {
                if let Ok(pl) = PlaylistService::get_playlist_by_id(pool, pl_id).await {
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
                        id: block.block.id,
                        start_time_seconds: block.block.start_time_seconds,
                        duration_seconds: block.block.duration_seconds,
                        transition_type: block.block.transition_type,
                        order_index: block.block.order_index,
                        playlist: pl,
                    });
                }
                } // end if Some(pl_id)
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
