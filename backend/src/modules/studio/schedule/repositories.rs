 use super::model::{
    AddScheduleEventDto, CreateScheduleDto, ScheduleEntity, ScheduleEventEntity,
    ScheduleWithEventsDto, UpdateScheduleDto,
};
use crate::db::DbPool;
use chrono::{NaiveDate, NaiveTime};
use uuid::Uuid;

pub struct ScheduleRepository;

impl ScheduleRepository {
    pub async fn create(
        pool: &DbPool,
        dto: CreateScheduleDto,
    ) -> Result<ScheduleEntity, sqlx::Error> {
        let corp_id = dto.corporation_id.unwrap_or_else(|| Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap());
        let schedule = sqlx::query_as::<_, ScheduleEntity>(
            r#"
            INSERT INTO studio_schedules (corporation_id, branch_id, created_by_user_id, name, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#,
        )
        .bind(corp_id)
        .bind(dto.branch_id)
        .bind(dto.created_by_user_id)
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
        let schedule = sqlx::query_as::<_, ScheduleEntity>("SELECT * FROM studio_schedules WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await?;

        if let Some(schedule) = schedule {
            let events = sqlx::query_as::<_, ScheduleEventEntity>(
                "SELECT * FROM studio_schedule_events WHERE schedule_id = $1 ORDER BY priority DESC, start_time ASC",
            )
            .bind(id)
            .fetch_all(pool)
            .await?;

            Ok(Some(ScheduleWithEventsDto { schedule, events }))
        } else {
            Ok(None)
        }
    }

    pub async fn find_all(pool: &DbPool, corporation_id: Option<Uuid>) -> Result<Vec<ScheduleEntity>, sqlx::Error> {
        let schedules = if let Some(corp_id) = corporation_id {
            sqlx::query_as::<_, ScheduleEntity>(
                "SELECT * FROM studio_schedules WHERE corporation_id = $1 ORDER BY created_at DESC",
            )
            .bind(corp_id)
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as::<_, ScheduleEntity>(
                "SELECT * FROM studio_schedules ORDER BY created_at DESC",
            )
            .fetch_all(pool)
            .await?
        };

        Ok(schedules)
    }

    pub async fn update(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateScheduleDto,
    ) -> Result<ScheduleEntity, sqlx::Error> {
        let schedule = sqlx::query_as::<_, ScheduleEntity>(
            r#"
            UPDATE studio_schedules
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
        let result = sqlx::query("DELETE FROM studio_schedules WHERE id = $1")
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
            .or_else(|_| NaiveTime::parse_from_str(&dto.start_time, "%H:%M"))
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?;
        let end_time = NaiveTime::parse_from_str(&dto.end_time, "%H:%M:%S")
            .or_else(|_| NaiveTime::parse_from_str(&dto.end_time, "%H:%M"))
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?;
        let start_date = match dto.start_date.as_deref() {
            Some(d) if !d.trim().is_empty() => Some(
                NaiveDate::parse_from_str(d.trim(), "%Y-%m-%d")
                    .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
            ),
            _ => None,
        };
        let end_date = match dto.end_date.as_deref() {
            Some(d) if !d.trim().is_empty() => Some(
                NaiveDate::parse_from_str(d.trim(), "%Y-%m-%d")
                    .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
            ),
            _ => None,
        };

        let event = sqlx::query_as::<_, ScheduleEventEntity>(
            r#"
            INSERT INTO studio_schedule_events (schedule_id, layout_id, start_time, end_time, days_of_week, priority, start_date, end_date, corporation_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, (SELECT corporation_id FROM studio_schedules WHERE id = $1))
            RETURNING *
            "#,
        )
        .bind(dto.schedule_id)
        .bind(dto.layout_id)
        .bind(start_time)
        .bind(end_time)
        .bind(dto.days_of_week)
        .bind(dto.priority.unwrap_or(0))
        .bind(start_date)
        .bind(end_date)
        .fetch_one(pool)
        .await?;

        Ok(event)
    }

    pub async fn remove_event(pool: &DbPool, id: Uuid, schedule_id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM studio_schedule_events WHERE id = $1 AND schedule_id = $2")
            .bind(id)
            .bind(schedule_id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
