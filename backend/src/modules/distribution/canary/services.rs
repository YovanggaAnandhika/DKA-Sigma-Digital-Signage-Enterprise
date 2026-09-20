use super::model::{
    CanaryEvaluationResult, CanaryGroupEntity, CreateCanaryGroupDto, UpdateCanaryGroupDto,
};
use super::repositories::CanaryRepository;
use crate::common::AppError;
use crate::db::DbPool;
use sha2::{Digest, Sha256};
use uuid::Uuid;

pub struct CanaryService;

impl CanaryService {
    pub async fn create_canary_group(
        pool: &DbPool,
        dto: CreateCanaryGroupDto,
    ) -> Result<CanaryGroupEntity, AppError> {
        let group = CanaryRepository::create(pool, dto).await?;
        Ok(group)
    }

    pub async fn get_canary_group_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<CanaryGroupEntity, AppError> {
        CanaryRepository::find_by_id(pool, id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Canary group {} not found", id)))
    }

    pub async fn list_canary_groups(pool: &DbPool) -> Result<Vec<CanaryGroupEntity>, AppError> {
        let groups = CanaryRepository::find_all(pool).await?;
        Ok(groups)
    }

    pub async fn update_canary_group(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateCanaryGroupDto,
    ) -> Result<CanaryGroupEntity, AppError> {
        let group = CanaryRepository::update(pool, id, dto).await?;
        Ok(group)
    }

    pub async fn delete_canary_group(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let deleted = CanaryRepository::delete(pool, id).await?;
        Ok(deleted)
    }

    /// Evaluates if a device should receive the canary layout based on explicit group or rollout percentage
    pub async fn evaluate_canary(
        pool: &DbPool,
        device_id: Uuid,
        canary_group_id: Option<Uuid>,
        default_layout_id: Uuid,
    ) -> Result<CanaryEvaluationResult, AppError> {
        if let Some(group_id) = canary_group_id {
            if let Some(group) = CanaryRepository::find_by_id(pool, group_id).await? {
                if group.is_active {
                    if let Some(target_layout_id) = group.target_layout_id {
                        // Deterministic bucket calculation: hash(device_id) % 100
                        let mut hasher = Sha256::new();
                        hasher.update(device_id.as_bytes());
                        let hash = hasher.finalize();
                        let bucket = (hash[0] as i32) % 100;

                        if bucket < group.rollout_percentage {
                            return Ok(CanaryEvaluationResult {
                                is_in_canary: true,
                                effective_layout_id: target_layout_id,
                                canary_group_id: Some(group.id),
                            });
                        }
                    }
                }
            }
        }

        Ok(CanaryEvaluationResult {
            is_in_canary: false,
            effective_layout_id: default_layout_id,
            canary_group_id: None,
        })
    }
}
