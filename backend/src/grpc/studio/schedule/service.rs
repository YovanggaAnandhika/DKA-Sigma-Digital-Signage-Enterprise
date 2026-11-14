use chrono::Datelike;
use crate::db::DbPool;
use crate::grpc::proto::studio::v1::schedule::event::{
    schedule_event_service_server::ScheduleEventService as ScheduleEventServiceTrait,
    AddScheduleEventRequest, RemoveScheduleEventRequest, RemoveScheduleEventResponse,
    ScheduleEvent,
};
use crate::grpc::proto::studio::v1::schedule::schedule::{
    schedule_service_server::ScheduleService as ScheduleServiceTrait, CreateScheduleRequest,
    DeleteScheduleRequest, DeleteScheduleResponse, GetScheduleRequest, ListSchedulesRequest,
    ListSchedulesResponse, PushLayoutToScheduleRequest, PushLayoutToScheduleResponse, Schedule,
    UpdateScheduleRequest,
};
use crate::modules::studio::schedule::model::{
    AddScheduleEventDto, CreateScheduleDto, ScheduleEntity, ScheduleEventEntity,
    UpdateScheduleDto,
};
use crate::modules::studio::schedule::services::ScheduleService;
use tonic::{Request, Response, Status};
use uuid::Uuid;

fn parse_schedule_date_range(
    start: Option<&str>,
    end: Option<&str>,
) -> Result<(Option<chrono::NaiveDate>, Option<chrono::NaiveDate>), Status> {
    let parse = |value: Option<&str>, field: &str| {
        value
            .filter(|value| !value.is_empty())
            .map(|value| {
                chrono::NaiveDate::parse_from_str(value, "%Y-%m-%d").map_err(|_| {
                    Status::invalid_argument(format!("Invalid {field}; expected YYYY-MM-DD"))
                })
            })
            .transpose()
    };
    let start = parse(start, "start_date")?;
    let end = parse(end, "end_date")?;
    if matches!((start, end), (Some(start), Some(end)) if end < start) {
        return Err(Status::invalid_argument(
            "end_date must be on or after start_date",
        ));
    }
    Ok((start, end))
}

fn parse_schedule_time_range(
    start: &str,
    end: &str,
) -> Result<(chrono::NaiveTime, chrono::NaiveTime), Status> {
    let parse = |value: &str, field: &str| {
        chrono::NaiveTime::parse_from_str(value, "%H:%M:%S")
            .or_else(|_| chrono::NaiveTime::parse_from_str(value, "%H:%M"))
            .map_err(|_| {
                Status::invalid_argument(format!(
                    "Invalid {field}; expected HH:MM:SS or HH:MM"
                ))
            })
    };
    let start_time = parse(start, "start_time")?;
    let end_time = parse(end, "end_time")?;
    if start_time > end_time {
        return Err(Status::invalid_argument(
            "end_time must be on or after start_time",
        ));
    }
    Ok((start_time, end_time))
}

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
    pub stream_manager: crate::modules::distribution::stream::services::StreamConnectionManager,
}

impl ScheduleServiceImpl {
    pub fn new(
        pool: DbPool,
        stream_manager: crate::modules::distribution::stream::services::StreamConnectionManager,
    ) -> Self {
        Self { pool, stream_manager }
    }

