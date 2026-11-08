use std::collections::HashMap;
use std::sync::Arc;
use tokio::process::{Child, Command};
use tokio::sync::Mutex;
use tracing::{error, info};
use uuid::Uuid;
use sqlx::PgPool;

#[derive(Clone)]
pub struct LiveStreamRelayManager {
    processes: Arc<Mutex<HashMap<Uuid, Child>>>,
    upload_dir: String,
}

impl LiveStreamRelayManager {
    pub fn new(upload_dir: String) -> Self {
        Self {
            processes: Arc::new(Mutex::new(HashMap::new())),
            upload_dir,
        }
    }

    pub fn upload_dir(&self) -> &str {
        &self.upload_dir
    }

    pub async fn start_relay(
        &self,
        stream_id: Uuid,
        source_type: &str,
        source_url: &str,
        low_latency: bool,
    ) {
        // Stop existing process if any
        self.stop_relay(&stream_id).await;

        let out_dir = format!("{}/streams/{}", self.upload_dir, stream_id);
        if let Err(e) = tokio::fs::create_dir_all(&out_dir).await {
            error!("Failed to create stream output directory {}: {}", out_dir, e);
            return;
        }

        let m3u8_path = format!("{}/live.m3u8", out_dir);
        let segment_path = format!("{}/live%d.ts", out_dir);

        let hls_time = if low_latency { "1" } else { "2" };
        let hls_list_size = if low_latency { "3" } else { "5" };

        let mut cmd = Command::new("ffmpeg");
        cmd.arg("-y");

        match source_type.to_uppercase().as_str() {
            "RTMP" => {
                // Listen mode on RTMP port 1935 for stream key UUID
                cmd.args([
                    "-listen", "1",
                    "-i", &format!("rtmp://0.0.0.0:1935/live/{}", stream_id),
                    "-c:v", "copy",
                    "-c:a", "copy",
                    "-f", "hls",
                    "-hls_time", hls_time,
                    "-hls_list_size", hls_list_size,
                    "-hls_flags", "delete_segments",
                    "-hls_segment_filename", &segment_path,
                    &m3u8_path,
                ]);
            }
            "RTSP" => {
                // Pull from RTSP camera feed
                cmd.args([
                    "-rtsp_transport", "tcp",
                    "-i", source_url,
                    "-c:v", "copy",
                    "-c:a", "aac",
                    "-f", "hls",
                    "-hls_time", hls_time,
                    "-hls_list_size", hls_list_size,
                    "-hls_flags", "delete_segments",
                    "-hls_segment_filename", &segment_path,
                    &m3u8_path,
                ]);
            }
            _ => {
                // Generic HTTP/HLS pull relay
                cmd.args([
                    "-i", source_url,
                    "-c:v", "copy",
                    "-c:a", "copy",
                    "-f", "hls",
                    "-hls_time", hls_time,
                    "-hls_list_size", hls_list_size,
                    "-hls_flags", "delete_segments",
                    "-hls_segment_filename", &segment_path,
                    &m3u8_path,
                ]);
            }
        }

        cmd.stdout(std::process::Stdio::null());
        cmd.stderr(std::process::Stdio::null());

        match cmd.spawn() {
            Ok(child) => {
                info!("Spawned FFmpeg HLS relay for stream [{}] (source: {})", stream_id, source_type);
                let mut procs = self.processes.lock().await;
                procs.insert(stream_id, child);
            }
            Err(e) => {
                error!("Failed to spawn FFmpeg process for stream [{}]: {}", stream_id, e);
            }
        }
    }

    pub async fn stop_relay(&self, stream_id: &Uuid) {
        let mut procs = self.processes.lock().await;
        if let Some(mut child) = procs.remove(stream_id) {
            info!("Stopping FFmpeg HLS relay for stream [{}]", stream_id);
            let _ = child.kill().await;
        }
    }

    pub async fn sync_active_relays(&self, pool: &PgPool) {
        #[derive(sqlx::FromRow)]
        struct ActiveStreamRow {
            id: Uuid,
            source_type: String,
            source_url: String,
            low_latency_mode: bool,
        }

        let active_rows = match sqlx::query_as::<_, ActiveStreamRow>(
            "SELECT id, source_type, source_url, low_latency_mode FROM components_live_streams WHERE stream_mode = 'SERVER_HOSTED_HLS' AND is_relay_active = true"
        )
        .fetch_all(pool).await {
            Ok(rows) => rows,
            Err(e) => {
                error!("Failed to query active live streams for relay: {}", e);
                return;
            }
        };

        info!("Syncing {} active Live Stream HLS relays...", active_rows.len());
        for row in active_rows {
            self.start_relay(row.id, &row.source_type, &row.source_url, row.low_latency_mode).await;
        }
    }
}
