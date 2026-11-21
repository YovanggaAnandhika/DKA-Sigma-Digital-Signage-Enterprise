use std::collections::{HashMap, HashSet};
use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use std::sync::Arc;
use std::time::{Duration, Instant};

use serde::Serialize;
use str0m::change::SdpOffer;
use str0m::format::{Codec, PayloadParams};
use str0m::media::{Frequency, KeyframeRequestKind, MediaKind, MediaTime, Mid};
use str0m::net::{Protocol, Receive};
use str0m::{Candidate, Event, IceConnectionState, Input, Output, Rtc};
use tokio::net::UdpSocket;
use tokio::sync::{mpsc, oneshot};
use tracing::{debug, info, warn};
use uuid::Uuid;

#[derive(Clone, Debug, Default, Serialize)]
pub struct StreamLiveStatus {
    pub live: bool,
    pub subscribers: usize,
}

pub enum SfuCommand {
    RegisterWhip {
        stream_id: Uuid,
        sdp_offer: String,
        reply: oneshot::Sender<Result<(String, Uuid), String>>,
    },
    RegisterWhep {
        stream_id: Uuid,
        sdp_offer: String,
        reply: oneshot::Sender<Result<(String, Uuid), String>>,
    },
    CloseSession {
        session_id: Uuid,
    },
    KickStream {
        stream_id: Uuid,
    },
    RtspPublisherStarted {
        stream_id: Uuid,
    },
    RtspPublisherStopped {
        stream_id: Uuid,
    },
    RtspFrame {
        stream_id: Uuid,
        kind: MediaKind,
        codec: Codec,
        rtp_time: MediaTime,
        data: Arc<[u8]>,
    },
    QueryStatus {
        stream_id: Uuid,
        reply: oneshot::Sender<StreamLiveStatus>,
    },
    Shutdown,
}

struct WhipPublisher {
    session_id: Uuid,
    rtc: Rtc,
    timeout: Instant,
    video_mid: Option<Mid>,
    audio_mid: Option<Mid>,
    last_keyframe_req: Option<Instant>,
    ice_connected: bool,
    logged_video_codec: bool,
    max_video_time: Option<MediaTime>,
    logged_bframe_drop: bool,
    video_trace_count: u8,
    created_at: Instant,
}

struct WhepSubscriber {
    session_id: Uuid,
    stream_id: Uuid,
    rtc: Rtc,
    timeout: Instant,
    video_mid: Option<Mid>,
    audio_mid: Option<Mid>,
    ice_connected: bool,
    warned_codec_mismatch: bool,
    created_at: Instant,
}

pub async fn spawn_sfu(
    media_udp_port: u16,
    media_public_ip: String,
) -> Result<mpsc::UnboundedSender<SfuCommand>, std::io::Error> {
    let advertised_addr = resolve_advertised_addr(&media_public_ip, media_udp_port).await;
    let socket = UdpSocket::bind(("0.0.0.0", media_udp_port)).await?;
    let (cmd_tx, cmd_rx) = mpsc::unbounded_channel();

    info!(
        "⚡ [MediaSFU] Pure-Rust WebRTC UDP SFU listening on 0.0.0.0:{} (ICE candidate: {})",
        media_udp_port, advertised_addr
    );

    tokio::spawn(async move {
        run_sfu_loop(socket, advertised_addr, cmd_rx).await;
    });

    Ok(cmd_tx)
}

async fn resolve_advertised_addr(host: &str, port: u16) -> SocketAddr {
    let trimmed = host.trim();
    if let Ok(ip) = trimmed.parse::<IpAddr>() {
        return SocketAddr::new(ip, port);
    }
    if !trimmed.is_empty() {
        if let Ok(addrs) = tokio::net::lookup_host((trimmed, port)).await {
            let mut fallback = None;
            for addr in addrs {
                if addr.is_ipv4() {
                    return addr;
                }
                if fallback.is_none() {
                    fallback = Some(addr);
                }
            }
            if let Some(addr) = fallback {
                return addr;
            }
        }
    }
    warn!(
        "⚠️ [MediaSFU] Could not resolve MEDIA_PUBLIC_IP='{}'; falling back to 127.0.0.1:{}",
        host, port
    );
    SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), port)
}

