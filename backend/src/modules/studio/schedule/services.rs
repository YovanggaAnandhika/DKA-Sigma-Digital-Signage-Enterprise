use super::model::{
    AddScheduleEventDto, CreateScheduleDto, ScheduleEntity, ScheduleEventEntity,
    ScheduleWithEventsDto, UpdateScheduleDto,
};
use super::repositories::ScheduleRepository;
use crate::common::AppError;
use crate::db::DbPool;
use uuid::Uuid;

pub struct ScheduleService;

impl ScheduleService {
    pub async fn create_schedule(
        pool: &DbPool,
        dto: CreateScheduleDto,
    ) -> Result<ScheduleEntity, AppError> {
        let schedule = ScheduleRepository::create(pool, dto)
            .await
            .map_err(AppError::Database)?;
        Ok(schedule)
    }

    pub async fn get_schedule_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<ScheduleWithEventsDto, AppError> {
        let schedule = ScheduleRepository::find_by_id(pool, id)
            .await
            .map_err(AppError::Database)?
            .ok_or_else(|| AppError::NotFound("Schedule not found".to_string()))?;

        Ok(schedule)
    }

    pub async fn list_schedules(pool: &DbPool) -> Result<Vec<ScheduleEntity>, AppError> {
        let schedules = ScheduleRepository::find_all(pool)
            .await
            .map_err(AppError::Database)?;
        Ok(schedules)
    }

    pub async fn update_schedule(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateScheduleDto,
    ) -> Result<ScheduleEntity, AppError> {
        let schedule = ScheduleRepository::update(pool, id, dto)
            .await
            .map_err(|e| match e {
                sqlx::Error::RowNotFound => AppError::NotFound("Schedule not found".to_string()),
                _ => AppError::Database(e),
            })?;
        Ok(schedule)
    }

    pub async fn delete_schedule(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let success = ScheduleRepository::delete(pool, id)
            .await
            .map_err(AppError::Database)?;

        if !success {
            return Err(AppError::NotFound("Schedule not found".to_string()));
        }

        Ok(true)
    }

    pub async fn add_schedule_event(
        pool: &DbPool,
        dto: AddScheduleEventDto,
    ) -> Result<ScheduleEventEntity, AppError> {
        let event = ScheduleRepository::add_event(pool, dto)
            .await
            .map_err(AppError::Database)?;
        Ok(event)
    }

    pub async fn remove_schedule_event(pool: &DbPool, id: Uuid, schedule_id: Uuid) -> Result<bool, AppError> {
        let success = ScheduleRepository::remove_event(pool, id, schedule_id)
            .await
            .map_err(AppError::Database)?;

        if !success {
            return Err(AppError::NotFound("Schedule event not found".to_string()));
        }

        Ok(true)
    }
}
