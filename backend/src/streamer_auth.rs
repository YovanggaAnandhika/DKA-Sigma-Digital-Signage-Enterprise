use axum::{extract::State, http::StatusCode, routing::post, Json, Router};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Deserialize)]
struct AuthRequest {
    #[serde(default)]
    action: String,
    #[serde(default)]
    path: String,
    #[serde(default)]
    user: String,
    #[serde(default)]
    password: String,
}

pub fn router(pool: PgPool) -> Router {
    Router::new()
        .route("/api/streamer/auth", post(authorize))
        .with_state(pool)
}

async fn authorize(State(pool): State<PgPool>, Json(request): Json<AuthRequest>) -> StatusCode {
    if request.action != "publish"
        || request.path.starts_with("webrtc/")
        || request.path.starts_with("hd/")
        || request.path == "cctv_test"
        || request.path == "test_source"
    {
        return StatusCode::OK;
    }

    let Some(stream_id) = request.path.strip_prefix("live/") else {
        return StatusCode::OK;
    };
    let Ok(stream_id) = Uuid::parse_str(stream_id.trim()) else {
        return StatusCode::NOT_FOUND;
    };

    let stream = sqlx::query_as::<_, (bool, Option<String>, Option<String>)>(
        r#"
        SELECT requires_auth, ingest_username, ingest_password
        FROM components_live_streams
        WHERE id = $1
        "#,
    )
    .bind(stream_id)
    .fetch_optional(&pool)
    .await;

    match stream {
        Ok(Some((requires_auth, username, password))) => {
            if !requires_auth
                || credentials_match(username.as_deref(), &request.user)
                    && credentials_match(password.as_deref(), &request.password)
            {
                StatusCode::OK
            } else {
                StatusCode::UNAUTHORIZED
            }
        }
        Ok(None) => StatusCode::NOT_FOUND,
        Err(error) => {
            tracing::error!(%error, "Streamer authentication lookup failed");
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

fn credentials_match(expected: Option<&str>, provided: &str) -> bool {
    let expected = expected.unwrap_or_default().trim();
    expected.is_empty() || provided.trim() == expected
}

#[cfg(test)]
mod tests {
    use super::credentials_match;

    #[test]
    fn empty_configured_credential_is_optional() {
        assert!(credentials_match(None, ""));
        assert!(credentials_match(Some("  "), "anything"));
    }

    #[test]
    fn configured_credential_must_match() {
        assert!(credentials_match(Some("encoder"), "encoder"));
        assert!(!credentials_match(Some("encoder"), "wrong"));
    }
}
