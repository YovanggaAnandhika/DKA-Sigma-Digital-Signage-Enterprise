use tonic::{Request, Response, Status};
use uuid::Uuid;
use crate::db::DbPool;
use crate::modules::studio::schedule::model::{
    AddScheduleEventDto, CreateScheduleDto, ScheduleEntity, ScheduleEventEntity,
    ScheduleWithEventsDto, UpdateScheduleDto,
};
use crate::modules::studio::schedule::services::ScheduleService;
use crate::grpc::proto::studio::v1::schedule::{
    schedule_service_server::ScheduleService as ScheduleServiceTrait,
    AddScheduleEventRequest, CreateScheduleRequest, DeleteScheduleRequest, DeleteScheduleResponse,
    GetScheduleRequest, ListSchedulesRequest, ListSchedulesResponse, RemoveScheduleEventRequest,
    RemoveScheduleEventResponse, Schedule, ScheduleEvent, UpdateScheduleRequest,
};

pub struct ScheduleServiceImpl {
    pub pool: DbPool,
}

impl ScheduleServiceImpl {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
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
            created_at: entity.created_at.to_rfc3339(),
        }
    }
}

#[tonic::async_trait]
impl ScheduleServiceTrait for ScheduleServiceImpl {
    async fn create_schedule(
        &self,
        request: Request<CreateScheduleRequest>,
    ) -> Result<Response<Schedule>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_playlists")?;
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
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_playlists")?;
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid ID"))?;

        let schedule_with_events = ScheduleService::get_schedule_by_id(&self.pool, id)
            .await
            .map_err(Status::from)?;

        let mut proto_schedule = Self::map_entity(schedule_with_events.schedule);
        proto_schedule.events = schedule_with_events.events.into_iter().map(Self::map_event_entity).collect();

        Ok(Response::new(proto_schedule))
    }

    async fn list_schedules(
        &self,
        request: Request<ListSchedulesRequest>,
    ) -> Result<Response<ListSchedulesResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_playlists")?;
        let schedules = ScheduleService::list_schedules(&self.pool)
            .await
            .map_err(Status::from)?;

        let items = schedules.into_iter().map(Self::map_entity).collect();

        Ok(Response::new(ListSchedulesResponse {
            items,
            pagination: None,
        }))
    }

    async fn update_schedule(
        &self,
        request: Request<UpdateScheduleRequest>,
    ) -> Result<Response<Schedule>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_playlists")?;
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
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_playlists")?;
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid ID"))?;

        let success = ScheduleService::delete_schedule(&self.pool, id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(DeleteScheduleResponse { success }))
    }

    async fn add_schedule_event(
        &self,
        request: Request<AddScheduleEventRequest>,
    ) -> Result<Response<ScheduleEvent>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_playlists")?;
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
        };

        let event = ScheduleService::add_schedule_event(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_event_entity(event)))
    }

    async fn remove_schedule_event(
        &self,
        request: Request<RemoveScheduleEventRequest>,
    ) -> Result<Response<RemoveScheduleEventResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_playlists")?;
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
