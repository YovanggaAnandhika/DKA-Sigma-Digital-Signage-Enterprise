use tonic::{Request, Response, Status};
use uuid::Uuid;
use crate::db::DbPool;
use crate::modules::hardware::display_group::model::{
    CreateDisplayGroupDto, DisplayGroupEntity, UpdateDisplayGroupDto,
};
use crate::modules::hardware::display_group::services::DisplayGroupService;
use crate::grpc::proto::hardware::v1::display_group::{
    display_group_service_server::DisplayGroupService as DisplayGroupServiceTrait,
    CreateDisplayGroupRequest, DeleteDisplayGroupRequest, DeleteDisplayGroupResponse,
    DisplayGroup, GetDisplayGroupRequest, ListDisplayGroupsRequest, ListDisplayGroupsResponse,
    UpdateDisplayGroupRequest,
};

pub struct DisplayGroupServiceImpl {
    pub pool: DbPool,
}

impl DisplayGroupServiceImpl {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    fn map_entity(entity: DisplayGroupEntity) -> DisplayGroup {
        DisplayGroup {
            id: entity.id.to_string(),
            name: entity.name,
            description: entity.description.unwrap_or_default(),
            default_layout_id: entity.default_layout_id.map(|id| id.to_string()).unwrap_or_default(),
            default_layout_name: "".to_string(), // will be populated via join if needed
            schedule_id: entity.schedule_id.map(|id| id.to_string()).unwrap_or_default(),
            schedule_name: "".to_string(), // will be populated via join if needed
            created_at: entity.created_at.to_rfc3339(),
            updated_at: entity.updated_at.to_rfc3339(),
        }
    }
}

#[tonic::async_trait]
impl DisplayGroupServiceTrait for DisplayGroupServiceImpl {
    async fn create_display_group(
        &self,
        request: Request<CreateDisplayGroupRequest>,
    ) -> Result<Response<DisplayGroup>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let req = request.into_inner();

        let default_layout_id = if req.default_layout_id.is_empty() {
            None
        } else {
            Uuid::parse_str(&req.default_layout_id).ok()
        };

        let schedule_id = if req.schedule_id.is_empty() {
            None
        } else {
            Uuid::parse_str(&req.schedule_id).ok()
        };

        let dto = CreateDisplayGroupDto {
            name: req.name,
            description: if req.description.is_empty() { None } else { Some(req.description) },
            default_layout_id,
            schedule_id,
        };

        let group = DisplayGroupService::create_display_group(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_entity(group)))
    }

    async fn get_display_group(
        &self,
        request: Request<GetDisplayGroupRequest>,
    ) -> Result<Response<DisplayGroup>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let req = request.into_inner();
        let group_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid group ID"))?;

        let group = DisplayGroupService::get_display_group_by_id(&self.pool, group_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_entity(group)))
    }

    async fn list_display_groups(
        &self,
        request: Request<ListDisplayGroupsRequest>,
    ) -> Result<Response<ListDisplayGroupsResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let groups = DisplayGroupService::list_display_groups(&self.pool)
            .await
            .map_err(Status::from)?;

        let items = groups.into_iter().map(Self::map_entity).collect();

        Ok(Response::new(ListDisplayGroupsResponse {
            items,
            pagination: None,
        }))
    }

    async fn update_display_group(
        &self,
        request: Request<UpdateDisplayGroupRequest>,
    ) -> Result<Response<DisplayGroup>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let req = request.into_inner();
        let group_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid group ID"))?;

        let default_layout_id = if req.default_layout_id.is_empty() {
            None
        } else {
            Uuid::parse_str(&req.default_layout_id).ok()
        };

        let schedule_id = if req.schedule_id.is_empty() {
            None
        } else {
            Uuid::parse_str(&req.schedule_id).ok()
        };

        let dto = UpdateDisplayGroupDto {
            name: if req.name.is_empty() { None } else { Some(req.name) },
            description: if req.description.is_empty() { None } else { Some(req.description) },
            default_layout_id,
            schedule_id,
        };

        let group = DisplayGroupService::update_display_group(&self.pool, group_id, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_entity(group)))
    }

    async fn delete_display_group(
        &self,
        request: Request<DeleteDisplayGroupRequest>,
    ) -> Result<Response<DeleteDisplayGroupResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let req = request.into_inner();
        let group_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid group ID"))?;

        let success = DisplayGroupService::delete_display_group(&self.pool, group_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(DeleteDisplayGroupResponse { success }))
    }
}
