use std::collections::HashMap;
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::{oneshot, Mutex};
use tracing::{error, info};
use uuid::Uuid;
use sqlx::PgPool;

#[derive(Clone)]
pub struct LiveStreamRelayManager {
    stop_signals: Arc<Mutex<HashMap<Uuid, oneshot::Sender<()>>>>,
    upload_dir: String,
}

impl LiveStreamRelayManager {
    pub fn new(upload_dir: String) -> Self {
        Self {
            stop_signals: Arc::new(Mutex::new(HashMap::new())),
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
        // Stop existing supervisor process if any
        self.stop_relay(&stream_id).await;

        let out_dir = format!("{}/streams/{}", self.upload_dir, stream_id);
        if let Err(e) = tokio::fs::create_dir_all(&out_dir).await {
            error!("Failed to create stream output directory {}: {}", out_dir, e);
            return;
        }

        let (stop_tx, mut stop_rx) = oneshot::channel::<()>();
        {
            let mut signals = self.stop_signals.lock().await;
            signals.insert(stream_id, stop_tx);
        }

        let upload_dir = self.upload_dir.clone();
        let source_type_s = source_type.to_string();
        let source_url_s = source_url.to_string();

        tokio::spawn(async move {
            info!("Relay supervisor started for stream [{}] ({})", stream_id, source_type_s);
            loop {
                let m3u8_path = format!("{}/streams/{}/live.m3u8", upload_dir, stream_id);
                let segment_path = format!("{}/streams/{}/live%d.ts", upload_dir, stream_id);
                let hls_time = if low_latency { "1" } else { "2" };
                let hls_list_size = if low_latency { "3" } else { "5" };

                let mut cmd = Command::new("ffmpeg");
                cmd.arg("-y");

                match source_type_s.to_uppercase().as_str() {
                    "RTMP" => {
                        cmd.args([
                            "-fflags", "nobuffer",
                            "-flags", "low_delay",
                            "-listen", "1",
                            "-i", &format!("rtmp://0.0.0.0:1935/live/{}", stream_id),
                            "-c:v", "copy",
                            "-c:a", "copy",
                            "-f", "hls",
                            "-hls_time", hls_time,
                            "-hls_list_size", hls_list_size,
                            "-hls_flags", "delete_segments+omit_endlist",
                            "-hls_segment_filename", &segment_path,
                            &m3u8_path,
                        ]);
                    }
                    "RTSP" => {
                        cmd.args([
                            "-rtsp_transport", "tcp",
                            "-i", &source_url_s,
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
                        cmd.args([
                            "-i", &source_url_s,
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
                cmd.stderr(std::process::Stdio::piped());

                let mut child = match cmd.spawn() {
                    Ok(c) => c,
                    Err(e) => {
                        error!("Failed to spawn FFmpeg for stream [{}]: {}", stream_id, e);
                        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
                        continue;
                    }
                };

                info!("⏳ [LiveStreamRelay] Ingest listener READY on RTMP port 1935 for stream [{}]", stream_id);

                if let Some(stderr) = child.stderr.take() {
                    let stream_id_clone = stream_id;
                    tokio::spawn(async move {
                        let mut reader = BufReader::new(stderr).lines();
                        let mut start_logged = false;
                        while let Ok(Some(line)) = reader.next_line().await {
                            if !start_logged && (line.contains("Opening '") || line.contains("Stream #0:0") || line.contains("Publishing") || line.contains("rtmp://")) {
                                start_logged = true;
                                info!("🟢 [LiveStreamRelay] START STREAMING detected for stream [{}] (feed incoming)", stream_id_clone);
                            }
                        }
                    });
                }

                tokio::select! {
                    _ = &mut stop_rx => {
                        info!("Relay supervisor received stop signal for stream [{}]", stream_id);
                        let _ = child.kill().await;
                        break;
                    }
                    status = child.wait() => {
                        match status {
                            Ok(s) => info!("🔴 [LiveStreamRelay] STOP STREAMING detected for stream [{}] (status: {:?}). Re-opening listener...", stream_id, s),
                            Err(e) => error!("🔴 [LiveStreamRelay] STOP STREAMING error for stream [{}]: {}. Re-opening listener...", stream_id, e),
                        }
                        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                    }
                }
            }
        });
    }

    pub async fn stop_relay(&self, stream_id: &Uuid) {
        let mut signals = self.stop_signals.lock().await;
        if let Some(stop_tx) = signals.remove(stream_id) {
            info!("Stopping FFmpeg HLS relay supervisor for stream [{}]", stream_id);
            let _ = stop_tx.send(());
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
