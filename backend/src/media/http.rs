use axum::{
    extract::{Path, Query, State},
    http::{header, HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use uuid::Uuid;

use super::hub::{MediaError, MediaHub};

#[derive(Deserialize)]
struct SessionQuery {
    session: Option<Uuid>,
}

pub fn router(hub: MediaHub) -> Router {
    Router::new()
        .route(
            "/api/media/streams/{id}/whip",
            post(handle_whip_post)
                .patch(handle_ice_patch)
                .delete(handle_whip_delete),
        )
        .route(
            "/api/media/streams/{id}/whep",
            post(handle_whep_post)
                .patch(handle_ice_patch)
                .delete(handle_whep_delete),
        )
        .route("/api/media/streams/{id}/status", get(handle_status))
        .with_state(hub)
}

async fn handle_whip_post(
    State(hub): State<MediaHub>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    sdp_offer: String,
) -> impl IntoResponse {
    let auth_header = headers
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok());

    match hub.negotiate_whip(id, auth_header, sdp_offer).await {
        Ok((sdp_answer, session_id)) => (
            StatusCode::CREATED,
            [
                (header::CONTENT_TYPE, "application/sdp".to_string()),
                (
                    header::LOCATION,
                    format!("/streams/{}/whip?session={}", id, session_id),
                ),
            ],
            sdp_answer,
        )
            .into_response(),
        Err(err) => media_error_response(err),
    }
}

async fn handle_whep_post(
    State(hub): State<MediaHub>,
    Path(id): Path<Uuid>,
    sdp_offer: String,
) -> impl IntoResponse {
    match hub.negotiate_whep(id, sdp_offer).await {
        Ok((sdp_answer, session_id)) => (
            StatusCode::CREATED,
            [
                (header::CONTENT_TYPE, "application/sdp".to_string()),
                (
                    header::LOCATION,
                    format!("/streams/{}/whep?session={}", id, session_id),
                ),
            ],
            sdp_answer,
        )
            .into_response(),
        Err(err) => media_error_response(err),
    }
}

async fn handle_ice_patch() -> StatusCode {
    StatusCode::NO_CONTENT
}

async fn handle_whip_delete(
    State(hub): State<MediaHub>,
    Path(id): Path<Uuid>,
    Query(query): Query<SessionQuery>,
) -> StatusCode {
    if let Some(session_id) = query.session {
        hub.close_session(session_id);
    } else {
        hub.kick_stream(id);
    }
    StatusCode::OK
}

async fn handle_whep_delete(
    State(hub): State<MediaHub>,
    Query(query): Query<SessionQuery>,
) -> StatusCode {
    if let Some(session_id) = query.session {
        hub.close_session(session_id);
    }
    StatusCode::OK
}

async fn handle_status(State(hub): State<MediaHub>, Path(id): Path<Uuid>) -> impl IntoResponse {
    let status = hub.stream_status(id).await;
    (StatusCode::OK, Json(status))
}

fn media_error_response(err: MediaError) -> axum::response::Response {
    match err {
        MediaError::NotFound(msg) => (StatusCode::NOT_FOUND, msg).into_response(),
        MediaError::Unauthorized(msg) => (
            StatusCode::UNAUTHORIZED,
            [(header::WWW_AUTHENTICATE, "Bearer error=\"invalid_token\"")],
            msg,
        )
            .into_response(),
        MediaError::Forbidden(msg) => (StatusCode::FORBIDDEN, msg).into_response(),
        MediaError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg).into_response(),
        MediaError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg).into_response(),
    }
}