fn build_rtc(advertised_addr: SocketAddr, now: Instant) -> Result<Rtc, String> {
    let mut rtc = Rtc::builder()
        .set_ice_lite(true)
        .set_reordering_size_video(4)
        .set_reordering_size_audio(4)
        .set_reordering_timeout_audio(Some(Duration::from_millis(80)))
        .clear_codecs()
        .enable_h264(true)
        .enable_h265(true)
        .enable_opus(true, false)
        .enable_pcmu(true, false)
        .enable_pcma(true, false)
        .build(now);

    let loopback_addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), advertised_addr.port());
    let candidate_loopback = Candidate::host(loopback_addr, "udp").map_err(|e| e.to_string())?;
    rtc.add_local_candidate(candidate_loopback);

    if advertised_addr.ip() != IpAddr::V4(Ipv4Addr::LOCALHOST) {
        if let Ok(c_advertised) = Candidate::host(advertised_addr, "udp") {
            rtc.add_local_candidate(c_advertised);
        }
    }

    Ok(rtc)
}

struct OutboundMedia {
    stream_id: Uuid,
    kind: MediaKind,
    codec: Codec,
    params: Option<PayloadParams>,
    time: MediaTime,
    network_time: Instant,
    data: Arc<[u8]>,
}

async fn run_sfu_loop(
    socket: UdpSocket,
    advertised_addr: SocketAddr,
    mut cmd_rx: mpsc::UnboundedReceiver<SfuCommand>,
) {
    let mut publishers: HashMap<Uuid, WhipPublisher> = HashMap::new();
    let mut rtsp_streams: HashSet<Uuid> = HashSet::new();
    let mut subscribers: Vec<WhepSubscriber> = Vec::new();
    let mut buf = vec![0u8; 4096];

    loop {
        let now = Instant::now();
        let next_deadline = compute_next_deadline(&publishers, &subscribers, now);
        if next_deadline <= now {
            handle_timeouts(now, &socket, &mut publishers, &mut subscribers).await;
            prune_dead_sessions(&mut publishers, &mut subscribers);
            continue;
        }

        tokio::select! {
            recv = socket.recv_from(&mut buf) => {
                match recv {
                    Ok((n, source)) => {
                        let recv_now = Instant::now();
                        handle_raw_udp_packet(
                            recv_now,
                            source,
                            &buf[..n],
                            advertised_addr,
                            &socket,
                            &mut publishers,
                            &mut subscribers,
                        ).await;
                    }
                    Err(err) => {
                        warn!("UDP recv error on MediaSFU socket: {}", err);
                    }
                }
            }
            cmd = cmd_rx.recv() => {
                match cmd {
                    Some(SfuCommand::Shutdown) | None => {
                        info!("Shutting down Pure-Rust MediaSFU...");
                        break;
                    }
                    Some(cmd) => {
                        handle_command(
                            cmd,
                            advertised_addr,
                            &socket,
                            &mut publishers,
                            &mut rtsp_streams,
                            &mut subscribers,
                        ).await;
                    }
                }
            }
            _ = tokio::time::sleep_until(tokio::time::Instant::from_std(next_deadline)) => {
                let tick_now = Instant::now();
                handle_timeouts(tick_now, &socket, &mut publishers, &mut subscribers).await;
            }
        }

        prune_dead_sessions(&mut publishers, &mut subscribers);
    }
}

fn compute_next_deadline(
    publishers: &HashMap<Uuid, WhipPublisher>,
    subscribers: &[WhepSubscriber],
    now: Instant,
) -> Instant {
    let mut next = now + Duration::from_millis(250);
    for p in publishers.values() {
        if p.timeout < next {
            next = p.timeout;
        }
    }
    for s in subscribers {
        if s.timeout < next {
            next = s.timeout;
        }
    }
    if next < now {
        now
    } else {
        next
    }
}

