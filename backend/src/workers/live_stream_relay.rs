use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::{oneshot, Mutex};
use tracing::{error, info};
use uuid::Uuid;
use sqlx::PgPool;
use serde::Deserialize;

#[derive(Clone)]
pub struct LiveStreamRelayManager {
    stop_signals: Arc<Mutex<HashMap<Uuid, oneshot::Sender<()>>>>,
    upload_dir: String,
    streamer_api_url: String,
    streamer_rtmp_url: String,
    streamer_hls_url: String,
    http_client: reqwest::Client,
}

#[derive(Deserialize)]
struct MtxPathListResponse {
    #[serde(default)]
    items: Vec<MtxPathItem>,
}

#[derive(Deserialize)]
struct MtxPathItem {
    name: String,
    #[serde(default)]
    ready: bool,
}

async fn purge_stream_files(stream_dir: &str) {
    if let Ok(mut entries) = tokio::fs::read_dir(stream_dir).await {
        while let Ok(Some(entry)) = entries.next_entry().await {
            let _ = tokio::fs::remove_file(entry.path()).await;
        }
    }
}

impl LiveStreamRelayManager {
    pub fn new(
        upload_dir: String,
        streamer_api_url: String,
        streamer_rtmp_url: String,
        streamer_hls_url: String,
    ) -> Self {
        let http_client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(3))
            .build()
            .unwrap_or_default();

        let mgr = Self {
            stop_signals: Arc::new(Mutex::new(HashMap::new())),
            upload_dir,
            streamer_api_url,
            streamer_rtmp_url,
            streamer_hls_url,
            http_client,
        };

