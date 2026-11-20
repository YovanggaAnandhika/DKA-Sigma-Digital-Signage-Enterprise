use sqlx::PgPool;
use tokio::sync::{mpsc, oneshot};
use tracing::error;
use uuid::Uuid;

use super::sfu::{spawn_sfu, SfuCommand, StreamLiveStatus};

#[derive(Debug)]
pub enum MediaError {
    NotFound(String),
    Unauthorized(String),
    Forbidden(String),
    BadRequest(String),
    Internal(String),
}

#[derive(Clone)]
pub struct MediaHub {
    cmd_tx: mpsc::UnboundedSender<SfuCommand>,
    pool: PgPool,
}

impl MediaHub {
    pub async fn start(
        pool: PgPool,
        media_udp_port: u16,
        media_public_ip: String,
    ) -> Result<Self, std::io::Error> {
        let cmd_tx = spawn_sfu(media_udp_port, media_public_ip).await?;
        Ok(Self { cmd_tx, pool })
    }

    pub fn rtsp_sender(&self) -> mpsc::UnboundedSender<SfuCommand> {
        self.cmd_tx.clone()
    }

    pub async fn negotiate_whip(
        &self,
        stream_id: Uuid,
        auth_header: Option<&str>,
        sdp_offer: String,
    ) -> Result<(String, Uuid), MediaError> {
        let record = sqlx::query_as::<_, (bool, bool, Option<String>)>(
            r#"
            SELECT is_relay_active, requires_auth, ingest_password
            FROM components_live_streams
            WHERE id = $1
            "#,
        )
        .bind(stream_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| {
            error!(%e, "WHIP database lookup failed");
            MediaError::Internal("Database lookup failed".to_string())
        })?;

        let Some((is_relay_active, requires_auth, ingest_password)) = record else {
            return Err(MediaError::NotFound("Live stream not found".to_string()));
        };

        if !is_relay_active {
            return Err(MediaError::Forbidden("Live stream relay is disabled".to_string()));
        }

        if requires_auth {
            let expected = ingest_password.unwrap_or_default();
            let expected = expected.trim();
            let provided = extract_bearer_token(auth_header);
            if expected.is_empty() || provided != expected {
                return Err(MediaError::Unauthorized(
                    "Invalid or missing WHIP Bearer token".to_string(),
                ));
            }
        }

        let (reply_tx, reply_rx) = oneshot::channel();
        self.cmd_tx
            .send(SfuCommand::RegisterWhip {
                stream_id,
                sdp_offer,
                reply: reply_tx,
            })
            .map_err(|_| MediaError::Internal("Media SFU loop unavailable".to_string()))?;

        reply_rx
            .await
            .map_err(|_| MediaError::Internal("Media SFU dropped WHIP reply".to_string()))?
            .map_err(MediaError::BadRequest)
    }

    pub async fn negotiate_whep(
        &self,
        stream_id: Uuid,
        sdp_offer: String,
    ) -> Result<(String, Uuid), MediaError> {
        let is_active = sqlx::query_scalar::<_, bool>(
            "SELECT is_relay_active FROM components_live_streams WHERE id = $1",
        )
        .bind(stream_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| {
            error!(%e, "WHEP database lookup failed");
            MediaError::Internal("Database lookup failed".to_string())
        })?;

        if !matches!(is_active, Some(true)) {
            return Err(MediaError::NotFound("Stream offline".to_string()));
        }

        let (reply_tx, reply_rx) = oneshot::channel();
        self.cmd_tx
            .send(SfuCommand::RegisterWhep {
                stream_id,
                sdp_offer,
                reply: reply_tx,
            })
            .map_err(|_| MediaError::Internal("Media SFU loop unavailable".to_string()))?;

        reply_rx
            .await
            .map_err(|_| MediaError::Internal("Media SFU dropped WHEP reply".to_string()))?
            .map_err(|err| {
                if err == "OFFLINE" {
                    MediaError::NotFound("Stream offline".to_string())
                } else {
                    MediaError::BadRequest(err)
                }
            })
    }

    pub fn close_session(&self, session_id: Uuid) {
        let _ = self.cmd_tx.send(SfuCommand::CloseSession { session_id });
    }

    pub fn kick_stream(&self, stream_id: Uuid) {
        let _ = self.cmd_tx.send(SfuCommand::KickStream { stream_id });
    }

    pub async fn stream_status(&self, stream_id: Uuid) -> StreamLiveStatus {
        let (reply_tx, reply_rx) = oneshot::channel();
        if self
            .cmd_tx
            .send(SfuCommand::QueryStatus {
                stream_id,
                reply: reply_tx,
            })
            .is_err()
        {
            return StreamLiveStatus::default();
        }
        reply_rx.await.unwrap_or_default()
    }

    pub fn shutdown(&self) {
        let _ = self.cmd_tx.send(SfuCommand::Shutdown);
    }
}

fn extract_bearer_token(header: Option<&str>) -> &str {
    let raw = header.unwrap_or_default().trim();
    if raw.len() >= 7 && raw[..7].eq_ignore_ascii_case("bearer ") {
        raw[7..].trim()
    } else {
        raw
    }
}

#[cfg(test)]
mod tests {
    use super::extract_bearer_token;

    #[test]
    fn bearer_extraction_handles_case_and_whitespace() {
        assert_eq!(extract_bearer_token(Some("Bearer sig_tok_abc")), "sig_tok_abc");
        assert_eq!(extract_bearer_token(Some("bearer   sig_tok_xyz  ")), "sig_tok_xyz");
        assert_eq!(extract_bearer_token(Some("sig_tok_raw")), "sig_tok_raw");
        assert_eq!(extract_bearer_token(None), "");
    }
}