async fn handle_raw_udp_packet<'a>(
    recv_now: Instant,
    source: SocketAddr,
    buf: &'a [u8],
    advertised_addr: SocketAddr,
    socket: &UdpSocket,
    publishers: &mut HashMap<Uuid, WhipPublisher>,
    subscribers: &mut Vec<WhepSubscriber>,
) {
    let loopback_addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), advertised_addr.port());
    let internal_container_addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::new(172, 23, 0, 2)), advertised_addr.port());
    let candidate_addrs = [loopback_addr, advertised_addr, internal_container_addr];

    for dest in candidate_addrs {
        let Ok(contents) = buf.try_into() else {
            return;
        };
        let input = Input::Receive(
            recv_now,
            Receive {
                proto: Protocol::Udp,
                source,
                destination: dest,
                contents,
            },
        );

        let matched_stream_id = publishers
            .iter()
            .find(|(_, pub_entry)| pub_entry.rtc.accepts(&input))
            .map(|(stream_id, _)| *stream_id);

        if let Some(stream_id) = matched_stream_id {
            let mut outbound = Vec::new();
            let mut disconnect_subs = false;
            if let Some(pub_entry) = publishers.get_mut(&stream_id) {
                if let Err(e) = pub_entry.rtc.handle_input(input) {
                    warn!("WHIP publisher [{}] input error: {:?}", stream_id, e);
                    pub_entry.rtc.disconnect();
                }
                disconnect_subs = drain_publisher(stream_id, pub_entry, socket, &mut outbound).await;
            }
            if !outbound.is_empty() {
                fan_out_media(&outbound, subscribers, socket).await;
            }
            if disconnect_subs {
                disconnect_stream_subscribers(stream_id, subscribers);
            }
            return;
        }

        let matched_idx = subscribers
            .iter()
            .position(|sub| sub.rtc.accepts(&input));

        if let Some(idx) = matched_idx {
            let sub = &mut subscribers[idx];
            if let Err(e) = sub.rtc.handle_input(input) {
                debug!("WHEP subscriber [{}] input error: {:?}", sub.session_id, e);
                sub.rtc.disconnect();
            }
            let mut keyframe_reqs = Vec::new();
            let stream_id = sub.stream_id;
            let became_connected = drain_subscriber(sub, socket, &mut keyframe_reqs).await;
            if became_connected {
                request_publisher_keyframe(stream_id, publishers, socket, KeyframeRequestKind::Pli, true).await;
            }
            for kind in keyframe_reqs {
                request_publisher_keyframe(stream_id, publishers, socket, kind, false).await;
            }
            return;
        }
    }
}

