use tonic::{Request, Response, Status};
use uuid::Uuid;
use crate::db::DbPool;
use crate::modules::distribution::manifest::model::{CompiledManifestDto, ManifestAssetDto};
use crate::modules::distribution::manifest::services::ManifestService;
use crate::grpc::proto::distribution::v1::manifest::{
    manifest_service_server::ManifestService as ManifestServiceTrait,
    CompiledManifest, ManifestAsset, GetActiveManifestRequest, GetActiveManifestResponse,
    AssignLayoutToDeviceRequest, AssignLayoutToDeviceResponse,
};
use crate::grpc::proto::studio::v1::layout::Layout;
use crate::grpc::proto::studio::v1::layer::{Layer, LayerPlaylist};

pub struct ManifestServiceImpl {
    pub pool: DbPool,
}

impl ManifestServiceImpl {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    fn map_compiled_manifest(dto: CompiledManifestDto) -> CompiledManifest {
        let layers = dto.layers.into_iter().map(|z| {
            Layer {
                id: z.layer.id.to_string(),
                layout_id: dto.layout_id.to_string(),
                name: z.layer.name,
                x: z.layer.x,
                y: z.layer.y,
                width: z.layer.width,
                height: z.layer.height,
                z_index: z.layer.z_index,
                background_color: z.layer.background_color,
                opacity: z.layer.opacity as f32,
                overlay_color: z.layer.overlay_color,
                overlay_opacity: z.layer.overlay_opacity as f32,
                border_radius: z.layer.border_radius,
                border_color: z.layer.border_color,
                border_width: z.layer.border_width,
                blocks: z.blocks.into_iter().map(|b| {
                    let duration = if b.block.duration_seconds > 0 {
                        b.block.duration_seconds
                    } else if let Some(ref pl) = b.playlist {
                        pl.total_duration_seconds
                    } else {
                        10
                    };
                    let fallback_media_id = b.block.media_item_id
                        .map(|id| id.to_string())
                        .or_else(|| b.playlist.as_ref().and_then(|pl| pl.items.first().map(|i| i.media_item_id.to_string())))
                        .unwrap_or_default();
                    let proto_playlist = b.playlist.map(|pl| crate::grpc::proto::studio::v1::playlist::Playlist {
                        id: pl.playlist.id.to_string(),
                        name: pl.playlist.name,
                        description: pl.playlist.description.unwrap_or_default(),
                        is_shuffle: pl.playlist.is_shuffle,
                        items: pl.items.into_iter().map(|item| crate::grpc::proto::studio::v1::playlist::PlaylistItem {
                            id: item.id.to_string(),
                            playlist_id: item.playlist_id.to_string(),
                            media_item_id: item.media_item_id.to_string(),
                            media_item: None,
                            position: item.position,
                            duration_seconds: item.duration_seconds,
                            transition_type: item.transition_type,
                            created_at: "".to_string(),
                            is_muted: item.is_muted,
                        }).collect(),
                        total_duration_seconds: pl.total_duration_seconds,
                        created_at: pl.playlist.created_at.to_rfc3339(),
                        updated_at: pl.playlist.updated_at.to_rfc3339(),
                    });

                    LayerPlaylist {
                        id: b.block.id.to_string(),
                        layer_id: z.layer.id.to_string(),
                        volume_level: b.block.volume_level,
                        playlist_id: b.block.playlist_id.map(|id| id.to_string()).unwrap_or_default(),
                        media_item_id: fallback_media_id,
                        playlist: proto_playlist,
                        media_item: None,
                        start_time_seconds: b.block.start_time_seconds,
                        duration_seconds: duration,
                        trim_start_seconds: b.block.trim_start_seconds,
                        trim_end_seconds: b.block.trim_end_seconds,
                        transition_id: b.block.transition_id.map(|id| id.to_string()),
                        visual_filter_id: b.block.visual_filter_id.map(|id| id.to_string()),
                        order_index: b.block.order_index,
                        is_muted: b.block.is_muted,
                        ticker_id: b.block.ticker_id.map(|id| id.to_string()),
                        clock_id: b.block.clock_id.map(|id| id.to_string()),
                        webview_id: b.block.webview_id.map(|id| id.to_string()),
                        queue_id: b.block.queue_id.map(|id| id.to_string()),
                        album_id: b.block.album_id.map(|id| id.to_string()),
                        created_at: b.block.created_at.to_rfc3339(),
                        item_overrides: b.item_overrides.into_iter().map(|o| {
                            crate::grpc::proto::studio::v1::layer::LayerPlaylistItemOverride {
                                id: o.id.to_string(),
                                layer_playlist_id: o.layer_block_id.to_string(),
                                playlist_item_id: o.playlist_item_id.to_string(),
                                is_muted: o.is_muted.unwrap_or(false),
                                volume_level: o.volume_level.unwrap_or(100),
                            }
                        }).collect(),
                        transition: None,
                        visual_filter: None,
                    }
                }).collect(),
                created_at: "".to_string(),
                updated_at: "".to_string(),
            }
        }).collect();

