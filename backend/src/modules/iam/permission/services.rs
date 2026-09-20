use super::model::{CreatePermissionDto, PermissionEntity, UpdatePermissionDto};
use super::repositories::PermissionRepository;
use crate::common::AppError;
use crate::db::DbPool;
use uuid::Uuid;

pub struct PermissionService;

impl PermissionService {
    pub async fn create_permission(
        pool: &DbPool,
        dto: CreatePermissionDto,
    ) -> Result<PermissionEntity, AppError> {
        if let Some(_) = PermissionRepository::find_by_code(pool, &dto.code).await? {
            return Err(AppError::BadRequest(format!(
                "Permission with code '{}' already exists",
                dto.code
            )));
        }

        let perm = PermissionRepository::create(pool, dto).await?;
        Ok(perm)
    }

    pub async fn get_permission_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<PermissionEntity, AppError> {
        PermissionRepository::find_by_id(pool, id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Permission {} not found", id)))
    }

    pub async fn list_permissions(pool: &DbPool) -> Result<Vec<PermissionEntity>, AppError> {
        let perms = PermissionRepository::find_all(pool).await?;
        Ok(perms)
    }

    pub async fn update_permission(
        pool: &DbPool,
        id: Uuid,
        dto: UpdatePermissionDto,
    ) -> Result<PermissionEntity, AppError> {
        let perm = PermissionRepository::update(pool, id, dto).await?;
        Ok(perm)
    }

    pub async fn delete_permission(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let deleted = PermissionRepository::delete(pool, id).await?;
        Ok(deleted)
    }

    pub async fn check_permission(
        pool: &DbPool,
        user_id: Uuid,
        permission_code: &str,
    ) -> Result<bool, AppError> {
        let user_perms = PermissionRepository::get_user_permissions(pool, user_id).await?;
        Ok(user_perms.iter().any(|p| p == permission_code))
    }
}