async fn handle_command(
    cmd: SfuCommand,
    advertised_addr: SocketAddr,
    socket: &UdpSocket,
    publishers: &mut HashMap<Uuid, WhipPublisher>,
    rtsp_streams: &mut HashSet<Uuid>,
    subscribers: &mut Vec<WhepSubscriber>,
) {
    match cmd {
        SfuCommand::RegisterWhip {
            stream_id,
            sdp_offer,
            reply,
        } => {
            if let Some(mut old) = publishers.remove(&stream_id) {
                old.rtc.disconnect();
                disconnect_stream_subscribers(stream_id, subscribers);
                info!("🔄 [MediaSFU] Replaced existing WHIP publisher for stream [{}]", stream_id);
            }

            let now = Instant::now();
            let result = (|| -> Result<(String, Uuid, WhipPublisher), String> {
                let offer = SdpOffer::from_sdp_string(&sdp_offer).map_err(|e| e.to_string())?;
                let mut rtc = build_rtc(advertised_addr, now)?;
                let answer = rtc.sdp_api().accept_offer(offer).map_err(|e| e.to_string())?;
                let session_id = Uuid::new_v4();
                let pub_entry = WhipPublisher {
                    session_id,
                    rtc,
                    timeout: now,
                    video_mid: None,
                    audio_mid: None,
                    last_keyframe_req: None,
                    ice_connected: false,
                    logged_video_codec: false,
                    max_video_time: None,
                    logged_bframe_drop: false,
                    video_trace_count: 0,
                    created_at: now,
                };
                Ok((answer.to_sdp_string(), session_id, pub_entry))
            })();

            match result {
                Ok((answer_sdp, session_id, mut pub_entry)) => {
                    let mut outbound = Vec::new();
                    let _ = drain_publisher(stream_id, &mut pub_entry, socket, &mut outbound).await;
                    publishers.insert(stream_id, pub_entry);
                    info!("🟢 [MediaSFU] WHIP publisher registered for stream [{}] (session {})", stream_id, session_id);
                    let _ = reply.send(Ok((answer_sdp, session_id)));
                }
                Err(err) => {
                    let _ = reply.send(Err(err));
                }
            }
        }
        SfuCommand::RegisterWhep {
            stream_id,
            sdp_offer,
            reply,
        } => {
            let is_live = publishers
                .get(&stream_id)
                .is_some_and(|p| p.rtc.is_alive())
                || rtsp_streams.contains(&stream_id);
            if !is_live {
                let _ = reply.send(Err("OFFLINE".to_string()));
                return;
            }

            let now = Instant::now();
            let result = (|| -> Result<(String, Uuid, WhepSubscriber), String> {
                let offer = SdpOffer::from_sdp_string(&sdp_offer).map_err(|e| e.to_string())?;
                let mut rtc = build_rtc(advertised_addr, now)?;
                let answer = rtc.sdp_api().accept_offer(offer).map_err(|e| e.to_string())?;
                let session_id = Uuid::new_v4();
                let sub = WhepSubscriber {
                    session_id,
                    stream_id,
                    rtc,
                    timeout: now,
                    video_mid: None,
                    audio_mid: None,
                    ice_connected: false,
                    warned_codec_mismatch: false,
                    created_at: now,
                };
                Ok((answer.to_sdp_string(), session_id, sub))
            })();

            match result {
                Ok((answer_sdp, session_id, mut sub)) => {
                    let mut keyframe_reqs = Vec::new();
                    let _ = drain_subscriber(&mut sub, socket, &mut keyframe_reqs).await;
                    subscribers.push(sub);
                    debug!("📺 [MediaSFU] WHEP subscriber [{}] joined stream [{}]", session_id, stream_id);
                    let _ = reply.send(Ok((answer_sdp, session_id)));
                }
                Err(err) => {
                    let _ = reply.send(Err(err));
                }
            }
        }
        SfuCommand::CloseSession { session_id } => {
            let mut closed_stream = None;
            for (stream_id, pub_entry) in publishers.iter_mut() {
                if pub_entry.session_id == session_id {
                    pub_entry.rtc.disconnect();
                    closed_stream = Some(*stream_id);
                    break;
                }
            }
            if let Some(stream_id) = closed_stream {
                publishers.remove(&stream_id);
                disconnect_stream_subscribers(stream_id, subscribers);
                info!("🔴 [MediaSFU] WHIP session [{}] closed for stream [{}]", session_id, stream_id);
                return;
            }
            for sub in subscribers.iter_mut() {
                if sub.session_id == session_id {
                    sub.rtc.disconnect();
                    debug!("👋 [MediaSFU] WHEP subscriber [{}] disconnected", session_id);
                    break;
                }
            }
        }
        SfuCommand::KickStream { stream_id } => {
            if let Some(mut pub_entry) = publishers.remove(&stream_id) {
                pub_entry.rtc.disconnect();
            }
            rtsp_streams.remove(&stream_id);
            disconnect_stream_subscribers(stream_id, subscribers);
            info!("⚡ [MediaSFU] Kicked all media sessions on stream [{}]", stream_id);
        }
        SfuCommand::RtspPublisherStarted { stream_id } => {
            rtsp_streams.insert(stream_id);
            info!("🟢 [MediaSFU] RTSP pull ingest READY for stream [{}]", stream_id);
        }
        SfuCommand::RtspPublisherStopped { stream_id } => {
            if rtsp_streams.remove(&stream_id) {
                disconnect_stream_subscribers(stream_id, subscribers);
                info!("🔴 [MediaSFU] RTSP pull ingest STOPPED for stream [{}]", stream_id);
            }
        }
        SfuCommand::RtspFrame {
            stream_id,
            kind,
            codec,
            rtp_time,
            data,
        } => {
            if !rtsp_streams.contains(&stream_id) {
                return;
            }
            let frame = OutboundMedia {
                stream_id,
                kind,
                codec,
                params: None,
                time: rtp_time,
                network_time: Instant::now(),
                data,
            };
            fan_out_media(&[frame], subscribers, socket).await;
        }
        SfuCommand::QueryStatus { stream_id, reply } => {
            let live = publishers
                .get(&stream_id)
                .is_some_and(|p| p.rtc.is_alive())
                || rtsp_streams.contains(&stream_id);
            let sub_count = subscribers
                .iter()
                .filter(|s| s.stream_id == stream_id && s.rtc.is_alive())
                .count();
            let _ = reply.send(StreamLiveStatus {
                live,
                subscribers: sub_count,
            });
        }
        SfuCommand::Shutdown => {}
    }
}

