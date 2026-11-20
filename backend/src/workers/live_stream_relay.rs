use std::collections::HashMap;
use std::sync::Arc;

use sqlx::PgPool;
use tokio::sync::{oneshot, Mutex};
use tracing::{error, info};
use uuid::Uuid;

use crate::media::rtsp_pull::spawn_rtsp_pull;
use crate::media::MediaHub;

#[derive(Clone)]
pub struct LiveStreamRelayManager {
    stop_signals: Arc<Mutex<HashMap<Uuid, oneshot::Sender<()>>>>,
    media_hub: MediaHub,
}

impl LiveStreamRelayManager {
    pub fn new(media_hub: MediaHub) -> Self {
        Self {
            stop_signals: Arc::new(Mutex::new(HashMap::new())),
            media_hub,
        }
    }

    pub fn media_hub(&self) -> &MediaHub {
        &self.media_hub
    }

    pub async fn start_relay(
        &self,
        stream_id: Uuid,
        stream_mode: &str,
        source_type: &str,
        source_url: &str,
        requires_auth: bool,
        ingest_username: &str,
        ingest_password: &str,
    ) {
        self.stop_task_only(&stream_id).await;

        let upper_type = source_type.to_uppercase();
        if stream_mode != "SERVER_HOSTED_HLS" {
            return;
        }

        if upper_type == "WHIP" {
            info!(
                "⏳ [LiveStreamRelay] Native Pure-Rust WHIP UDP ingest ready on MediaSFU for stream [{}]",
                stream_id
            );
            return;
        }

        if upper_type == "RTSP" {
            let (stop_tx, stop_rx) = oneshot::channel::<()>();
            {
                let mut signals = self.stop_signals.lock().await;
                signals.insert(stream_id, stop_tx);
            }
            spawn_rtsp_pull(
                stream_id,
                source_url.to_string(),
                requires_auth,
                ingest_username.to_string(),
                ingest_password.to_string(),
                self.media_hub.rtsp_sender(),
                stop_rx,
            );
        }
    }

    pub async fn stop_relay(&self, stream_id: &Uuid) {
        self.stop_task_only(stream_id).await;
        self.media_hub.kick_stream(*stream_id);
    }

    async fn stop_task_only(&self, stream_id: &Uuid) {
        let mut signals = self.stop_signals.lock().await;
        if let Some(stop_tx) = signals.remove(stream_id) {
            info!("Stopping RTSP pull worker for stream [{}]", stream_id);
            let _ = stop_tx.send(());
        }
    }

    pub async fn stop_all(&self) {
        let mut signals = self.stop_signals.lock().await;
        for (stream_id, stop_tx) in signals.drain() {
            info!("Shutting down RTSP pull worker for stream [{}]", stream_id);
            let _ = stop_tx.send(());
        }
        self.media_hub.shutdown();
    }

    pub async fn sync_active_relays(&self, pool: &PgPool) {
        #[derive(sqlx::FromRow)]
        struct ActiveStreamRow {
            id: Uuid,
            stream_mode: String,
            source_type: String,
            source_url: String,
            requires_auth: bool,
            ingest_username: String,
            ingest_password: String,
        }

        let active_rows = match sqlx::query_as::<_, ActiveStreamRow>(
            "SELECT id, stream_mode, source_type, source_url, requires_auth, ingest_username, ingest_password FROM components_live_streams WHERE stream_mode = 'SERVER_HOSTED_HLS' AND is_relay_active = true"
        )
        .fetch_all(pool)
        .await
        {
            Ok(rows) => rows,
            Err(e) => {
                error!("Failed to query active live streams for relay: {}", e);
                return;
            }
        };

        info!(
            "Syncing {} active Live Stream configurations with Pure-Rust MediaSFU...",
            active_rows.len()
        );
        for row in active_rows {
            self.start_relay(
                row.id,
                &row.stream_mode,
                &row.source_type,
                &row.source_url,
                row.requires_auth,
                &row.ingest_username,
                &row.ingest_password,
            )
            .await;
        }
    }
}
