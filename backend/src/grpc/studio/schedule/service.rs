use tonic::{Request, Response, Status};
use uuid::Uuid;
use crate::db::DbPool;
use crate::modules::studio::schedule::model::{
    AddScheduleEventDto, CreateScheduleDto, ScheduleEntity, ScheduleEventEntity,
    ScheduleWithEventsDto, UpdateScheduleDto,
};
use crate::modules::studio::schedule::services::ScheduleService;
use crate::grpc::proto::studio::v1::schedule::schedule::{
    schedule_service_server::ScheduleService as ScheduleServiceTrait,
    CreateScheduleRequest, DeleteScheduleRequest, DeleteScheduleResponse,
    GetScheduleRequest, ListSchedulesRequest, ListSchedulesResponse, Schedule,
    UpdateScheduleRequest, PushLayoutToScheduleRequest, PushLayoutToScheduleResponse,
};
use crate::grpc::proto::studio::v1::schedule::event::{
    schedule_event_service_server::ScheduleEventService as ScheduleEventServiceTrait,
    ScheduleEvent, AddScheduleEventRequest, RemoveScheduleEventRequest,
    RemoveScheduleEventResponse,
};

#[derive(sqlx::FromRow)]
struct ScheduleEventWithLayoutRow {
    id: Uuid,
    schedule_id: Uuid,
    layout_id: Uuid,
    layout_name: Option<String>,
    start_time: chrono::NaiveTime,
    end_time: chrono::NaiveTime,
    days_of_week: String,
    priority: i32,
    start_date: Option<chrono::NaiveDate>,
    end_date: Option<chrono::NaiveDate>,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Clone)]
pub struct ScheduleEventServiceImpl {
    pub pool: DbPool,
}

impl ScheduleEventServiceImpl {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }
}

#[derive(Clone)]
pub struct ScheduleServiceImpl {
    pub pool: DbPool,
}

impl ScheduleServiceImpl {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    async fn fetch_events(&self, schedule_id: Uuid) -> Vec<ScheduleEvent> {
        let rows = sqlx::query_as::<_, ScheduleEventWithLayoutRow>(
            r#"
            SELECT 
                se.id, se.schedule_id, se.layout_id, l.name AS layout_name,
                se.start_time, se.end_time, se.days_of_week, se.priority,
                se.start_date, se.end_date, se.created_at
            FROM studio_schedule_events se
            LEFT JOIN studio_layouts l ON l.id = se.layout_id
            WHERE se.schedule_id = $1
            ORDER BY se.priority DESC, se.start_time ASC
            "#,
        )
        .bind(schedule_id)
        .fetch_all(&self.pool)
        .await
        .unwrap_or_default();

        rows.into_iter()
            .map(|r| ScheduleEvent {
                id: r.id.to_string(),
                schedule_id: r.schedule_id.to_string(),
                layout_id: r.layout_id.to_string(),
                layout_name: r.layout_name.unwrap_or_else(|| "Layout".to_string()),
                start_time: r.start_time.format("%H:%M:%S").to_string(),
                end_time: r.end_time.format("%H:%M:%S").to_string(),
                days_of_week: r.days_of_week,
                priority: r.priority,
                created_at: r.created_at.to_rfc3339(),
                start_date: r.start_date.map(|d| d.format("%Y-%m-%d").to_string()),
                end_date: r.end_date.map(|d| d.format("%Y-%m-%d").to_string()),
            })
            .collect()
    }

    fn map_entity(entity: ScheduleEntity) -> Schedule {
        Schedule {
            id: entity.id.to_string(),
            name: entity.name,
            description: entity.description.unwrap_or_default(),
            created_at: entity.created_at.to_rfc3339(),
            updated_at: entity.updated_at.to_rfc3339(),
            events: vec![],
        }
    }

    fn map_event_entity(entity: ScheduleEventEntity) -> ScheduleEvent {
        ScheduleEvent {
            id: entity.id.to_string(),
            schedule_id: entity.schedule_id.to_string(),
            layout_id: entity.layout_id.to_string(),
            layout_name: "".to_string(),
            start_time: entity.start_time.format("%H:%M:%S").to_string(),
            end_time: entity.end_time.format("%H:%M:%S").to_string(),
            days_of_week: entity.days_of_week,
            priority: entity.priority,
            created_at: entity.created_at.to_rfc3339(),
            start_date: entity.start_date.map(|d| d.format("%Y-%m-%d").to_string()),
            end_date: entity.end_date.map(|d| d.format("%Y-%m-%d").to_string()),
        }
    }
}

#[tonic::async_trait]
impl ScheduleServiceTrait for ScheduleServiceImpl {
    async fn create_schedule(
        &self,
        request: Request<CreateScheduleRequest>,
    ) -> Result<Response<Schedule>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_schedules")?;
        let req = request.into_inner();
        let dto = CreateScheduleDto {
            name: req.name,
            description: if req.description.is_empty() { None } else { Some(req.description) },
        };

