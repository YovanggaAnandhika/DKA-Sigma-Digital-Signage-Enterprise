use tonic::{Request, Response, Status};
use uuid::Uuid;
use crate::db::DbPool;
use crate::modules::iam::role_group::model::{CreateRoleGroupDto, RoleGroupEntity, UpdateRoleGroupDto};
use crate::modules::iam::role_group::repositories::RoleGroupRepository;
use crate::modules::iam::role_group::services::RoleGroupService;
use crate::grpc::proto::iam::v1::role_group::{
    role_group_service_server::RoleGroupService as RoleGroupServiceTrait,
    RoleGroup, CreateRoleGroupRequest, GetRoleGroupRequest,
    ListRoleGroupsRequest, ListRoleGroupsResponse, UpdateRoleGroupRequest,
    DeleteRoleGroupRequest, DeleteRoleGroupResponse, AssignRolesToGroupRequest,
    AssignRolesToGroupResponse,
};

pub struct RoleGroupServiceImpl {
    pub pool: DbPool,
}

impl RoleGroupServiceImpl {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    fn map_role_group_entity(group: RoleGroupEntity) -> RoleGroup {
        RoleGroup {
            id: group.id.to_string(),
            name: group.name,
            slug: group.slug,
            description: group.description.unwrap_or_default(),
            created_at: group.created_at.to_rfc3339(),
            updated_at: group.updated_at.to_rfc3339(),
            roles: vec![],
        }
    }
}

#[tonic::async_trait]
impl RoleGroupServiceTrait for RoleGroupServiceImpl {
    async fn create_role_group(
        &self,
        request: Request<CreateRoleGroupRequest>,
    ) -> Result<Response<RoleGroup>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();

        let role_ids = req.role_ids.into_iter().filter_map(|s| Uuid::parse_str(&s).ok()).collect::<Vec<_>>();

        let dto = CreateRoleGroupDto {
            name: req.name,
            slug: req.slug,
            description: if req.description.is_empty() { None } else { Some(req.description) },
            role_ids: if role_ids.is_empty() { None } else { Some(role_ids) },
        };

        let group = RoleGroupService::create_role_group(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_role_group_entity(group)))
    }

    async fn get_role_group(
        &self,
        request: Request<GetRoleGroupRequest>,
    ) -> Result<Response<RoleGroup>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();
        let group_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Role Group tidak valid"))?;

        let group = RoleGroupService::get_role_group_by_id(&self.pool, group_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_role_group_entity(group)))
    }

    async fn list_role_groups(
        &self,
        request: Request<ListRoleGroupsRequest>,
    ) -> Result<Response<ListRoleGroupsResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let groups = RoleGroupService::list_role_groups(&self.pool)
            .await
            .map_err(Status::from)?;

        let items = groups.into_iter().map(Self::map_role_group_entity).collect();

        Ok(Response::new(ListRoleGroupsResponse {
            items,
            pagination: None,
        }))
    }

    async fn update_role_group(
        &self,
        request: Request<UpdateRoleGroupRequest>,
    ) -> Result<Response<RoleGroup>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();
        let group_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Role Group tidak valid"))?;

        let role_ids = req.role_ids.into_iter().filter_map(|s| Uuid::parse_str(&s).ok()).collect::<Vec<_>>();

        let dto = UpdateRoleGroupDto {
            name: if req.name.is_empty() { None } else { Some(req.name) },
            description: if req.description.is_empty() { None } else { Some(req.description) },
            role_ids: if role_ids.is_empty() { None } else { Some(role_ids) },
        };

        let group = RoleGroupService::update_role_group(&self.pool, group_id, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_role_group_entity(group)))
    }

    async fn delete_role_group(
        &self,
        request: Request<DeleteRoleGroupRequest>,
    ) -> Result<Response<DeleteRoleGroupResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();
        let group_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Role Group tidak valid"))?;

        let success = RoleGroupService::delete_role_group(&self.pool, group_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(DeleteRoleGroupResponse { success }))
    }

    async fn assign_roles_to_group(
        &self,
        request: Request<AssignRolesToGroupRequest>,
    ) -> Result<Response<AssignRolesToGroupResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();
        let group_id = Uuid::parse_str(&req.role_group_id)
            .map_err(|_| Status::invalid_argument("ID Role Group tidak valid"))?;

        let role_ids = req.role_ids.into_iter().filter_map(|s| Uuid::parse_str(&s).ok()).collect::<Vec<_>>();

        let dto = UpdateRoleGroupDto {
            name: None,
            description: None,
            role_ids: Some(role_ids),
        };

        let group = RoleGroupRepository::update(&self.pool, group_id, dto)
            .await
            .map_err(crate::common::db_err)?;

        Ok(Response::new(AssignRolesToGroupResponse {
            success: true,
            role_group: Some(Self::map_role_group_entity(group)),
        }))
    }
}