        let orientation = Some(crate::grpc::proto::common::v1::orientation::Orientation {
            id: String::new(),
            name: dto.orientation.clone(),
            value: dto.orientation.clone(),
            created_at: String::new(),
            updated_at: String::new(),
        });

        let layout = Layout {
            id: dto.layout_id.to_string(),
            name: dto.layout_name,
            description: "".to_string(),
            canvas_width: dto.canvas_width,
            canvas_height: dto.canvas_height,
            orientation,
            background_color: dto.background_color,
            background_image_url: dto.background_image_url.unwrap_or_default(),
            layers,
            created_at: dto.generated_at.clone(),
            updated_at: dto.generated_at.clone(),
            resolution_id: dto.resolution_id.map(|id| id.to_string()),
            version_hash: Some(dto.version_hash.clone()),
            scheduled_version_hash: None,
            is_schedule_synced: true,
        };

        let required_assets = dto.required_assets.into_iter().map(|a| {
            let media_type = match a.media_type.to_lowercase().as_str() {
                "image" => crate::grpc::proto::studio::v1::media::MediaType::Image as i32,
                "video" => crate::grpc::proto::studio::v1::media::MediaType::Video as i32,
                "web" => crate::grpc::proto::studio::v1::media::MediaType::Web as i32,
                _ => crate::grpc::proto::studio::v1::media::MediaType::Unspecified as i32,
            };
            ManifestAsset {
                media_id: a.media_id.to_string(),
                url: a.url,
                sha256_hash: a.sha256_hash,
                file_size_bytes: a.file_size_bytes,
                local_filename: a.local_filename,
                media_type,
            }
        }).collect();

        let power_schedule = dto.power_schedule.map(|ps| {
            crate::grpc::proto::distribution::v1::manifest::DevicePowerSchedule {
                enabled: ps.enabled,
                sleep_time: ps.sleep_time,
                wake_time: ps.wake_time,
            }
        });

        CompiledManifest {
            manifest_id: dto.manifest_id.to_string(),
            device_id: dto.device_id.to_string(),
            version_hash: dto.version_hash,
            generated_at: dto.generated_at,
            layout: Some(layout),
            required_assets,
            total_download_size_bytes: dto.total_download_size_bytes,
            is_canary: dto.is_canary,
            power_schedule,
        }
    }
}

#[tonic::async_trait]
impl ManifestServiceTrait for ManifestServiceImpl {
    async fn get_active_manifest(
        &self,
        request: Request<GetActiveManifestRequest>,
    ) -> Result<Response<GetActiveManifestResponse>, Status> {
        let req = request.into_inner();
        let device_id = Uuid::parse_str(&req.device_id)
            .map_err(|_| Status::invalid_argument("ID Device tidak valid"))?;

        // Validate device token if registered
        let device = crate::modules::hardware::device::repositories::DeviceRepository::find_by_id(&self.pool, device_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?
            .ok_or_else(|| Status::not_found("Device not found"))?;

        if let Some(expected_hash) = &device.device_token_hash {
            if !req.device_token.is_empty() {
                use sha2::{Digest, Sha256};
                let mut hasher = Sha256::new();
                hasher.update(req.device_token.as_bytes());
                let computed_hash = format!("{:x}", hasher.finalize());
                if &computed_hash != expected_hash {
                    return Err(Status::unauthenticated("Invalid device token"));
                }
            } else {
                tracing::warn!("Device {} requested manifest without device_token", device_id);
            }
        }

        let client_hash = if req.client_current_hash.is_empty() {
            None
        } else {
            Some(req.client_current_hash)
        };

        let sync_res = ManifestService::get_manifest_for_device(&self.pool, device_id, client_hash)
            .await
            .map_err(Status::from)?;

        let manifest = sync_res.manifest.map(Self::map_compiled_manifest);

        Ok(Response::new(GetActiveManifestResponse {
            is_up_to_date: sync_res.is_up_to_date,
            manifest,
        }))
    }

    async fn assign_layout_to_device(
        &self,
        request: Request<AssignLayoutToDeviceRequest>,
    ) -> Result<Response<AssignLayoutToDeviceResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_distribution")?;
        let req = request.into_inner();
        let device_id = Uuid::parse_str(&req.device_id)
            .map_err(|_| Status::invalid_argument("ID Device tidak valid"))?;
        let layout_id = Uuid::parse_str(&req.layout_id)
            .map_err(|_| Status::invalid_argument("ID Layout tidak valid"))?;

        ManifestService::assign_layout(&self.pool, device_id, layout_id)
            .await
            .map_err(Status::from)?;

        let sync_res = ManifestService::get_manifest_for_device(&self.pool, device_id, None)
            .await
            .map_err(Status::from)?;

        let hash = sync_res.manifest.map(|m| m.version_hash).unwrap_or_default();

        Ok(Response::new(AssignLayoutToDeviceResponse {
            success: true,
            new_manifest_hash: hash,
        }))
    }
}