async fn handle_timeouts(
    now: Instant,
    socket: &UdpSocket,
    publishers: &mut HashMap<Uuid, WhipPublisher>,
    subscribers: &mut Vec<WhepSubscriber>,
) {
    let pub_keys: Vec<Uuid> = publishers
        .iter()
        .filter(|(_, p)| p.timeout <= now)
        .map(|(k, _)| *k)
        .collect();

    let mut outbound = Vec::new();
    let mut disconnected_streams = Vec::new();

    for stream_id in pub_keys {
        if let Some(pub_entry) = publishers.get_mut(&stream_id) {
            if let Err(e) = pub_entry.rtc.handle_input(Input::Timeout(now)) {
                warn!("WHIP publisher [{}] timeout error: {:?}", stream_id, e);
                pub_entry.rtc.disconnect();
            }
            if drain_publisher(stream_id, pub_entry, socket, &mut outbound).await {
                disconnected_streams.push(stream_id);
            }
        }
    }

    if !outbound.is_empty() {
        fan_out_media(&outbound, subscribers, socket).await;
    }

    for stream_id in disconnected_streams {
        disconnect_stream_subscribers(stream_id, subscribers);
    }

    let mut keyframe_streams: Vec<(Uuid, KeyframeRequestKind, bool)> = Vec::new();
    for sub in subscribers.iter_mut() {
        if sub.timeout <= now && sub.rtc.is_alive() {
            if let Err(e) = sub.rtc.handle_input(Input::Timeout(now)) {
                debug!("WHEP subscriber [{}] timeout error: {:?}", sub.session_id, e);
                sub.rtc.disconnect();
            }
            let mut kfs = Vec::new();
            let connected = drain_subscriber(sub, socket, &mut kfs).await;
            if connected {
                keyframe_streams.push((sub.stream_id, KeyframeRequestKind::Pli, true));
            }
            for kind in kfs {
                keyframe_streams.push((sub.stream_id, kind, false));
            }
        }
    }

    for (stream_id, kind, force) in keyframe_streams {
        request_publisher_keyframe(stream_id, publishers, socket, kind, force).await;
    }
}