        mgr.spawn_streamer_monitor();
        mgr
    }

    pub fn upload_dir(&self) -> &str {
        &self.upload_dir
    }

    pub fn streamer_hls_url(&self) -> &str {
        &self.streamer_hls_url
    }

    pub fn http_client(&self) -> &reqwest::Client {
        &self.http_client
    }

    /// Background monitor that polls internal Docker MediaMTX API (`STREAMER_API_URL/v3/paths/list`)
    fn spawn_streamer_monitor(&self) {
        let api_url = format!("{}/v3/paths/list", self.streamer_api_url.trim_end_matches('/'));
        let client = self.http_client.clone();

        tokio::spawn(async move {
            let mut active_paths: HashSet<String> = HashSet::new();
            let mut engine_ready_logged = false;

            loop {
                if let Ok(resp) = client.get(&api_url).send().await {
                    if !engine_ready_logged && resp.status().is_success() {
                        engine_ready_logged = true;
                        info!("⚡ [LiveStreamRelay] Connected to internal UDP/WebRTC/RTMP Streamer Engine ({})", api_url);
                    }
                    if let Ok(list) = resp.json::<MtxPathListResponse>().await {
                        let mut current_ready: HashSet<String> = HashSet::new();
                        for item in list.items {
                            if item.ready {
                                current_ready.insert(item.name.clone());
                                if !active_paths.contains(&item.name) {
                                    info!(
                                        "🟢 [LiveStreamRelay] WebRTC UDP Egress READY on streamer path [{}]",
                                        item.name
                                    );
                                }
                            }
                        }

                        for old_path in &active_paths {
                            if !current_ready.contains(old_path) {
                                info!(
                                    "🔴 [LiveStreamRelay] WebRTC UDP Egress STOPPED on streamer path [{}]",
                                    old_path
                                );
                            }
                        }

                        active_paths = current_ready;
                    }
                }
                tokio::time::sleep(tokio::time::Duration::from_millis(800)).await;
            }
        });
    }

    pub async fn start_relay(
        &self,
        stream_id: Uuid,
        source_type: &str,
        source_url: &str,
        _low_latency: bool,
    ) {
        let upper_type = source_type.to_uppercase();

        if upper_type == "RTMP" || upper_type == "SRT" || upper_type == "WEBRTC" || upper_type == "WHIP" {
            info!(
                "⏳ [LiveStreamRelay] Zero-disk UDP/WebRTC & RTMP ingest active on dka-product-sigma-streamer for stream [live/{}]",
                stream_id
            );
            return;
        }

        self.stop_relay(&stream_id).await;

        let (stop_tx, mut stop_rx) = oneshot::channel::<()>();
        {
            let mut signals = self.stop_signals.lock().await;
            signals.insert(stream_id, stop_tx);
        }

        let source_url_s = source_url.to_string();
        let target_rtsp = format!(
            "{}/live/{}",
            self.streamer_rtmp_url.trim_end_matches('/'),
            stream_id
        );

        tokio::spawn(async move {
            info!(
                "Relay WebRTC-transcoder supervisor started for stream [{}] ({}) -> {}",
                stream_id, upper_type, target_rtsp
            );

            loop {
                let mut cmd = Command::new("ffmpeg");
                cmd.args([
                    "-y",
                    "-fflags", "+nobuffer+discardcorrupt+flush_packets",
                    "-flags", "low_delay",
                ]);

                if upper_type == "RTMP" {
                    cmd.args([
                        "-listen", "1",
                        "-i", &format!("rtmp://0.0.0.0:1935/live/{}", stream_id),
                    ]);
                } else if upper_type == "RTSP" {
                    cmd.args([
                        "-rtsp_transport", "tcp",
                        "-i", &source_url_s,
                    ]);
                } else {
                    cmd.args(["-i", &source_url_s]);
                }

                // WebRTC-compliant Baseline H.264 (0 B-frames: -bf 0) + Opus audio over RTSP into MediaMTX
                cmd.args([
                    "-c:v", "libx264",
                    "-preset", "ultrafast",
                    "-tune", "zerolatency",
                    "-profile:v", "baseline",
                    "-bf", "0",
                    "-vf", "scale='min(1280,iw)':-2,format=yuv420p",
                    "-b:v", "1800k",
                    "-maxrate", "2200k",
                    "-bufsize", "1100k",
                    "-g", "30",
                    "-keyint_min", "30",
                    "-sc_threshold", "0",
                    "-c:a", "libopus",
                    "-b:a", "96k",
                    "-ar", "48000",
                    "-ac", "2",
                    "-f", "rtsp",
                    "-rtsp_transport", "tcp",
                    &target_rtsp,
                ]);

                cmd.stdout(std::process::Stdio::null());
                cmd.stderr(std::process::Stdio::piped());
                cmd.kill_on_drop(true);

                let mut child = match cmd.spawn() {
                    Ok(c) => c,
                    Err(e) => {
                        error!("Failed to spawn FFmpeg WebRTC relay for stream [{}]: {}", stream_id, e);
                        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                        continue;
                    }
                };

                info!(
                    "⏳ [LiveStreamRelay] Relay active for stream [{}] (source: {})",
                    stream_id, upper_type
                );

                if let Some(stderr) = child.stderr.take() {
                    let stream_id_clone = stream_id;
                    tokio::spawn(async move {
                        let mut reader = BufReader::new(stderr).lines();
                        let mut start_logged = false;
                        while let Ok(Some(line)) = reader.next_line().await {
                            if !start_logged
                                && (line.contains("Input #0")
                                    || line.contains("Stream #0:0")
                                    || line.contains("Output #0"))
                            {
                                start_logged = true;
                                info!(
                                    "🟢 [LiveStreamRelay] START STREAMING detected for stream [{}] (normalizing to 0-B-frame H264 + Opus for WebRTC UDP)",
                                    stream_id_clone
                                );
                            }
                        }
                    });
                }

                tokio::select! {
                    _ = &mut stop_rx => {
                        let _ = child.kill().await;
                        break;
                    }
                    status = child.wait() => {
                        match status {
                            Ok(s) => info!("🔴 [LiveStreamRelay] STOP STREAMING detected for stream [{}] (status: {:?}). Re-opening listener...", stream_id, s),
                            Err(e) => error!("🔴 [LiveStreamRelay] STOP STREAMING error for stream [{}]: {}. Re-opening listener...", stream_id, e),
                        }
                        tokio::time::sleep(tokio::time::Duration::from_millis(3000)).await;
                    }
                }
            }
        });
    }

    pub async fn kick_streamer_publishers(&self, stream_id: &Uuid) {
        let base_api = self.streamer_api_url.trim_end_matches('/');
        let target_path = format!("live/{}", stream_id);

        #[derive(Deserialize)]
        struct MediaMtxItem {
            id: String,
            path: String,
            #[serde(default)]
            state: String,
        }
        #[derive(Deserialize)]
        struct MediaMtxList {
            #[serde(default)]
            items: Vec<MediaMtxItem>,
        }

        // 1. Kick active WebRTC publisher sessions (WHIP)
        let webrtc_url = format!("{}/v3/webrtcsessions/list", base_api);
        if let Ok(resp) = self.http_client.get(&webrtc_url).send().await {
            if let Ok(list) = resp.json::<MediaMtxList>().await {
                for item in list.items {
                    if (item.path == target_path || item.path.ends_with(&format!("/{}", stream_id))) && item.state == "publish" {
                        let kick_url = format!("{}/v3/webrtcsessions/kick/{}", base_api, item.id);
                        let _ = self.http_client.post(&kick_url).send().await;
                        info!("⚡ [LiveStreamRelay] Kicked WebRTC publisher session [{}] on path [{}]", item.id, item.path);
                    }
                }
            }
        }

        // 2. Kick active RTMP publisher connections
        let rtmp_url = format!("{}/v3/rtmpconns/list", base_api);
        if let Ok(resp) = self.http_client.get(&rtmp_url).send().await {
            if let Ok(list) = resp.json::<MediaMtxList>().await {
                for item in list.items {
                    if (item.path == target_path || item.path.ends_with(&format!("/{}", stream_id))) && item.state == "publish" {
                        let kick_url = format!("{}/v3/rtmpconns/kick/{}", base_api, item.id);
                        let _ = self.http_client.post(&kick_url).send().await;
                        info!("⚡ [LiveStreamRelay] Kicked RTMP publisher connection [{}] on path [{}]", item.id, item.path);
                    }
                }
            }
        }

        // 3. Kick active RTSP publisher sessions
        let rtsp_url = format!("{}/v3/rtspsessions/list", base_api);
        if let Ok(resp) = self.http_client.get(&rtsp_url).send().await {
            if let Ok(list) = resp.json::<MediaMtxList>().await {
                for item in list.items {
                    if item.path == target_path && item.state == "publish" {
                        let kick_url = format!("{}/v3/rtspsessions/kick/{}", base_api, item.id);
                        let _ = self.http_client.post(&kick_url).send().await;
                        info!("⚡ [LiveStreamRelay] Kicked RTSP publisher session [{}] on path [{}]", item.id, item.path);
                    }
                }
            }
        }
    }

    pub async fn stop_relay(&self, stream_id: &Uuid) {
        let mut signals = self.stop_signals.lock().await;
        if let Some(stop_tx) = signals.remove(stream_id) {
            info!("Stopping relay supervisor for stream [{}]", stream_id);
            let _ = stop_tx.send(());
        }
        self.kick_streamer_publishers(stream_id).await;
        let stream_dir = format!("{}/streams/{}", self.upload_dir, stream_id);
        purge_stream_files(&stream_dir).await;
    }

    pub async fn stop_all(&self) {
        let mut signals = self.stop_signals.lock().await;
        for (stream_id, stop_tx) in signals.drain() {
            info!("Shutting down relay supervisor for stream [{}]", stream_id);
            let _ = stop_tx.send(());
        }
        let _ = Command::new("pkill").args(["-9", "ffmpeg"]).status().await;
    }

    pub async fn sync_active_relays(&self, pool: &PgPool) {
        let _ = Command::new("pkill").args(["-9", "ffmpeg"]).status().await;

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

        info!("Syncing {} active Live Stream relays with internal streamer engine...", active_rows.len());
        for row in active_rows {
            self.start_relay(row.id, &row.source_type, &row.source_url, row.low_latency_mode).await;
        }
    }
}
