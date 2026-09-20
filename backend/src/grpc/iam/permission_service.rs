use tonic::{Request, Response, Status};
use uuid::Uuid;
use crate::db::DbPool;
use crate::modules::iam::permission::model::{CreatePermissionDto, PermissionEntity, UpdatePermissionDto};
use crate::modules::iam::permission::repositories::PermissionRepository;
use crate::modules::iam::permission::services::PermissionService;
use crate::grpc::proto::iam::v1::permission::{
    permission_service_server::PermissionService as PermissionServiceTrait,
    Permission, CreatePermissionRequest, GetPermissionRequest, GetPermissionByCodeRequest,
    ListPermissionsRequest, ListPermissionsResponse, UpdatePermissionRequest,
    DeletePermissionRequest, DeletePermissionResponse, CheckUserPermissionRequest,
    CheckUserPermissionResponse,
};

pub struct PermissionServiceImpl {
    pub pool: DbPool,
}

impl PermissionServiceImpl {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    fn map_permission_entity(perm: PermissionEntity) -> Permission {
        Permission {
            id: perm.id.to_string(),
            code: perm.code,
            name: perm.name,
            description: perm.description.unwrap_or_default(),
            module: perm.module,
            created_at: perm.created_at.to_rfc3339(),
            updated_at: perm.updated_at.to_rfc3339(),
        }
    }
}

#[tonic::async_trait]
impl PermissionServiceTrait for PermissionServiceImpl {
    async fn create_permission(
        &self,
        request: Request<CreatePermissionRequest>,
    ) -> Result<Response<Permission>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();

        let dto = CreatePermissionDto {
            code: req.code,
            name: req.name,
            description: if req.description.is_empty() { None } else { Some(req.description) },
            module: req.module,
        };

        let perm = PermissionService::create_permission(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_permission_entity(perm)))
    }

    async fn get_permission(
        &self,
        request: Request<GetPermissionRequest>,
    ) -> Result<Response<Permission>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();
        let perm_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Permission tidak valid"))?;

        let perm = PermissionService::get_permission_by_id(&self.pool, perm_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_permission_entity(perm)))
    }

    async fn get_permission_by_code(
        &self,
        request: Request<GetPermissionByCodeRequest>,
    ) -> Result<Response<Permission>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();

        let perm = PermissionRepository::find_by_code(&self.pool, &req.code)
            .await
            .map_err(crate::common::db_err)?
            .ok_or_else(|| Status::not_found(format!("Permission with code '{}' not found", req.code)))?;

        Ok(Response::new(Self::map_permission_entity(perm)))
    }

    async fn list_permissions(
        &self,
        request: Request<ListPermissionsRequest>,
    ) -> Result<Response<ListPermissionsResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let perms = PermissionService::list_permissions(&self.pool)
            .await
            .map_err(Status::from)?;

        let items = perms.into_iter().map(Self::map_permission_entity).collect();

        Ok(Response::new(ListPermissionsResponse {
            items,
            pagination: None,
        }))
    }

    async fn update_permission(
        &self,
        request: Request<UpdatePermissionRequest>,
    ) -> Result<Response<Permission>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();
        let perm_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Permission tidak valid"))?;

        let dto = UpdatePermissionDto {
            name: if req.name.is_empty() { None } else { Some(req.name) },
            description: if req.description.is_empty() { None } else { Some(req.description) },
            module: if req.module.is_empty() { None } else { Some(req.module) },
        };

        let perm = PermissionService::update_permission(&self.pool, perm_id, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_permission_entity(perm)))
    }

    async fn delete_permission(
        &self,
        request: Request<DeletePermissionRequest>,
    ) -> Result<Response<DeletePermissionResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();
        let perm_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Permission tidak valid"))?;

        let success = PermissionService::delete_permission(&self.pool, perm_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(DeletePermissionResponse { success }))
    }

    async fn check_user_permission(
        &self,
        request: Request<CheckUserPermissionRequest>,
    ) -> Result<Response<CheckUserPermissionResponse>, Status> {
        let req = request.into_inner();
        let user_id = Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("ID User tidak valid"))?;

        let allowed = PermissionService::check_permission(&self.pool, user_id, &req.permission_code)
            .await
            .map_err(Status::from)?;

        let reason = if allowed {
            "Permission granted via assigned user roles".to_string()
        } else {
            "User does not have the requested permission code".to_string()
        };

        Ok(Response::new(CheckUserPermissionResponse {
            allowed,
            reason,
        }))
    }
}
