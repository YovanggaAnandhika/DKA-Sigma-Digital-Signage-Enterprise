use tonic::{Request, Response, Status};
use uuid::Uuid;
use crate::db::DbPool;
use crate::modules::distribution::canary::model::{CanaryGroupEntity, CreateCanaryGroupDto, UpdateCanaryGroupDto};
use crate::modules::distribution::canary::services::CanaryService;
use crate::grpc::proto::distribution::v1::canary::{
    canary_service_server::CanaryService as CanaryServiceTrait,
    CanaryGroup, CreateCanaryGroupRequest, GetCanaryGroupRequest,
    ListCanaryGroupsRequest, ListCanaryGroupsResponse, UpdateCanaryGroupRequest,
    DeleteCanaryGroupRequest, DeleteCanaryGroupResponse, EvaluateCanaryRequest,
    EvaluateCanaryResponse,
};

pub struct CanaryServiceImpl {
    pub pool: DbPool,
}

impl CanaryServiceImpl {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    fn map_canary_group_entity(g: CanaryGroupEntity) -> CanaryGroup {
        CanaryGroup {
            id: g.id.to_string(),
            name: g.name,
            description: g.description.unwrap_or_default(),
            rollout_percentage: g.rollout_percentage,
            is_active: g.is_active,
            target_layout_id: g.target_layout_id.map(|id| id.to_string()).unwrap_or_default(),
            created_at: g.created_at.to_rfc3339(),
            updated_at: g.updated_at.to_rfc3339(),
        }
    }
}

#[tonic::async_trait]
impl CanaryServiceTrait for CanaryServiceImpl {
    async fn create_canary_group(
        &self,
        request: Request<CreateCanaryGroupRequest>,
    ) -> Result<Response<CanaryGroup>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_distribution")?;
        let req = request.into_inner();

        let target_layout_id = if req.target_layout_id.is_empty() {
            None
        } else {
            Uuid::parse_str(&req.target_layout_id).ok()
        };

        let dto = CreateCanaryGroupDto {
            name: req.name,
            description: if req.description.is_empty() { None } else { Some(req.description) },
            rollout_percentage: if req.rollout_percentage >= 0 { Some(req.rollout_percentage) } else { None },
            is_active: Some(req.is_active),
            target_layout_id,
        };

        let group = CanaryService::create_canary_group(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_canary_group_entity(group)))
    }

    async fn get_canary_group(
        &self,
        request: Request<GetCanaryGroupRequest>,
    ) -> Result<Response<CanaryGroup>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_distribution")?;
        let req = request.into_inner();
        let group_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Canary Group tidak valid"))?;

        let group = CanaryService::get_canary_group_by_id(&self.pool, group_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_canary_group_entity(group)))
    }

    async fn list_canary_groups(
        &self,
        request: Request<ListCanaryGroupsRequest>,
    ) -> Result<Response<ListCanaryGroupsResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_distribution")?;
        let groups = CanaryService::list_canary_groups(&self.pool)
            .await
            .map_err(Status::from)?;

        let items = groups.into_iter().map(Self::map_canary_group_entity).collect();

        Ok(Response::new(ListCanaryGroupsResponse {
            items,
            pagination: None,
        }))
    }

    async fn update_canary_group(
        &self,
        request: Request<UpdateCanaryGroupRequest>,
    ) -> Result<Response<CanaryGroup>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_distribution")?;
        let req = request.into_inner();
        let group_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Canary Group tidak valid"))?;

        let target_layout_id = if req.target_layout_id.is_empty() {
            None
        } else {
            Uuid::parse_str(&req.target_layout_id).ok()
        };

        let dto = UpdateCanaryGroupDto {
            name: if req.name.is_empty() { None } else { Some(req.name) },
            description: if req.description.is_empty() { None } else { Some(req.description) },
            rollout_percentage: if req.rollout_percentage >= 0 { Some(req.rollout_percentage) } else { None },
            is_active: Some(req.is_active),
            target_layout_id,
        };

        let group = CanaryService::update_canary_group(&self.pool, group_id, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_canary_group_entity(group)))
    }

    async fn delete_canary_group(
        &self,
        request: Request<DeleteCanaryGroupRequest>,
    ) -> Result<Response<DeleteCanaryGroupResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_distribution")?;
        let req = request.into_inner();
        let group_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Canary Group tidak valid"))?;

        let success = CanaryService::delete_canary_group(&self.pool, group_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(DeleteCanaryGroupResponse { success }))
    }

    async fn evaluate_canary(
        &self,
        request: Request<EvaluateCanaryRequest>,
    ) -> Result<Response<EvaluateCanaryResponse>, Status> {
        let req = request.into_inner();
        let device_id = Uuid::parse_str(&req.device_id)
            .map_err(|_| Status::invalid_argument("ID Device tidak valid"))?;
        let requested_layout_id = Uuid::parse_str(&req.requested_layout_id)
            .map_err(|_| Status::invalid_argument("ID Requested Layout tidak valid"))?;

        let device = crate::modules::hardware::device::repositories::DeviceRepository::find_by_id(&self.pool, device_id)
            .await
            .map_err(crate::common::db_err)?;
        let canary_group_id = device.and_then(|d| d.canary_group_id);

        let eval = CanaryService::evaluate_canary(
            &self.pool,
            device_id,
            canary_group_id,
            requested_layout_id,
        )
        .await
        .map_err(Status::from)?;

        Ok(Response::new(EvaluateCanaryResponse {
            is_in_canary: eval.is_in_canary,
            effective_layout_id: eval.effective_layout_id.to_string(),
            canary_group_id: eval.canary_group_id.map(|id| id.to_string()).unwrap_or_default(),
        }))
    }
}
