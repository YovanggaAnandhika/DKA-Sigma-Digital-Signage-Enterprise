 use super::model::{
    AddScheduleEventDto, CreateScheduleDto, ScheduleEntity, ScheduleEventEntity,
    ScheduleWithEventsDto, UpdateScheduleDto,
};
use crate::db::DbPool;
use chrono::NaiveTime;
use uuid::Uuid;

pub struct ScheduleRepository;

impl ScheduleRepository {
    pub async fn create(
        pool: &DbPool,
        dto: CreateScheduleDto,
    ) -> Result<ScheduleEntity, sqlx::Error> {
        let schedule = sqlx::query_as::<_, ScheduleEntity>(
            r#"
            INSERT INTO schedules (name, description)
            VALUES ($1, $2)
            RETURNING *
            "#,
        )
        .bind(dto.name)
        .bind(dto.description)
        .fetch_one(pool)
        .await?;

        Ok(schedule)
    }

    pub async fn find_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<Option<ScheduleWithEventsDto>, sqlx::Error> {
        let schedule = sqlx::query_as::<_, ScheduleEntity>("SELECT * FROM schedules WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await?;

        if let Some(schedule) = schedule {
            let events = sqlx::query_as::<_, ScheduleEventEntity>(
                "SELECT * FROM schedule_events WHERE schedule_id = $1 ORDER BY start_time ASC",
            )
            .bind(id)
            .fetch_all(pool)
            .await?;

            Ok(Some(ScheduleWithEventsDto { schedule, events }))
        } else {
            Ok(None)
        }
    }

    pub async fn find_all(pool: &DbPool) -> Result<Vec<ScheduleEntity>, sqlx::Error> {
        let schedules = sqlx::query_as::<_, ScheduleEntity>(
            "SELECT * FROM schedules ORDER BY created_at DESC",
        )
        .fetch_all(pool)
        .await?;

        Ok(schedules)
    }

    pub async fn update(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateScheduleDto,
    ) -> Result<ScheduleEntity, sqlx::Error> {
        let schedule = sqlx::query_as::<_, ScheduleEntity>(
            r#"
            UPDATE schedules
            SET 
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(dto.name)
        .bind(dto.description)
        .fetch_one(pool)
        .await?;

        Ok(schedule)
    }

    pub async fn delete(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM schedules WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn add_event(
        pool: &DbPool,
        dto: AddScheduleEventDto,
    ) -> Result<ScheduleEventEntity, sqlx::Error> {
        let start_time = NaiveTime::parse_from_str(&dto.start_time, "%H:%M:%S")
            .unwrap_or_else(|_| NaiveTime::from_hms_opt(0, 0, 0).unwrap());
        let end_time = NaiveTime::parse_from_str(&dto.end_time, "%H:%M:%S")
            .unwrap_or_else(|_| NaiveTime::from_hms_opt(23, 59, 59).unwrap());

        let event = sqlx::query_as::<_, ScheduleEventEntity>(
            r#"
            INSERT INTO schedule_events (schedule_id, layout_id, start_time, end_time, days_of_week)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#,
        )
        .bind(dto.schedule_id)
        .bind(dto.layout_id)
        .bind(start_time)
        .bind(end_time)
        .bind(dto.days_of_week)
        .fetch_one(pool)
        .await?;

        Ok(event)
    }

    pub async fn remove_event(pool: &DbPool, id: Uuid, schedule_id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM schedule_events WHERE id = $1 AND schedule_id = $2")
            .bind(id)
            .bind(schedule_id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