async fn drain_publisher(
    stream_id: Uuid,
    pub_entry: &mut WhipPublisher,
    socket: &UdpSocket,
    outbound: &mut Vec<OutboundMedia>,
) -> bool {
    let mut disconnected = false;
    let mut timeout_steps = 0u8;
    while pub_entry.rtc.is_alive() {
        match pub_entry.rtc.poll_output() {
            Ok(Output::Timeout(t)) => {
                let now = Instant::now();
                if t <= now && timeout_steps < 32 {
                    timeout_steps += 1;
                    if let Err(e) = pub_entry.rtc.handle_input(Input::Timeout(now)) {
                        warn!("WHIP publisher [{}] timeout flush error: {:?}", stream_id, e);
                        pub_entry.rtc.disconnect();
                        disconnected = true;
                        break;
                    }
                    continue;
                }
                pub_entry.timeout = t;
                break;
            }
            Ok(Output::Transmit(tx)) => {
                let _ = socket.send_to(&tx.contents, tx.destination).await;
            }
            Ok(Output::Event(ev)) => match ev {
                Event::IceConnectionStateChange(state) => {
                    info!("⚡ [MediaSFU] WHIP publisher [{}] ICE state: {:?}", stream_id, state);
                    if matches!(state, IceConnectionState::Connected | IceConnectionState::Completed) {
                        pub_entry.ice_connected = true;
                    } else if state == IceConnectionState::Disconnected {
                        pub_entry.rtc.disconnect();
                        disconnected = true;
                        break;
                    }
                }
                Event::MediaAdded(added) => {
                    info!("⚡ [MediaSFU] WHIP publisher [{}] media added: {:?} {:?}", stream_id, added.kind, added.direction);
                    if added.direction.is_receiving() {
                        match added.kind {
                            MediaKind::Video => pub_entry.video_mid = Some(added.mid),
                            MediaKind::Audio => pub_entry.audio_mid = Some(added.mid),
                        }
                    }
                }
                Event::MediaData(data) => {
                    let codec = data.params.spec().codec;
                    let kind = if codec.is_audio() {
                        MediaKind::Audio
                    } else {
                        MediaKind::Video
                    };
                    if kind == MediaKind::Video {
                        let is_kf = data.is_keyframe();
                        if !pub_entry.logged_video_codec {
                            pub_entry.logged_video_codec = true;
                            info!(
                                "🎥 [MediaSFU] WHIP publisher [{}] receiving video codec {:?} (PT {})",
                                stream_id,
                                codec,
                                data.params.pt()
                            );
                        }
                        if pub_entry.video_trace_count < 12 {
                            pub_entry.video_trace_count += 1;
                            info!(
                                "🎞️ [MediaSFU] Video frame #{} stream [{}]: rtp_time={} kf={} contig={} bytes={}",
                                pub_entry.video_trace_count,
                                stream_id,
                                data.time.numer(),
                                is_kf,
                                data.contiguous,
                                data.data.len()
                            );
                        }
                        if is_kf {
                            pub_entry.max_video_time = Some(data.time);
                        } else if let Some(max_t) = pub_entry.max_video_time {
                            if data.time < max_t {
                                let back_ticks = max_t.numer().saturating_sub(data.time.numer());
                                // Drop backward-PTS B-frames (< 5s at 90kHz) so browser WebRTC never plays out of display order;
                                // reset baseline if encoder clock jumped backward by >= 5s.
                                if back_ticks < 450_000 {
                                    if !pub_entry.logged_bframe_drop {
                                        pub_entry.logged_bframe_drop = true;
                                        warn!(
                                            "⚠️ [MediaSFU] Dropping out-of-order B-frame from OBS [{}] (rtp_time {} < {}); disable B-frames (Max B-frames: 0) in OBS for full FPS",
                                            stream_id,
                                            data.time.numer(),
                                            max_t.numer()
                                        );
                                    }
                                    continue;
                                }
                            }
                            pub_entry.max_video_time = Some(data.time);
                        } else {
                            pub_entry.max_video_time = Some(data.time);
                        }
                    }

                    if !data.contiguous && kind == MediaKind::Video {
                        let should_req = pub_entry
                            .last_keyframe_req
                            .map(|t| t.elapsed() >= Duration::from_secs(1))
                            .unwrap_or(true);
                        if should_req {
                            if let Some(mut writer) = pub_entry.rtc.writer(data.mid) {
                                let _ = writer.request_keyframe(data.rid, KeyframeRequestKind::Pli);
                                pub_entry.last_keyframe_req = Some(Instant::now());
                            }
                        }
                    }

                    outbound.push(OutboundMedia {
                        stream_id,
                        kind,
                        codec,
                        params: Some(data.params),
                        time: data.time,
                        network_time: data.network_time,
                        data: data.data,
                    });
                }
                _ => {}
            },
            Err(e) => {
                warn!("WHIP publisher [{}] poll_output error: {:?}", stream_id, e);
                pub_entry.rtc.disconnect();
                disconnected = true;
                break;
            }
        }
    }
    disconnected || !pub_entry.rtc.is_alive()
}

