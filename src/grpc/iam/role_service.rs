use tonic::{Request, Response, Status};
use uuid::Uuid;
use crate::db::DbPool;
use crate::modules::iam::role::model::{CreateRoleDto, RoleEntity, UpdateRoleDto};
use crate::modules::iam::role::repositories::RoleRepository;
use crate::modules::iam::role::services::RoleService;
use crate::grpc::proto::iam::v1::role::{
    role_service_server::RoleService as RoleServiceTrait,
    Role, CreateRoleRequest, GetRoleRequest, GetRoleBySlugRequest,
    ListRolesRequest, ListRolesResponse, UpdateRoleRequest,
    DeleteRoleRequest, DeleteRoleResponse, AssignPermissionsToRoleRequest,
    AssignPermissionsToRoleResponse,
};

pub struct RoleServiceImpl {
    pub pool: DbPool,
}

impl RoleServiceImpl {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    async fn map_role_entity(&self, role: RoleEntity) -> Result<Role, Status> {
        Ok(Role {
            id: role.id.to_string(),
            name: role.name,
            slug: role.slug,
            description: role.description.unwrap_or_default(),
            is_system: role.is_system,
            created_at: role.created_at.to_rfc3339(),
            updated_at: role.updated_at.to_rfc3339(),
            permissions: vec![],
        })
    }
}

#[tonic::async_trait]
impl RoleServiceTrait for RoleServiceImpl {
    async fn create_role(
        &self,
        request: Request<CreateRoleRequest>,
    ) -> Result<Response<Role>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();

        let perm_ids = req.permission_ids.into_iter().filter_map(|s| Uuid::parse_str(&s).ok()).collect::<Vec<_>>();

        let dto = CreateRoleDto {
            name: req.name,
            slug: req.slug,
            description: if req.description.is_empty() { None } else { Some(req.description) },
            permission_ids: if perm_ids.is_empty() { None } else { Some(perm_ids) },
        };

        let role = RoleService::create_role(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        let proto_role = self.map_role_entity(role).await?;
        Ok(Response::new(proto_role))
    }

    async fn get_role(
        &self,
        request: Request<GetRoleRequest>,
    ) -> Result<Response<Role>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();
        let role_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Role tidak valid"))?;

        let role = RoleService::get_role_by_id(&self.pool, role_id)
            .await
            .map_err(Status::from)?;

        let proto_role = self.map_role_entity(role).await?;
        Ok(Response::new(proto_role))
    }

    async fn get_role_by_slug(
        &self,
        request: Request<GetRoleBySlugRequest>,
    ) -> Result<Response<Role>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();

        let role = RoleRepository::find_by_slug(&self.pool, &req.slug)
            .await
            .map_err(crate::common::db_err)?
            .ok_or_else(|| Status::not_found(format!("Role with slug '{}' not found", req.slug)))?;

        let proto_role = self.map_role_entity(role).await?;
        Ok(Response::new(proto_role))
    }

    async fn list_roles(
        &self,
        request: Request<ListRolesRequest>,
    ) -> Result<Response<ListRolesResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let roles = RoleService::list_roles(&self.pool)
            .await
            .map_err(Status::from)?;

        let mut items = Vec::new();
        for r in roles {
            items.push(self.map_role_entity(r).await?);
        }

        Ok(Response::new(ListRolesResponse {
            items,
            pagination: None,
        }))
    }

    async fn update_role(
        &self,
        request: Request<UpdateRoleRequest>,
    ) -> Result<Response<Role>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();
        let role_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Role tidak valid"))?;

        let perm_ids = req.permission_ids.into_iter().filter_map(|s| Uuid::parse_str(&s).ok()).collect::<Vec<_>>();

        let dto = UpdateRoleDto {
            name: if req.name.is_empty() { None } else { Some(req.name) },
            description: if req.description.is_empty() { None } else { Some(req.description) },
            permission_ids: if perm_ids.is_empty() { None } else { Some(perm_ids) },
        };

        let role = RoleService::update_role(&self.pool, role_id, dto)
            .await
            .map_err(Status::from)?;

        let proto_role = self.map_role_entity(role).await?;
        Ok(Response::new(proto_role))
    }

    async fn delete_role(
        &self,
        request: Request<DeleteRoleRequest>,
    ) -> Result<Response<DeleteRoleResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();
        let role_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Role tidak valid"))?;

        let success = RoleService::delete_role(&self.pool, role_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(DeleteRoleResponse { success }))
    }

    async fn assign_permissions_to_role(
        &self,
        request: Request<AssignPermissionsToRoleRequest>,
    ) -> Result<Response<AssignPermissionsToRoleResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();
        let role_id = Uuid::parse_str(&req.role_id)
            .map_err(|_| Status::invalid_argument("ID Role tidak valid"))?;

        let perm_ids = req.permission_ids.into_iter().filter_map(|s| Uuid::parse_str(&s).ok()).collect::<Vec<_>>();

        RoleService::assign_permissions(&self.pool, role_id, perm_ids)
            .await
            .map_err(Status::from)?;

        let role = RoleService::get_role_by_id(&self.pool, role_id)
            .await
            .map_err(Status::from)?;

        let proto_role = self.map_role_entity(role).await?;

        Ok(Response::new(AssignPermissionsToRoleResponse {
            success: true,
            role: Some(proto_role),
        }))
    }
}
