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
                blocks: z.blocks.into_iter().map(|b| LayerPlaylist {
                    id: b.block.id.to_string(),
                    layer_id: z.layer.id.to_string(),
                    volume_level: 100,
                    playlist_id: b.block.playlist_id.map(|id| id.to_string()).unwrap_or_default(),
                    media_item_id: String::new(),
                    playlist: None, // Simplified for now
                    media_item: None,
                    start_time_seconds: b.block.start_time_seconds,
                    duration_seconds: b.block.duration_seconds,
                    trim_start_seconds: b.block.trim_start_seconds,
                    trim_end_seconds: b.block.trim_end_seconds,
                    transition_id: b.block.transition_id.map(|id| id.to_string()),
                    visual_filter_id: b.block.visual_filter_id.map(|id| id.to_string()),
                    order_index: b.block.order_index,
                    is_muted: false,
                    created_at: "".to_string(),
                    item_overrides: vec![],
                    transition: None,
                    visual_filter: None,
                }).collect(),
                created_at: "".to_string(),
                updated_at: "".to_string(),
            }
        }).collect();

        let orientation = Some(crate::grpc::proto::common::v1::orientation::Orientation {
            id: String::new(),
            name: dto.orientation.clone(),
            value: dto.orientation.clone(),
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
        };

        let required_assets = dto.required_assets.into_iter().map(|a| {
            ManifestAsset {
                media_id: a.media_id.to_string(),
                url: a.url,
                sha256_hash: a.sha256_hash,
                file_size_bytes: a.file_size_bytes,
                local_filename: a.local_filename,
                media_type: 0,
            }
        }).collect();

        CompiledManifest {
            manifest_id: dto.manifest_id.to_string(),
            device_id: dto.device_id.to_string(),
            version_hash: dto.version_hash,
            generated_at: dto.generated_at,
            layout: Some(layout),
            required_assets,
            total_download_size_bytes: dto.total_download_size_bytes,
            is_canary: dto.is_canary,
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
