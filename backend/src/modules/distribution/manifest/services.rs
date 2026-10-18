use super::model::{
    CompiledManifestDto, DevicePowerScheduleDto, ManifestAssetDto, ManifestSyncResponseDto};
use crate::modules::studio::layer::layer::model::LayerWithBlocksDto;
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
use crate::modules::studio::media::repositories::MediaRepository;
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

        // Schedule Evaluation (Priority first, then latest recency)
        if let Some(schedule_id) = active_schedule_id {
            if let Ok(Some(schedule_with_events)) = ScheduleRepository::find_by_id(pool, schedule_id).await {
                let tz: Tz = device.timezone.parse().unwrap_or(chrono_tz::UTC);
                let now_local = Utc::now().with_timezone(&tz);
                let now_date = now_local.date_naive();
                let current_time = now_local.time();
                let current_day = now_local.weekday().number_from_monday().to_string(); // 1 = Monday, 7 = Sunday

                let mut best_match: Option<(i32, chrono::DateTime<Utc>, Uuid)> = None;

                for event in schedule_with_events.events {
                    let is_date_match = match (event.start_date, event.end_date) {
                        (Some(s), Some(e)) => now_date >= s && now_date <= e,
                        (Some(s), None) => now_date >= s,
                        (None, Some(e)) => now_date <= e,
                        (None, None) => true,
                    };

                    let is_time_match = if event.start_time <= event.end_time {
                        event.start_time <= current_time && event.end_time >= current_time
                    } else {
                        // Overnight window (e.g. 22:00 to 04:00)
                        current_time >= event.start_time || current_time <= event.end_time
                    };

                    if is_date_match && is_time_match {
                        let days: Vec<&str> = event.days_of_week.split(',').collect();
                        if days.contains(&current_day.as_str()) {
                            let is_better = match &best_match {
                                None => true,
                                Some((best_priority, best_created, _)) => {
                                    event.priority > *best_priority
                                        || (event.priority == *best_priority && event.created_at > *best_created)
                                }
                            };
                            if is_better {
                                best_match = Some((event.priority, event.created_at, event.layout_id));
                            }
                        }
                    }
                }

                if let Some((_, _, layout_id)) = best_match {
                    active_layout_id = Some(layout_id);
                }
            }
        }

        let base_layout_id = match active_layout_id {
            Some(id) => id,
            None => {
                if let Ok(Some(fallback_id)) = sqlx::query_scalar::<_, Uuid>(
                    "SELECT id FROM layouts ORDER BY created_at ASC LIMIT 1"
                )
                .fetch_optional(pool)
                .await {
                    fallback_id
                } else {
                    return Ok(ManifestSyncResponseDto {
                        is_up_to_date: true,
                        manifest: None,
                    });
                }
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

        let zones = LayoutRepository::get_layers_by_layout_id(pool, effective_layout_id).await?;

        let mut enriched_zones = Vec::new();
        let mut required_assets_map: HashMap<Uuid, ManifestAssetDto> = HashMap::new();

        for dto_zone in zones {
            let mut mapped_blocks = Vec::new();
            for block in dto_zone.blocks {
                if let Some(pl_id) = block.block.playlist_id {
                    if let Ok(pl) = PlaylistService::get_playlist_by_id(pool, pl_id).await {
                        for item in &pl.items {
                            if !required_assets_map.contains_key(&item.media_item_id) {
                                let (sha256, size_bytes) = match MediaRepository::find_by_id(pool, item.media_item_id).await {
                                    Ok(Some(media)) => (media.sha256_hash, media.file_size_bytes),
                                    _ => ("".to_string(), 0),
                                };
                                required_assets_map.insert(
                                    item.media_item_id,
                                    ManifestAssetDto {
                                        media_id: item.media_item_id,
                                        name: item.media_name.clone(),
                                        url: item.media_url.clone(),
                                        sha256_hash: sha256,
                                        file_size_bytes: size_bytes,
                                        local_filename: format!("{}_{}", item.media_item_id, item.media_name),
                                        media_type: item.media_type.clone(),
                                    },
                                );
                            }
                        }
                        mapped_blocks.push(crate::modules::studio::layer::layer::model::LayerBlockDto { block: block.block.clone(), item_overrides: block.item_overrides.clone() });
                    }
                } else if let Some(media_id) = block.block.media_item_id {
                    if let Ok(Some(media)) = MediaRepository::find_by_id(pool, media_id).await {
                        if !required_assets_map.contains_key(&media_id) {
                            required_assets_map.insert(
                                media_id,
                                ManifestAssetDto {
                                    media_id,
                                    name: media.name.clone(),
                                    url: media.public_url.clone(),
                                    sha256_hash: media.sha256_hash.clone(),
                                    file_size_bytes: media.file_size_bytes,
                                    local_filename: format!("{}_{}", media.id, media.original_filename),
                                    media_type: media.media_type.clone(),
                                },
                            );
                        }
                        mapped_blocks.push(crate::modules::studio::layer::layer::model::LayerBlockDto { block: block.block.clone(), item_overrides: block.item_overrides.clone() });
                    }
                } else {
                    // Studio Component Widgets (Queue, Clock, Ticker, WebView, Album)
                    mapped_blocks.push(crate::modules::studio::layer::layer::model::LayerBlockDto {
                        block: block.block.clone(),
                        item_overrides: block.item_overrides.clone(),
                    });
                }
            }

            enriched_zones.push(LayerWithBlocksDto { layer: dto_zone.layer.clone(), blocks: mapped_blocks });
        }

        let total_size: i64 = required_assets_map.values().map(|a| a.file_size_bytes).sum();
        let assets_vec: Vec<ManifestAssetDto> = required_assets_map.into_values().collect();

        // Compute checksum of the entire manifest structure
        let mut hasher = Sha256::new();
        hasher.update(format!("{}:{}:{:?}", effective_layout_id, enriched_zones.len(), assets_vec.len()).as_bytes());
        for z in &enriched_zones {
            hasher.update(format!("{}:{}:{}:{}:{}", z.layer.id, z.layer.x, z.layer.y, z.layer.width, z.layer.height).as_bytes());
            for b in &z.blocks {
                hasher.update(format!("{}:{}:{:?}:{:?}:{:?}", b.block.id, b.block.duration_seconds, b.block.media_item_id, b.block.playlist_id, b.block.queue_id).as_bytes());
            }
        }
        for a in &assets_vec {
            hasher.update(format!("{}:{}", a.media_id, a.sha256_hash).as_bytes());
        }
        let version_hash = format!("{:x}", hasher.finalize());

        if let Some(client_h) = client_hash {
            if client_h == version_hash {
                return Ok(ManifestSyncResponseDto {
                    is_up_to_date: true,
                    manifest: None,
                });
            }
        }

        let power_schedule = if device.power_schedule_enabled {
            match (device.sleep_time, device.wake_time) {
                (Some(s), Some(w)) => Some(DevicePowerScheduleDto {
                    enabled: true,
                    sleep_time: s.format("%H:%M:%S").to_string(),
                    wake_time: w.format("%H:%M:%S").to_string(),
                }),
                _ => None,
            }
        } else {
            None
        };

        let compiled = CompiledManifestDto {
            manifest_id: Uuid::new_v4(),
            device_id,
            version_hash,
            generated_at: Utc::now().to_rfc3339(),
            layout_id: layout.id,
            layout_name: layout.name,
            canvas_width: layout.canvas_width,
            canvas_height: layout.canvas_height,
            orientation: layout.orientation_id.to_string(),
            background_color: layout.background_color,
            background_image_url: layout.background_image_url,
            layers: enriched_zones,
            required_assets: assets_vec,
            total_download_size_bytes: total_size,
            is_canary: canary_res.is_in_canary,
            power_schedule,
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