    async fn has_active_targets(&self, schedule_id: Uuid) -> bool {
        let has_device: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM hardware_devices WHERE schedule_id = $1)",
        )
        .bind(schedule_id)
        .fetch_one(&self.pool)
        .await
        .unwrap_or(false);
        if has_device {
            return true;
        }
        sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM hardware_display_groups WHERE schedule_id = $1)",
        )
        .bind(schedule_id)
        .fetch_one(&self.pool)
        .await
        .unwrap_or(false)
    }

    async fn resolve_schedule_timezone(&self, schedule_id: Uuid) -> chrono_tz::Tz {
        let tz_str: Option<String> = sqlx::query_scalar(
            r#"
            SELECT timezone FROM hardware_devices
            WHERE schedule_id = $1
               OR display_group_id IN (SELECT id FROM hardware_display_groups WHERE schedule_id = $1)
            ORDER BY updated_at DESC
            LIMIT 1
            "#,
        )
        .bind(schedule_id)
        .fetch_optional(&self.pool)
        .await
        .ok()
        .flatten();

        tz_str
            .as_deref()
            .and_then(|s| s.parse::<chrono_tz::Tz>().ok())
            .unwrap_or(chrono_tz::Asia::Jakarta)
    }

    fn pick_current_active_event_id(
        rows: &[ScheduleEventWithLayoutRow],
        tz: chrono_tz::Tz,
    ) -> Option<Uuid> {
        let now_local = chrono::Utc::now().with_timezone(&tz);
        let now_date = now_local.date_naive();
        let current_time = now_local.time();
        let current_day = now_local.weekday().number_from_monday().to_string();

        let mut best: Option<(i32, chrono::DateTime<chrono::Utc>, Uuid)> = None;
        for r in rows {
            let is_date_match = match (r.start_date, r.end_date) {
                (Some(s), Some(e)) => now_date >= s && now_date <= e,
                (Some(s), None) => now_date >= s,
                (None, Some(e)) => now_date <= e,
                (None, None) => true,
            };
            let is_time_match = if r.start_time <= r.end_time {
                r.start_time <= current_time && r.end_time >= current_time
            } else {
                current_time >= r.start_time || current_time <= r.end_time
            };
            if is_date_match && is_time_match {
                let days: Vec<&str> = r.days_of_week.split(',').map(str::trim).collect();
                if days.contains(&current_day.as_str()) {
                    let is_better = match best {
                        None => true,
                        Some((bp, bc, _)) => r.priority > bp || (r.priority == bp && r.created_at > bc),
                    };
                    if is_better {
                        best = Some((r.priority, r.created_at, r.id));
                    }
                }
            }
        }
        best.map(|(_, _, id)| id)
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
            ORDER BY se.priority DESC, se.created_at DESC
            "#,
        )
        .bind(schedule_id)
        .fetch_all(&self.pool)
        .await
        .unwrap_or_default();

        let active_event_id = if self.has_active_targets(schedule_id).await {
            let tz = self.resolve_schedule_timezone(schedule_id).await;
            Self::pick_current_active_event_id(&rows, tz)
        } else {
            None
        };

        rows.into_iter()
            .map(|r| {
                let is_current_active = active_event_id == Some(r.id);
                ScheduleEvent {
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
                    is_current_active,
                }
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
            is_current_active: false,
        }
    }
}

