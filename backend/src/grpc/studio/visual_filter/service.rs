use std::sync::Arc;
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::modules::studio::visual_filter::repositories::VisualFilterRepository;
use crate::grpc::proto::studio::v1::visual_filter::{
    visual_filter_service_server::VisualFilterService,
    CreateVisualFilterRequest, DeleteVisualFilterRequest, DeleteVisualFilterResponse,
    GetVisualFilterRequest, ListVisualFiltersRequest, ListVisualFiltersResponse,
    UpdateVisualFilterRequest, VisualFilter,
};

pub struct MyVisualFilterService {
    repository: Arc<VisualFilterRepository>,
}

impl MyVisualFilterService {
    pub fn new(repository: Arc<VisualFilterRepository>) -> Self {
        Self { repository }
    }
}

#[tonic::async_trait]
impl VisualFilterService for MyVisualFilterService {
    async fn list_visual_filters(
        &self,
        request: Request<ListVisualFiltersRequest>,
    ) -> Result<Response<ListVisualFiltersResponse>, Status> {
        let req = request.into_inner();
        let page = if req.page > 0 { req.page } else { 1 };
        let limit = if req.limit > 0 { req.limit } else { 10 };
        let offset = (page - 1) * limit;

        let (filters, total) = self
            .repository
            .find_all(req.search.as_deref(), limit, offset)
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?;

        let proto_filters = filters
            .into_iter()
            .map(|f| VisualFilter {
                id: f.id.to_string(),
                name: f.name,
                brightness: f.brightness,
                contrast: f.contrast,
                saturation: f.saturation,
                hue_rotate: f.hue_rotate,
                blur_px: f.blur_px,
                created_at: f.created_at.to_rfc3339(),
                updated_at: f.updated_at.to_rfc3339(),
            })
            .collect();

        Ok(Response::new(ListVisualFiltersResponse {
            filters: proto_filters,
            total,
            page,
            limit,
        }))
    }

    async fn get_visual_filter(
        &self,
        request: Request<GetVisualFilterRequest>,
    ) -> Result<Response<VisualFilter>, Status> {
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id).map_err(|_| Status::invalid_argument("Invalid ID format"))?;

        let f = self
            .repository
            .find_by_id(id)
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?
            .ok_or_else(|| Status::not_found("Visual Filter not found"))?;

        Ok(Response::new(VisualFilter {
            id: f.id.to_string(),
            name: f.name,
            brightness: f.brightness,
            contrast: f.contrast,
            saturation: f.saturation,
            hue_rotate: f.hue_rotate,
            blur_px: f.blur_px,
            created_at: f.created_at.to_rfc3339(),
            updated_at: f.updated_at.to_rfc3339(),
        }))
    }

    async fn create_visual_filter(
        &self,
        request: Request<CreateVisualFilterRequest>,
    ) -> Result<Response<VisualFilter>, Status> {
        let req = request.into_inner();
        let f = self
            .repository
            .create(
                &req.name,
                req.brightness,
                req.contrast,
                req.saturation,
                req.hue_rotate,
                req.blur_px,
            )
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?;

        Ok(Response::new(VisualFilter {
            id: f.id.to_string(),
            name: f.name,
            brightness: f.brightness,
            contrast: f.contrast,
            saturation: f.saturation,
            hue_rotate: f.hue_rotate,
            blur_px: f.blur_px,
            created_at: f.created_at.to_rfc3339(),
            updated_at: f.updated_at.to_rfc3339(),
        }))
    }

    async fn update_visual_filter(
        &self,
        request: Request<UpdateVisualFilterRequest>,
    ) -> Result<Response<VisualFilter>, Status> {
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id).map_err(|_| Status::invalid_argument("Invalid ID format"))?;

        let f = self
            .repository
            .update(
                id,
                req.name.as_deref(),
                req.brightness,
                req.contrast,
                req.saturation,
                req.hue_rotate,
                req.blur_px,
            )
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?;

        Ok(Response::new(VisualFilter {
            id: f.id.to_string(),
            name: f.name,
            brightness: f.brightness,
            contrast: f.contrast,
            saturation: f.saturation,
            hue_rotate: f.hue_rotate,
            blur_px: f.blur_px,
            created_at: f.created_at.to_rfc3339(),
            updated_at: f.updated_at.to_rfc3339(),
        }))
    }

    async fn delete_visual_filter(
        &self,
        request: Request<DeleteVisualFilterRequest>,
    ) -> Result<Response<DeleteVisualFilterResponse>, Status> {
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id).map_err(|_| Status::invalid_argument("Invalid ID format"))?;

        let success = self
            .repository
            .delete(id)
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?;

        Ok(Response::new(DeleteVisualFilterResponse { success }))
    }
}