async fn drain_subscriber(
    sub: &mut WhepSubscriber,
    socket: &UdpSocket,
    keyframe_reqs: &mut Vec<KeyframeRequestKind>,
) -> bool {
    let mut became_connected = false;
    let mut timeout_steps = 0u8;
    while sub.rtc.is_alive() {
        match sub.rtc.poll_output() {
            Ok(Output::Timeout(t)) => {
                let now = Instant::now();
                if t <= now && timeout_steps < 64 {
                    timeout_steps += 1;
                    if let Err(e) = sub.rtc.handle_input(Input::Timeout(now)) {
                        debug!("WHEP subscriber [{}] timeout flush error: {:?}", sub.session_id, e);
                        sub.rtc.disconnect();
                        break;
                    }
                    continue;
                }
                sub.timeout = t;
                break;
            }
            Ok(Output::Transmit(tx)) => {
                let _ = socket.send_to(&tx.contents, tx.destination).await;
            }
            Ok(Output::Event(ev)) => match ev {
                Event::Connected => {
                    info!("⚡ [MediaSFU] WHEP subscriber [{}] Connected!", sub.session_id);
                    if !sub.ice_connected {
                        sub.ice_connected = true;
                        became_connected = true;
                    }
                }
                Event::IceConnectionStateChange(state) => {
                    info!("⚡ [MediaSFU] WHEP subscriber [{}] ICE state: {:?}", sub.session_id, state);
                    if matches!(state, IceConnectionState::Connected | IceConnectionState::Completed) {
                        if !sub.ice_connected {
                            sub.ice_connected = true;
                            became_connected = true;
                        }
                    } else if state == IceConnectionState::Disconnected {
                        sub.rtc.disconnect();
                        break;
                    }
                }
                Event::MediaAdded(added) => {
                    info!("⚡ [MediaSFU] WHEP subscriber [{}] media added: {:?} {:?}", sub.session_id, added.kind, added.direction);
                    if added.direction.is_sending() {
                        match added.kind {
                            MediaKind::Video => sub.video_mid = Some(added.mid),
                            MediaKind::Audio => sub.audio_mid = Some(added.mid),
                        }
                    }
                }
                Event::KeyframeRequest(req) => {
                    keyframe_reqs.push(req.kind);
                }
                _ => {}
            },
            Err(e) => {
                debug!("WHEP subscriber [{}] poll_output error: {:?}", sub.session_id, e);
                sub.rtc.disconnect();
                break;
            }
        }
    }
    became_connected
}