        let schedule = ScheduleService::create_schedule(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_entity(schedule)))
    }

    async fn get_schedule(
        &self,
        request: Request<GetScheduleRequest>,
    ) -> Result<Response<Schedule>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_view_schedules")?;
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid ID"))?;

        let schedule_with_events = ScheduleService::get_schedule_by_id(&self.pool, id)
            .await
            .map_err(Status::from)?;

        let mut proto_schedule = Self::map_entity(schedule_with_events.schedule);
        proto_schedule.events = self.fetch_events(id).await;

        Ok(Response::new(proto_schedule))
    }

    async fn list_schedules(
        &self,
        request: Request<ListSchedulesRequest>,
    ) -> Result<Response<ListSchedulesResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_view_schedules")?;
        let schedules = ScheduleService::list_schedules(&self.pool)
            .await
            .map_err(Status::from)?;

        let mut items = Vec::new();
        for s in schedules {
            let id = s.id;
            let mut proto_s = Self::map_entity(s);
            proto_s.events = self.fetch_events(id).await;
            items.push(proto_s);
        }

        Ok(Response::new(ListSchedulesResponse {
            items,
            pagination: None,
        }))
    }

    async fn update_schedule(
        &self,
        request: Request<UpdateScheduleRequest>,
    ) -> Result<Response<Schedule>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_schedules")?;
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid ID"))?;

        let dto = UpdateScheduleDto {
            name: if req.name.is_empty() { None } else { Some(req.name) },
            description: if req.description.is_empty() { None } else { Some(req.description) },
        };

        let schedule = ScheduleService::update_schedule(&self.pool, id, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_entity(schedule)))
    }

    async fn delete_schedule(
        &self,
        request: Request<DeleteScheduleRequest>,
    ) -> Result<Response<DeleteScheduleResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_schedules")?;
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid ID"))?;

        let success = ScheduleService::delete_schedule(&self.pool, id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(DeleteScheduleResponse { success }))
    }

    async fn push_layout_to_schedule(
        &self,
        request: Request<PushLayoutToScheduleRequest>,
    ) -> Result<Response<PushLayoutToScheduleResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_schedules")?;
        let req = request.into_inner();
        let layout_id = Uuid::parse_str(&req.layout_id)
            .map_err(|_| Status::invalid_argument("Invalid layout_id"))?;

        let mut tx = self.pool.begin().await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?;

        // 1. Resolve or Create schedule
        let schedule_name = if req.schedule_name.trim().is_empty() {
            "Jadwal Layout".to_string()
        } else {
            req.schedule_name.trim().to_string()
        };

        let schedule_id = if let Some(ref sid_str) = req.schedule_id.as_ref().filter(|s| !s.trim().is_empty()) {
            if let Ok(existing_id) = Uuid::parse_str(sid_str) {
                let _ = sqlx::query("DELETE FROM studio_schedule_events WHERE schedule_id = $1")
                    .bind(existing_id)
                    .execute(&mut *tx)
                    .await;
                let _ = sqlx::query("UPDATE studio_schedules SET updated_at = NOW() WHERE id = $1")
                    .bind(existing_id)
                    .execute(&mut *tx)
                    .await;
                existing_id
            } else {
                sqlx::query_scalar::<_, Uuid>(
                    r#"
                    INSERT INTO studio_schedules (name, description, created_at, updated_at)
                    VALUES ($1, $2, NOW(), NOW())
                    RETURNING id
                    "#,
                )
                .bind(&schedule_name)
                .bind(format!("Dipush dari template layout {}", layout_id))
                .fetch_one(&mut *tx)
                .await
                .map_err(|e| Status::internal(format!("Failed to create schedule: {}", e)))?
            }
        } else {
            sqlx::query_scalar::<_, Uuid>(
                r#"
                INSERT INTO studio_schedules (name, description, created_at, updated_at)
                VALUES ($1, $2, NOW(), NOW())
                RETURNING id
                "#,
            )
            .bind(&schedule_name)
            .bind(format!("Dipush dari template layout {}", layout_id))
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| Status::internal(format!("Failed to create schedule: {}", e)))?
        };

        // 2. Resolve latest version_hash for layout
        let version_hash = match sqlx::query_scalar::<_, String>(
            "SELECT version_hash FROM studio_layout_history WHERE layout_id = $1 ORDER BY created_at DESC LIMIT 1"
        )
        .bind(layout_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| Status::internal(format!("Database error querying layout history: {}", e)))? {
            Some(h) => h,
            None => {
                if let Ok(full_dto) = crate::modules::studio::layout::services::LayoutService::get_layout_by_id(&self.pool, layout_id).await {
                    use sha2::{Digest, Sha256};
                    let mut hasher = Sha256::new();
                    hasher.update(serde_json::to_string(&full_dto).unwrap_or_default().as_bytes());
                    let vh = format!("{:x}", hasher.finalize());
                    if let Ok(snapshot_val) = serde_json::to_value(&full_dto) {
                        let _ = sqlx::query(
                            "INSERT INTO studio_layout_history (layout_id, version_hash, snapshot_json, description) VALUES ($1, $2, $3, $4)"
                        )
                        .bind(layout_id)
                        .bind(&vh)
                        .bind(snapshot_val)
                        .bind("Snapshot awal saat push penjadwalan")
                        .execute(&mut *tx)
                        .await;
                    }
                    vh
                } else {
                    "v1".to_string()
                }
            }
        };

        // 3. Add schedule_event with version_hash
        let start_time = chrono::NaiveTime::parse_from_str(&req.start_time, "%H:%M:%S")
            .or_else(|_| chrono::NaiveTime::parse_from_str(&req.start_time, "%H:%M"))
            .unwrap_or_else(|_| chrono::NaiveTime::from_hms_opt(8, 0, 0).unwrap());

        let end_time = chrono::NaiveTime::parse_from_str(&req.end_time, "%H:%M:%S")
            .or_else(|_| chrono::NaiveTime::parse_from_str(&req.end_time, "%H:%M"))
            .unwrap_or_else(|_| chrono::NaiveTime::from_hms_opt(22, 0, 0).unwrap());

        let start_date = req.start_date.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());
        let end_date = req.end_date.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

        sqlx::query(
            r#"
            INSERT INTO studio_schedule_events (
                schedule_id, layout_id, start_time, end_time, days_of_week,
                priority, start_date, end_date, version_hash, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            "#,
        )
        .bind(schedule_id)
        .bind(layout_id)
        .bind(start_time)
        .bind(end_time)
        .bind(if req.days_of_week.is_empty() { "1,2,3,4,5,6,7" } else { &req.days_of_week })
        .bind(req.priority)
        .bind(start_date)
        .bind(end_date)
        .bind(&version_hash)
        .execute(&mut *tx)
        .await
        .map_err(|e| Status::internal(format!("Failed to create schedule event: {}", e)))?;

        // 3. Assign schedule_id to selected devices
        let mut affected = 0i32;
        for dev_str in &req.device_ids {
            if let Ok(dev_id) = Uuid::parse_str(dev_str) {
                let res = sqlx::query("UPDATE hardware_devices SET schedule_id = $1, updated_at = NOW() WHERE id = $2")
                    .bind(schedule_id)
                    .bind(dev_id)
                    .execute(&mut *tx)
                    .await;
                if let Ok(r) = res {
                    affected += r.rows_affected() as i32;
                }
            }
        }

        // 4. Assign schedule_id to selected display groups
        for grp_str in &req.display_group_ids {
            if let Ok(grp_id) = Uuid::parse_str(grp_str) {
                let _ = sqlx::query("UPDATE hardware_display_groups SET schedule_id = $1, updated_at = NOW() WHERE id = $2")
                    .bind(schedule_id)
                    .bind(grp_id)
                    .execute(&mut *tx)
                    .await;
            }
        }

        tx.commit().await
            .map_err(|e| Status::internal(format!("Commit failed: {}", e)))?;

        Ok(Response::new(PushLayoutToScheduleResponse {
            success: true,
            schedule_id: schedule_id.to_string(),
            message: format!("Berhasil mempublikasikan ke jadwal '{}'", schedule_name),
            affected_devices_count: affected,
        }))
    }
}