#[tonic::async_trait]
impl ScheduleServiceTrait for ScheduleServiceImpl {
    async fn create_schedule(
        &self,
        request: Request<CreateScheduleRequest>,
    ) -> Result<Response<Schedule>, Status> {
        let claims =
            crate::grpc::middleware::require_permission(&request, "can_manage_schedules")?;
        let req = request.into_inner();
        let corp_id = claims.active_corporation_id().and_then(|s| Uuid::parse_str(s).ok());
        let branch_id = claims.branch_id.as_deref().and_then(|s| Uuid::parse_str(s).ok());
        let user_id = Uuid::parse_str(&claims.sub).ok();

        let dto = CreateScheduleDto {
            name: req.name,
            description: if req.description.is_empty() {
                None
            } else {
                Some(req.description)
            },
            corporation_id: corp_id,
            branch_id,
            created_by_user_id: user_id,
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
        let id = Uuid::parse_str(&req.id).map_err(|_| Status::invalid_argument("Invalid ID"))?;

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
        let claims = crate::grpc::middleware::require_permission(&request, "can_view_schedules")?;
        let corp_id = claims.active_corporation_id().and_then(|s| Uuid::parse_str(s).ok());
        let req = request.into_inner();

        let search_pattern = req
            .search
            .trim()
            .is_empty()
            .then_some(())
            .map_or_else(|| Some(format!("%{}%", req.search.trim())), |_| None);

        let device_id_filter = req
            .device_id
            .as_deref()
            .filter(|s| !s.trim().is_empty())
            .map(Uuid::parse_str)
            .transpose()
            .map_err(|_| Status::invalid_argument("Invalid device_id"))?;

        let group_id_filter = req
            .display_group_id
            .as_deref()
            .filter(|s| !s.trim().is_empty())
            .map(Uuid::parse_str)
            .transpose()
            .map_err(|_| Status::invalid_argument("Invalid display_group_id"))?;

        let flatten = req.flatten_events.unwrap_or(false);

        if flatten {
            let page = req
                .pagination
                .as_ref()
                .map(|p| p.page.max(1))
                .unwrap_or(1);
            let limit = req
                .pagination
                .as_ref()
                .map(|p| p.limit.clamp(1, 200))
                .unwrap_or(25);
            let offset = (page - 1) * limit;

            let total_items: i64 = sqlx::query_scalar(
                r#"
                SELECT COUNT(*)
                FROM studio_schedule_events se
                INNER JOIN studio_schedules s ON s.id = se.schedule_id
                LEFT JOIN studio_layouts l ON l.id = se.layout_id
                WHERE ($1::uuid IS NULL OR s.corporation_id = $1)
                  AND ($2::text IS NULL OR s.name ILIKE $2 OR COALESCE(s.description, '') ILIKE $2 OR COALESCE(l.name, '') ILIKE $2)
                  AND ($3::uuid IS NULL OR EXISTS (
                      SELECT 1 FROM hardware_devices d
                      LEFT JOIN hardware_display_groups g ON g.id = d.display_group_id
                      WHERE d.id = $3 AND (d.schedule_id = s.id OR g.schedule_id = s.id)
                  ))
                  AND ($4::uuid IS NULL OR EXISTS (
                      SELECT 1 FROM hardware_display_groups g
                      WHERE g.id = $4 AND g.schedule_id = s.id
                  ) OR EXISTS (
                      SELECT 1 FROM hardware_devices d
                      WHERE d.display_group_id = $4 AND d.schedule_id = s.id
                  ))
                "#,
            )
            .bind(corp_id)
            .bind(&search_pattern)
            .bind(device_id_filter)
            .bind(group_id_filter)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| Status::internal(format!("Database error counting schedules: {e}")))?;

            #[derive(sqlx::FromRow)]
            struct FlattenedScheduleEventRow {
                schedule_id: Uuid,
                schedule_name: String,
                schedule_description: Option<String>,
                schedule_created_at: chrono::DateTime<chrono::Utc>,
                schedule_updated_at: chrono::DateTime<chrono::Utc>,
                event_id: Uuid,
                layout_id: Uuid,
                layout_name: Option<String>,
                start_time: chrono::NaiveTime,
                end_time: chrono::NaiveTime,
                days_of_week: String,
                priority: i32,
                start_date: Option<chrono::NaiveDate>,
                end_date: Option<chrono::NaiveDate>,
                event_created_at: chrono::DateTime<chrono::Utc>,
            }

            let rows = sqlx::query_as::<_, FlattenedScheduleEventRow>(
                r#"
                SELECT
                    s.id AS schedule_id,
                    s.name AS schedule_name,
                    s.description AS schedule_description,
                    s.created_at AS schedule_created_at,
                    s.updated_at AS schedule_updated_at,
                    se.id AS event_id,
                    se.layout_id,
                    l.name AS layout_name,
                    se.start_time,
                    se.end_time,
                    se.days_of_week,
                    se.priority,
                    se.start_date,
                    se.end_date,
                    se.created_at AS event_created_at
                FROM studio_schedule_events se
                INNER JOIN studio_schedules s ON s.id = se.schedule_id
                LEFT JOIN studio_layouts l ON l.id = se.layout_id
                WHERE ($1::uuid IS NULL OR s.corporation_id = $1)
                  AND ($2::text IS NULL OR s.name ILIKE $2 OR COALESCE(s.description, '') ILIKE $2 OR COALESCE(l.name, '') ILIKE $2)
                  AND ($3::uuid IS NULL OR EXISTS (
                      SELECT 1 FROM hardware_devices d
                      LEFT JOIN hardware_display_groups g ON g.id = d.display_group_id
                      WHERE d.id = $3 AND (d.schedule_id = s.id OR g.schedule_id = s.id)
                  ))
                  AND ($4::uuid IS NULL OR EXISTS (
                      SELECT 1 FROM hardware_display_groups g
                      WHERE g.id = $4 AND g.schedule_id = s.id
                  ) OR EXISTS (
                      SELECT 1 FROM hardware_devices d
                      WHERE d.display_group_id = $4 AND d.schedule_id = s.id
                  ))
                ORDER BY se.created_at DESC, se.priority DESC
                LIMIT $5 OFFSET $6
                "#,
            )
                .bind(corp_id)
                .bind(&search_pattern)
                .bind(device_id_filter)
                .bind(group_id_filter)
                .bind(limit as i64)
                .bind(offset as i64)
                .fetch_all(&self.pool)
                .await
                .map_err(|e| Status::internal(format!("Database error listing schedules: {e}")))?;

            // Cache active event ID per schedule_id so we evaluate each schedule container once
            let mut active_event_by_schedule: std::collections::HashMap<Uuid, Option<Uuid>> =
                std::collections::HashMap::new();
            for row in &rows {
                if !active_event_by_schedule.contains_key(&row.schedule_id) {
                    let events = self.fetch_events(row.schedule_id).await;
                    let active_id = events
                        .into_iter()
                        .find(|e| e.is_current_active)
                        .and_then(|e| Uuid::parse_str(&e.id).ok());
                    active_event_by_schedule.insert(row.schedule_id, active_id);
                }
            }

            let items = rows
                .into_iter()
                .map(|r| {
                    let is_current_active = active_event_by_schedule
                        .get(&r.schedule_id)
                        .and_then(|opt| *opt)
                        == Some(r.event_id);

                    Schedule {
                        id: r.schedule_id.to_string(),
                        name: r.schedule_name,
                        description: r.schedule_description.unwrap_or_default(),
                        created_at: r.schedule_created_at.to_rfc3339(),
                        updated_at: r.schedule_updated_at.to_rfc3339(),
                        events: vec![ScheduleEvent {
                            id: r.event_id.to_string(),
                            schedule_id: r.schedule_id.to_string(),
                            layout_id: r.layout_id.to_string(),
                            layout_name: r.layout_name.unwrap_or_else(|| "Layout".to_string()),
                            start_time: r.start_time.format("%H:%M:%S").to_string(),
                            end_time: r.end_time.format("%H:%M:%S").to_string(),
                            days_of_week: r.days_of_week,
                            priority: r.priority,
                            created_at: r.event_created_at.to_rfc3339(),
                            start_date: r.start_date.map(|d| d.format("%Y-%m-%d").to_string()),
                            end_date: r.end_date.map(|d| d.format("%Y-%m-%d").to_string()),
                            is_current_active,
                        }],
                    }
                })
                .collect();

            let total_pages = if total_items == 0 {
                0
            } else {
                ((total_items as f64) / (limit as f64)).ceil() as i32
            };

            return Ok(Response::new(ListSchedulesResponse {
                items,
                pagination: Some(crate::grpc::proto::common::v1::PaginationResponse {
                    current_page: page,
                    limit,
                    total_items,
                    total_pages,
                }),
            }));
        }

        let schedules = ScheduleService::list_schedules(&self.pool, corp_id)
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
        let _claims =
            crate::grpc::middleware::require_permission(&request, "can_manage_schedules")?;
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id).map_err(|_| Status::invalid_argument("Invalid ID"))?;