async fn fan_out_media(
    frames: &[OutboundMedia],
    subscribers: &mut [WhepSubscriber],
    socket: &UdpSocket,
) {
    for sub in subscribers.iter_mut() {
        if !sub.rtc.is_alive() || !sub.ice_connected {
            continue;
        }
        let mut wrote_any = false;
        for frame in frames {
            if sub.stream_id != frame.stream_id {
                continue;
            }
            let target_mid = match frame.kind {
                MediaKind::Video => sub.video_mid,
                MediaKind::Audio => sub.audio_mid,
            };
            let Some(mid) = target_mid else {
                continue;
            };
            let Some(writer) = sub.rtc.writer(mid) else {
                continue;
            };
            let pt = if let Some(in_params) = frame.params {
                writer
                    .match_params(in_params)
                    .filter(|matched| writer.payload_params().any(|p| p.pt() == *matched))
                    .or_else(|| {
                        writer
                            .payload_params()
                            .find(|p| p.spec().codec == frame.codec)
                            .map(|p| p.pt())
                    })
            } else {
                writer
                    .payload_params()
                    .find(|p| {
                        p.spec().codec == frame.codec
                            && (frame.codec != Codec::H264
                                || p.spec().format.packetization_mode.unwrap_or(1) == 1)
                    })
                    .or_else(|| {
                        writer
                            .payload_params()
                            .find(|p| p.spec().codec == frame.codec)
                    })
                    .map(|p| p.pt())
            };
            let Some(pt) = pt else {
                if frame.kind == MediaKind::Video && !sub.warned_codec_mismatch {
                    sub.warned_codec_mismatch = true;
                    warn!(
                        "⚠️ [MediaSFU] WHEP subscriber [{}] does not support publisher video codec {:?}",
                        sub.session_id, frame.codec
                    );
                }
                continue;
            };
            let rtp_time = adjust_rtp_time(frame.codec, frame.time);
            if let Err(e) = writer.write(pt, frame.network_time, rtp_time, frame.data.clone()) {
                debug!("WHEP write error for [{}]: {:?}", sub.session_id, e);
                sub.rtc.disconnect();
                break;
            }
            wrote_any = true;
        }
        if wrote_any && sub.rtc.is_alive() {
            let mut ignored = Vec::new();
            let _ = drain_subscriber(sub, socket, &mut ignored).await;
        }
    }
}

fn adjust_rtp_time(codec: Codec, time: MediaTime) -> MediaTime {
    let target_freq = match codec {
        Codec::H264 | Codec::H265 => Frequency::NINETY_KHZ,
        Codec::Opus => Frequency::FORTY_EIGHT_KHZ,
        Codec::PCMU | Codec::PCMA => Frequency::EIGHT_KHZ,
        _ => return time,
    };
    if time.frequency() == target_freq {
        time
    } else {
        time.rebase(target_freq)
    }
}

async fn request_publisher_keyframe(
    stream_id: Uuid,
    publishers: &mut HashMap<Uuid, WhipPublisher>,
    socket: &UdpSocket,
    kind: KeyframeRequestKind,
    force: bool,
) {
    let Some(pub_entry) = publishers.get_mut(&stream_id) else {
        return;
    };
    if !pub_entry.rtc.is_alive() {
        return;
    }
    let throttled = !force
        && pub_entry
            .last_keyframe_req
            .map(|t| t.elapsed() < Duration::from_millis(400))
            .unwrap_or(false);
    if throttled {
        return;
    }
    if let Some(mid) = pub_entry.video_mid {
        if let Some(mut writer) = pub_entry.rtc.writer(mid) {
            let res = writer.request_keyframe(None, kind);
            info!("🔑 [MediaSFU] Requested {:?} keyframe from WHIP publisher [{}]: {:?}", kind, stream_id, res);
            pub_entry.last_keyframe_req = Some(Instant::now());
        }
        let now = Instant::now();
        let _ = pub_entry.rtc.handle_input(Input::Timeout(now));
        let mut ignored = Vec::new();
        let _ = drain_publisher(stream_id, pub_entry, socket, &mut ignored).await;
    }
}

fn disconnect_stream_subscribers(stream_id: Uuid, subscribers: &mut [WhepSubscriber]) {
    for sub in subscribers.iter_mut() {
        if sub.stream_id == stream_id {
            sub.rtc.disconnect();
        }
    }
}

fn prune_dead_sessions(
    publishers: &mut HashMap<Uuid, WhipPublisher>,
    subscribers: &mut Vec<WhepSubscriber>,
) {
    publishers.retain(|stream_id, pub_entry| {
        let stale = !pub_entry.ice_connected && pub_entry.created_at.elapsed() > Duration::from_secs(20);
        let keep = pub_entry.rtc.is_alive() && !stale;
        if !keep {
            info!("🔴 [MediaSFU] WHIP publisher removed for stream [{}]", stream_id);
        }
        keep
    });
    subscribers.retain(|sub| {
        let stale = !sub.ice_connected && sub.created_at.elapsed() > Duration::from_secs(20);
        sub.rtc.is_alive() && !stale
    });
}
