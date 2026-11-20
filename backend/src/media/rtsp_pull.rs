use std::sync::Arc;
use std::time::Duration;

use futures_util::StreamExt;
use retina::client::{
    Credentials, PlayOptions, Session, SessionOptions, SetupOptions, TcpTransportOptions,
    Transport,
};
use retina::codec::{CodecItem, FrameFormat};
use str0m::format::Codec;
use str0m::media::{Frequency, MediaKind, MediaTime};
use tokio::sync::{mpsc, oneshot};
use tracing::{info, warn};
use url::Url;
use uuid::Uuid;

use super::sfu::SfuCommand;

pub fn spawn_rtsp_pull(
    stream_id: Uuid,
    source_url: String,
    requires_auth: bool,
    username: String,
    password: String,
    cmd_tx: mpsc::UnboundedSender<SfuCommand>,
    mut stop_rx: oneshot::Receiver<()>,
) {
    tokio::spawn(async move {
        let mut backoff_secs = 2u64;
        loop {
            match run_single_rtsp_session(
                stream_id,
                &source_url,
                requires_auth,
                &username,
                &password,
                &cmd_tx,
                &mut stop_rx,
            )
            .await
            {
                SessionExit::Stopped => break,
                SessionExit::Ended(reason) => {
                    let _ = cmd_tx.send(SfuCommand::RtspPublisherStopped { stream_id });
                    warn!(
                        "🔴 [RtspPull] Stream [{}] disconnected ({}); reconnecting in {}s...",
                        stream_id, reason, backoff_secs
                    );
                }
            }

            tokio::select! {
                _ = &mut stop_rx => break,
                _ = tokio::time::sleep(Duration::from_secs(backoff_secs)) => {}
            }
            backoff_secs = (backoff_secs * 2).min(10);
        }

        let _ = cmd_tx.send(SfuCommand::RtspPublisherStopped { stream_id });
    });
}

enum SessionExit {
    Stopped,
    Ended(String),
}

async fn run_single_rtsp_session(
    stream_id: Uuid,
    source_url: &str,
    requires_auth: bool,
    username: &str,
    password: &str,
    cmd_tx: &mpsc::UnboundedSender<SfuCommand>,
    stop_rx: &mut oneshot::Receiver<()>,
) -> SessionExit {
    let mut parsed = match Url::parse(source_url.trim()) {
        Ok(u) => u,
        Err(e) => return SessionExit::Ended(format!("invalid RTSP URL: {}", e)),
    };

    let creds = resolve_credentials(&mut parsed, requires_auth, username, password);
    let options = SessionOptions::default().creds(creds);

    let mut session = tokio::select! {
        _ = &mut *stop_rx => return SessionExit::Stopped,
        res = Session::describe(parsed, options) => match res {
            Ok(s) => s,
            Err(e) => return SessionExit::Ended(format!("DESCRIBE failed: {}", e)),
        }
    };

    let video_idx = session.streams().iter().position(|s| {
        s.media().eq_ignore_ascii_case("video") && s.encoding_name().eq_ignore_ascii_case("h264")
    });
    let Some(video_idx) = video_idx else {
        return SessionExit::Ended("no H.264 video stream found in RTSP SDP".to_string());
    };

    // shortcut: CCTV RTSP AAC audio is skipped in WebRTC SFU relay (H.264 + Opus/PCMU/PCMA pass
    // through zero-transcode); use Direct LAN RTSP mode if CCTV AAC audio must be played.
    let audio_match: Option<(usize, Codec)> = session
        .streams()
        .iter()
        .enumerate()
        .find_map(|(idx, s)| {
            if !s.media().eq_ignore_ascii_case("audio") {
                return None;
            }
            match s.encoding_name().to_ascii_lowercase().as_str() {
                "opus" => Some((idx, Codec::Opus)),
                "pcmu" => Some((idx, Codec::PCMU)),
                "pcma" => Some((idx, Codec::PCMA)),
                _ => None,
            }
        });

    let setup_video = SetupOptions::default()
        .transport(Transport::Tcp(TcpTransportOptions::default()))
        .frame_format(FrameFormat::SIMPLE);
    if let Err(e) = session.setup(video_idx, setup_video).await {
        return SessionExit::Ended(format!("video SETUP failed: {}", e));
    }

    if let Some((audio_idx, _)) = audio_match {
        let setup_audio = SetupOptions::default()
            .transport(Transport::Tcp(TcpTransportOptions::default()))
            .frame_format(FrameFormat::SIMPLE);
        if let Err(e) = session.setup(audio_idx, setup_audio).await {
            warn!("[RtspPull] Optional audio SETUP failed for [{}]: {}", stream_id, e);
        }
    }

    let playing = tokio::select! {
        _ = &mut *stop_rx => return SessionExit::Stopped,
        res = session.play(PlayOptions::default()) => match res {
            Ok(p) => p,
            Err(e) => return SessionExit::Ended(format!("PLAY failed: {}", e)),
        }
    };

    let mut demuxed = match playing.demuxed() {
        Ok(d) => d,
        Err(e) => return SessionExit::Ended(format!("demux init failed: {}", e)),
    };

    info!("🟢 [RtspPull] Connected to RTSP source for stream [{}]", stream_id);
    let _ = cmd_tx.send(SfuCommand::RtspPublisherStarted { stream_id });

    loop {
        tokio::select! {
            _ = &mut *stop_rx => return SessionExit::Stopped,
            item = demuxed.next() => match item {
                Some(Ok(CodecItem::VideoFrame(vf))) => {
                    let is_keyframe = vf.is_random_access_point();
                    let ts = vf.timestamp();
                    let rtp_time = MediaTime::new(
                        ts.elapsed().max(0) as u64,
                        Frequency::from_nonzero(ts.clock_rate()),
                    );
                    let data: Arc<[u8]> = Arc::from(vf.into_data());
                    let _ = cmd_tx.send(SfuCommand::RtspFrame {
                        stream_id,
                        kind: MediaKind::Video,
                        codec: Codec::H264,
                        rtp_time,
                        data,
                        is_keyframe,
                    });
                }
                Some(Ok(CodecItem::AudioFrame(af))) => {
                    if let Some((audio_idx, codec)) = audio_match {
                        if af.stream_id() == audio_idx {
                            let ts = af.timestamp();
                            let rtp_time = MediaTime::new(
                                ts.elapsed().max(0) as u64,
                                Frequency::from_nonzero(ts.clock_rate()),
                            );
                            let data: Arc<[u8]> = Arc::from(af.data());
                            let _ = cmd_tx.send(SfuCommand::RtspFrame {
                                stream_id,
                                kind: MediaKind::Audio,
                                codec,
                                rtp_time,
                                data,
                                is_keyframe: true,
                            });
                        }
                    }
                }
                Some(Ok(_)) => {}
                Some(Err(e)) => return SessionExit::Ended(format!("stream read error: {}", e)),
                None => return SessionExit::Ended("EOF".to_string()),
            }
        }
    }
}

fn resolve_credentials(
    parsed: &mut Url,
    requires_auth: bool,
    username: &str,
    password: &str,
) -> Option<Credentials> {
    if !parsed.username().is_empty() {
        let user = parsed.username().to_string();
        let pass = parsed.password().unwrap_or_default().to_string();
        let _ = parsed.set_username("");
        let _ = parsed.set_password(None);
        return Some(Credentials {
            username: user,
            password: pass,
        });
    }
    if requires_auth && !username.trim().is_empty() {
        return Some(Credentials {
            username: username.trim().to_string(),
            password: password.trim().to_string(),
        });
    }
    None
}
