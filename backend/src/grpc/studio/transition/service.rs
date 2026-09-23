use std::sync::Arc;
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::modules::studio::transition::repositories::TransitionRepository;
use crate::grpc::proto::studio::v1::transition::{
    transition_service_server::TransitionService,
    CreateTransitionRequest, DeleteTransitionRequest, DeleteTransitionResponse,
    GetTransitionRequest, ListTransitionsRequest, ListTransitionsResponse, Transition,
    UpdateTransitionRequest,
};

pub struct MyTransitionService {
    repository: Arc<TransitionRepository>,
}

impl MyTransitionService {
    pub fn new(repository: Arc<TransitionRepository>) -> Self {
        Self { repository }
    }
}

#[tonic::async_trait]
impl TransitionService for MyTransitionService {
    async fn list_transitions(
        &self,
        request: Request<ListTransitionsRequest>,
    ) -> Result<Response<ListTransitionsResponse>, Status> {
        let req = request.into_inner();
        let page = if req.page > 0 { req.page } else { 1 };
        let limit = if req.limit > 0 { req.limit } else { 10 };
        let offset = (page - 1) * limit;

        let (transitions, total) = self
            .repository
            .find_all(req.search.as_deref(), limit, offset)
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?;

        let proto_transitions = transitions
            .into_iter()
            .map(|t| Transition {
                id: t.id.to_string(),
                name: t.name,
                css_class: t.css_class,
                duration_ms: t.duration_ms,
                created_at: t.created_at.to_rfc3339(),
                updated_at: t.updated_at.to_rfc3339(),
            })
            .collect();

        Ok(Response::new(ListTransitionsResponse {
            transitions: proto_transitions,
            total,
            page,
            limit,
        }))
    }

    async fn get_transition(
        &self,
        request: Request<GetTransitionRequest>,
    ) -> Result<Response<Transition>, Status> {
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id).map_err(|_| Status::invalid_argument("Invalid ID format"))?;

        let transition = self
            .repository
            .find_by_id(id)
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?
            .ok_or_else(|| Status::not_found("Transition not found"))?;

        Ok(Response::new(Transition {
            id: transition.id.to_string(),
            name: transition.name,
            css_class: transition.css_class,
            duration_ms: transition.duration_ms,
            created_at: transition.created_at.to_rfc3339(),
            updated_at: transition.updated_at.to_rfc3339(),
        }))
    }

    async fn create_transition(
        &self,
        request: Request<CreateTransitionRequest>,
    ) -> Result<Response<Transition>, Status> {
        let req = request.into_inner();
        let transition = self
            .repository
            .create(&req.name, &req.css_class, req.duration_ms)
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?;

        Ok(Response::new(Transition {
            id: transition.id.to_string(),
            name: transition.name,
            css_class: transition.css_class,
            duration_ms: transition.duration_ms,
            created_at: transition.created_at.to_rfc3339(),
            updated_at: transition.updated_at.to_rfc3339(),
        }))
    }

    async fn update_transition(
        &self,
        request: Request<UpdateTransitionRequest>,
    ) -> Result<Response<Transition>, Status> {
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id).map_err(|_| Status::invalid_argument("Invalid ID format"))?;

        let transition = self
            .repository
            .update(
                id,
                req.name.as_deref(),
                req.css_class.as_deref(),
                req.duration_ms,
            )
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?;

        Ok(Response::new(Transition {
            id: transition.id.to_string(),
            name: transition.name,
            css_class: transition.css_class,
            duration_ms: transition.duration_ms,
            created_at: transition.created_at.to_rfc3339(),
            updated_at: transition.updated_at.to_rfc3339(),
        }))
    }

    async fn delete_transition(
        &self,
        request: Request<DeleteTransitionRequest>,
    ) -> Result<Response<DeleteTransitionResponse>, Status> {
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id).map_err(|_| Status::invalid_argument("Invalid ID format"))?;

        let success = self
            .repository
            .delete(id)
            .await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?;

        Ok(Response::new(DeleteTransitionResponse { success }))
    }
}