        let dto = UpdateScheduleDto {
            name: if req.name.is_empty() {
                None
            } else {
                Some(req.name)
            },
            description: if req.description.is_empty() {
                None
            } else {
                Some(req.description)
            },
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
        let _claims =
            crate::grpc::middleware::require_permission(&request, "can_manage_schedules")?;
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id).map_err(|_| Status::invalid_argument("Invalid ID"))?;

        let success = ScheduleService::delete_schedule(&self.pool, id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(DeleteScheduleResponse { success }))
    }

    async fn push_layout_to_schedule(
        &self,
        request: Request<PushLayoutToScheduleRequest>,
    ) -> Result<Response<PushLayoutToScheduleResponse>, Status> {
        let claims =
            crate::grpc::middleware::require_permission(&request, "can_manage_schedules")?;
        let req = request.into_inner();
        let layout_id = Uuid::parse_str(&req.layout_id)
            .map_err(|_| Status::invalid_argument("Invalid layout_id"))?;

        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?;

        // 0. Verify layout exists and resolve corporation_id & branch_id
        let layout_row: Option<(Option<Uuid>, Option<Uuid>)> = sqlx::query_as(
            "SELECT corporation_id, branch_id FROM studio_layouts WHERE id = $1",
        )
        .bind(layout_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| Status::internal(format!("Database error querying layout: {e}")))?;

        let (layout_corp_id, layout_branch_id) = layout_row
            .ok_or_else(|| Status::not_found(format!("Layout with ID '{}' not found", layout_id)))?;

        let corp_id = claims
            .active_corporation_id()
            .and_then(|s| Uuid::parse_str(s).ok())
            .or(layout_corp_id);
        let branch_id = claims
            .branch_id
            .as_deref()
            .and_then(|s| Uuid::parse_str(s).ok())
            .or(layout_branch_id);
        let user_id = Uuid::parse_str(&claims.sub).ok();

        // 1. Resolve or Create schedule
        let schedule_name = if req.schedule_name.trim().is_empty() {
            "Jadwal Layout".to_string()
        } else {
            req.schedule_name.trim().to_string()
        };

        let schedule_id = if let Some(schedule_id) = req
            .schedule_id
            .as_deref()
            .filter(|id| !id.trim().is_empty())
        {
            let existing_id = Uuid::parse_str(schedule_id)
                .map_err(|_| Status::invalid_argument("Invalid schedule_id"))?;
            let exists: bool =
                sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM studio_schedules WHERE id = $1)")
                    .bind(existing_id)
                    .fetch_one(&mut *tx)
                    .await
                    .map_err(|e| {
                        Status::internal(format!("Database error checking schedule: {e}"))
                    })?;
            if !exists {
                return Err(Status::not_found("Schedule not found"));
            }
            sqlx::query("UPDATE studio_schedules SET name = $2, updated_at = NOW() WHERE id = $1")
                .bind(existing_id)
                .bind(&schedule_name)
                .execute(&mut *tx)
                .await
                .map_err(|e| Status::internal(format!("Failed to update schedule: {e}")))?;
            existing_id
        } else {
            sqlx::query_scalar::<_, Uuid>(
                r#"
                INSERT INTO studio_schedules (name, description, corporation_id, branch_id, created_by_user_id, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                RETURNING id
                "#,
            )
            .bind(&schedule_name)
            .bind(format!("Dipush dari template layout {}", layout_id))
            .bind(corp_id)
            .bind(branch_id)
            .bind(user_id)
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
                    let vh = hex::encode(hasher.finalize());
                    if let Ok(snapshot_val) = serde_json::to_value(&full_dto) {
                        let _ = sqlx::query(
                            "INSERT INTO studio_layout_history (layout_id, version_hash, snapshot_json, description, corporation_id, created_by_user_id) VALUES ($1, $2, $3, $4, $5, $6)"
                        )
                        .bind(layout_id)
                        .bind(&vh)
                        .bind(snapshot_val)
                        .bind("Snapshot awal saat push penjadwalan")
                        .bind(corp_id)
                        .bind(user_id)
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
        let (start_time, end_time) = parse_schedule_time_range(&req.start_time, &req.end_time)?;

        let (start_date, end_date) =
            parse_schedule_date_range(req.start_date.as_deref(), req.end_date.as_deref())?;

        let days_of_week = if req.days_of_week.trim().is_empty() {
            "1,2,3,4,5,6,7".to_string()
        } else {
            let days: Vec<&str> = req.days_of_week.split(',').map(str::trim).collect();
            if days
                .iter()
                .any(|day| !matches!(*day, "1" | "2" | "3" | "4" | "5" | "6" | "7"))
                || days.iter().collect::<std::collections::HashSet<_>>().len() != days.len()
            {
                return Err(Status::invalid_argument(
                    "days_of_week must contain unique values from 1 to 7",
                ));
            }
            days.join(",")
        };

        sqlx::query(
            r#"
            INSERT INTO studio_schedule_events (
                schedule_id, layout_id, start_time, end_time, days_of_week,
                priority, start_date, end_date, version_hash, corporation_id, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            "#,
        )
        .bind(schedule_id)
        .bind(layout_id)
        .bind(start_time)
        .bind(end_time)
        .bind(&days_of_week)
        .bind(req.priority)
        .bind(start_date)
        .bind(end_date)
        .bind(&version_hash)
        .bind(corp_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| Status::internal(format!("Failed to create schedule event: {}", e)))?;

        // 3. Assign schedule_id to selected devices
        let mut affected = 0i32;
        for dev_str in &req.device_ids {
            let dev_id = Uuid::parse_str(dev_str)
                .map_err(|_| Status::invalid_argument("Invalid device_id"))?;
            let current_schedule: Option<Uuid> = sqlx::query_scalar(
                "SELECT schedule_id FROM hardware_devices WHERE id = $1 FOR UPDATE",
            )
            .bind(dev_id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| Status::internal(format!("Failed to check player schedule: {e}")))?
            .ok_or_else(|| Status::not_found("Player not found"))?;
            if current_schedule.is_some_and(|current| current != schedule_id) {
                return Err(Status::failed_precondition(
                    "Player is already assigned to a different rundown",
                ));
            }
            affected += sqlx::query(
                "UPDATE hardware_devices SET schedule_assigned_at = CASE WHEN schedule_id IS DISTINCT FROM $1 OR schedule_assigned_at IS NULL THEN NOW() ELSE schedule_assigned_at END, schedule_id = $1, updated_at = NOW() WHERE id = $2",
            )
            .bind(schedule_id)
            .bind(dev_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| Status::internal(format!("Failed to assign rundown to player: {e}")))?
            .rows_affected() as i32;
        }

        // 4. Assign schedule_id to selected display groups
        for grp_str in &req.display_group_ids {
            let grp_id = Uuid::parse_str(grp_str)
                .map_err(|_| Status::invalid_argument("Invalid display_group_id"))?;
            let current_schedule: Option<Uuid> = sqlx::query_scalar(
                "SELECT schedule_id FROM hardware_display_groups WHERE id = $1 FOR UPDATE",
            )
            .bind(grp_id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| Status::internal(format!("Failed to check display group schedule: {e}")))?
            .ok_or_else(|| Status::not_found("Display group not found"))?;
            if current_schedule.is_some_and(|current| current != schedule_id) {
                return Err(Status::failed_precondition(
                    "Display group is already assigned to a different rundown",
                ));
            }
            sqlx::query("UPDATE hardware_display_groups SET schedule_assigned_at = CASE WHEN schedule_id IS DISTINCT FROM $1 OR schedule_assigned_at IS NULL THEN NOW() ELSE schedule_assigned_at END, schedule_id = $1, updated_at = NOW() WHERE id = $2")
                .bind(schedule_id)
                .bind(grp_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| Status::internal(format!("Failed to assign rundown to display group: {e}")))?;
        }

        tx.commit()
            .await
            .map_err(|e| Status::internal(format!("Commit failed: {}", e)))?;

        // Evaluasi apakah event yang baru di-push mencakup jam tayang saat ini pada masing-masing device
        // Jika ya ("scheduler yang dipush seketika"), kirimkan sinyal ReloadManifest agar player seketika menampilkan progress dialog
        let mut target_device_ids = Vec::new();
        for dev_str in &req.device_ids {
            if let Ok(did) = Uuid::parse_str(dev_str) {
                target_device_ids.push(did);
            }
        }
        for grp_str in &req.display_group_ids {
            if let Ok(gid) = Uuid::parse_str(grp_str) {
                if let Ok(group_devices) = sqlx::query_scalar::<_, Uuid>(
                    "SELECT id FROM hardware_devices WHERE display_group_id = $1"
                )
                .bind(gid)
                .fetch_all(&self.pool)
                .await {
                    target_device_ids.extend(group_devices);
                }
            }
        }
        target_device_ids.sort();
        target_device_ids.dedup();

        for dev_id in target_device_ids {
            if let Ok(Some(dev)) = crate::modules::hardware::device::repositories::DeviceRepository::find_by_id(&self.pool, dev_id).await {
                let tz: chrono_tz::Tz = dev.timezone.parse().unwrap_or(chrono_tz::UTC);
                let now_local = chrono::Utc::now().with_timezone(&tz);
                let now_date = now_local.date_naive();
                let now_time = now_local.time();
                let current_day = now_local.weekday().number_from_monday().to_string();

                let is_date_active = match (start_date, end_date) {
                    (Some(s), Some(e)) => now_date >= s && now_date <= e,
                    (Some(s), None) => now_date >= s,
                    (None, Some(e)) => now_date <= e,
                    (None, None) => true,
                };
                let is_time_active = if start_time <= end_time {
                    start_time <= now_time && end_time >= now_time
                } else {
                    now_time >= start_time || now_time <= end_time
                };
                let days_list: Vec<&str> = days_of_week.split(',').collect();
                let is_day_active = days_list.contains(&current_day.as_str());

                // Jika event aktif detik ini, kirimkan perintah ReloadManifest ke player
                if is_date_active && is_time_active && is_day_active {
                    let _ = self.stream_manager.send_command(
                        &self.pool,
                        crate::modules::distribution::stream::model::PushCommandDto {
                            device_id: dev_id,
                            command_type: crate::modules::distribution::stream::model::LiveCommandType::ReloadManifest,
                            payload_json: None,
                        },
                    ).await;
                }
            }
        }

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
        let _claims =
            crate::grpc::middleware::require_permission(&request, "can_manage_schedules")?;
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
        let _claims =
            crate::grpc::middleware::require_permission(&request, "can_manage_schedules")?;
        let req = request.into_inner();
        let id =
            Uuid::parse_str(&req.id).map_err(|_| Status::invalid_argument("Invalid event ID"))?;
        let schedule_id = Uuid::parse_str(&req.schedule_id)
            .map_err(|_| Status::invalid_argument("Invalid schedule ID"))?;

        let success = ScheduleService::remove_schedule_event(&self.pool, id, schedule_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(RemoveScheduleEventResponse { success }))
    }
}

#[cfg(test)]
mod tests {
    use super::{parse_schedule_date_range, parse_schedule_time_range};

    #[test]
    fn schedule_date_range_requires_valid_order_and_format() {
        assert!(parse_schedule_date_range(Some("2026-11-06"), Some("2026-11-07")).is_ok());
        assert!(parse_schedule_date_range(Some("2026-11-07"), Some("2026-11-06")).is_err());
        assert!(parse_schedule_date_range(Some("06-11-2026"), None).is_err());
    }

    #[test]
    fn schedule_time_range_requires_valid_order_and_format() {
        assert!(parse_schedule_time_range("08:00:00", "17:00:00").is_ok());
        assert!(parse_schedule_time_range("08:00", "17:00").is_ok());
        assert!(parse_schedule_time_range("17:00", "08:00").is_err());
        assert!(parse_schedule_time_range("invalid", "17:00").is_err());
    }
}