#[tonic::async_trait]
impl ScheduleEventServiceTrait for ScheduleEventServiceImpl {
    async fn add_schedule_event(
        &self,
        request: Request<AddScheduleEventRequest>,
    ) -> Result<Response<ScheduleEvent>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_schedules")?;
        let req = request.into_inner();
        let schedule_id = Uuid::parse_str(&req.schedule_id)
            .map_err(|_| Status::invalid_argument("Invalid schedule ID"))?;
        let layout_id = Uuid::parse_str(&req.layout_id)
            .map_err(|_| Status::invalid_argument("Invalid layout ID"))?;

        let dto = AddScheduleEventDto {
            schedule_id,
            layout_id,
            start_time: req.start_time,
            end_time: req.end_time,
            days_of_week: req.days_of_week,
            priority: req.priority,
            start_date: req.start_date,
            end_date: req.end_date,
        };

        let event = ScheduleService::add_schedule_event(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(ScheduleServiceImpl::map_event_entity(event)))
    }

    async fn remove_schedule_event(
        &self,
        request: Request<RemoveScheduleEventRequest>,
    ) -> Result<Response<RemoveScheduleEventResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_schedules")?;
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid event ID"))?;
        let schedule_id = Uuid::parse_str(&req.schedule_id)
            .map_err(|_| Status::invalid_argument("Invalid schedule ID"))?;

        let success = ScheduleService::remove_schedule_event(&self.pool, id, schedule_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(RemoveScheduleEventResponse { success }))
    }

}
