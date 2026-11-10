use super::model::{
    PushCommandDto, PushCommandResultDto, ServerCommandMessage,
};
use super::repositories::StreamRepository;
use crate::common::AppError;
use crate::db::DbPool;
use chrono::Utc;
use crate::grpc::proto::distribution::v1::stream::{DeviceDiagnosticsEvent, LogLine};
use std::collections::{HashMap, VecDeque};
use std::sync::Arc;
use tokio::sync::{broadcast, mpsc};
use uuid::Uuid;

pub type CommandSender = mpsc::Sender<ServerCommandMessage>;

const LOG_BACKLOG: usize = 500;

struct DeviceFeed {
    tx: broadcast::Sender<DeviceDiagnosticsEvent>,
    backlog: VecDeque<LogLine>,
    watchers: usize,
}

/// Feed diagnostik realtime per device. Hanya di memori: hilang saat backend restart (disengaja).
#[derive(Clone, Default)]
pub struct DiagnosticsHub {
    feeds: Arc<std::sync::Mutex<HashMap<Uuid, DeviceFeed>>>,
}

impl DiagnosticsHub {
    fn new_feed() -> DeviceFeed {
        DeviceFeed {
            tx: broadcast::channel(64).0,
            backlog: VecDeque::new(),
            watchers: 0,
        }
    }

    pub fn publish(&self, id: Uuid, event: DeviceDiagnosticsEvent) {
        let mut map = self.feeds.lock().unwrap_or_else(|e| e.into_inner());
        let Some(feed) = map.get_mut(&id) else {
            return;
        };
        if let Some(crate::grpc::proto::distribution::v1::stream::device_diagnostics_event::Payload::Logs(b)) = &event.payload {
            feed.backlog.extend(b.lines.iter().cloned());
            while feed.backlog.len() > LOG_BACKLOG {
                feed.backlog.pop_front();
            }
        }
        let _ = feed.tx.send(event);
    }

    fn subscribe(&self, id: Uuid) -> (Vec<LogLine>, broadcast::Receiver<DeviceDiagnosticsEvent>, bool) {
        let mut map = self.feeds.lock().unwrap_or_else(|e| e.into_inner());
        let feed = map.entry(id).or_insert_with(Self::new_feed);
        let first = feed.watchers == 0;
        feed.watchers += 1;
        (feed.backlog.iter().cloned().collect(), feed.tx.subscribe(), first)
    }

    fn unsubscribe(&self, id: Uuid) -> bool {
        let mut map = self.feeds.lock().unwrap_or_else(|e| e.into_inner());
        let Some(feed) = map.get_mut(&id) else {
            return false;
        };
        feed.watchers = feed.watchers.saturating_sub(1);
        if feed.watchers == 0 {
            map.remove(&id);
            true
        } else {
            false
        }
    }

    fn has_watchers(&self, id: Uuid) -> bool {
        self.feeds
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .get(&id)
            .is_some_and(|feed| feed.watchers > 0)
    }
}

#[derive(Clone, Default)]
pub struct StreamConnectionManager {
    // Map of device_id -> channel sender for live connected displays
    active_displays: Arc<std::sync::Mutex<HashMap<Uuid, CommandSender>>>,
    pub diagnostics: DiagnosticsHub,
}

impl StreamConnectionManager {
    pub fn new() -> Self {
        Self::default()
    }

    pub async fn register_connection(&self, device_id: Uuid, sender: CommandSender) {
        self.active_displays
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .insert(device_id, sender);
        if self.diagnostics.has_watchers(device_id) {
            self.send_log_stream(device_id, true);
        }
    }

    pub async fn unregister_connection(&self, device_id: &Uuid) {
        self.active_displays
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .remove(device_id);
    }

    pub fn subscribe_diagnostics(&self, device_id: Uuid) -> DiagnosticsSubscription {
        let (backlog, receiver, first) = self.diagnostics.subscribe(device_id);
        if first {
            self.send_log_stream(device_id, true);
        }
        DiagnosticsSubscription {
            manager: self.clone(),
            device_id,
            backlog,
            receiver,
        }
    }

    pub fn send_log_stream(&self, device_id: Uuid, enabled: bool) {
        let sender = self
            .active_displays
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .get(&device_id)
            .cloned();
        if let Some(sender) = sender {
            let _ = sender.try_send(ServerCommandMessage {
                command_id: Uuid::new_v4(),
                device_id,
                command_type: super::model::LiveCommandType::LogStream,
                payload_json: Some(format!(r#"{{"enabled":{enabled}}}"#)),
                created_at: Utc::now().to_rfc3339(),
            });
        }
    }

    pub async fn send_command(
        &self,
        pool: &DbPool,
        dto: PushCommandDto,
    ) -> Result<PushCommandResultDto, AppError> {
        let command = ServerCommandMessage {
            command_id: Uuid::new_v4(),
            device_id: dto.device_id,
            command_type: dto.command_type,
            payload_json: dto.payload_json,
            created_at: Utc::now().to_rfc3339(),
        };

        let mut pushed_live = false;
        {
            let map = self.active_displays.lock().unwrap_or_else(|e| e.into_inner());
            if dto.device_id.is_nil() {
                for tx in map.values() {
                    if tx.try_send(command.clone()).is_ok() {
                        pushed_live = true;
                    }
                }
            } else if let Some(tx) = map.get(&dto.device_id) {
                if tx.try_send(command.clone()).is_ok() {
                    pushed_live = true;
                }
            }
        }

        // Log ke tabel telemetri; jika sudah terkirim instan via live stream, tandai consumed=true
        // agar tidak dieksekusi ganda saat polling heartbeat 3 detik berikutnya.
        // LOG_STREAM hanya sinyal on/off sesaat: jangan dicatat/diantrikan agar tidak dieksekusi ulang saat polling.
        if !matches!(command.command_type, super::model::LiveCommandType::LogStream) {
            let _ = StreamRepository::log_command(pool, &command, pushed_live).await;
        }

        if dto.device_id.is_nil() {
            Ok(PushCommandResultDto {
                success: true,
                command_id: command.command_id,
                message: "Command broadcasted to all live connected displays".into(),
            })
        } else if pushed_live {
            Ok(PushCommandResultDto {
                success: true,
                command_id: command.command_id,
                message: "Command pushed directly to live connected display".into(),
            })
        } else {
            Ok(PushCommandResultDto {
                success: false,
                command_id: command.command_id,
                message: "Display is currently offline; command queued in history".into(),
            })
        }
    }

}

pub struct DiagnosticsSubscription {
    manager: StreamConnectionManager,
    device_id: Uuid,
    pub backlog: Vec<LogLine>,
    receiver: broadcast::Receiver<DeviceDiagnosticsEvent>,
}

impl DiagnosticsSubscription {
    pub async fn recv(&mut self) -> Result<DeviceDiagnosticsEvent, broadcast::error::RecvError> {
        self.receiver.recv().await
    }
}

impl Drop for DiagnosticsSubscription {
    fn drop(&mut self) {
        if self.manager.diagnostics.unsubscribe(self.device_id) {
            self.manager.send_log_stream(self.device_id, false);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::grpc::proto::distribution::v1::stream::{
        device_diagnostics_event, LogBatch,
    };

    fn log_event(message: &str) -> DeviceDiagnosticsEvent {
        DeviceDiagnosticsEvent {
            payload: Some(device_diagnostics_event::Payload::Logs(LogBatch {
                lines: vec![LogLine {
                    message: message.to_string(),
                    ..Default::default()
                }],
            })),
        }
    }

    #[test]
    fn log_backlog_exists_only_while_a_device_is_being_watched() {
        let hub = DiagnosticsHub::default();
        let id = Uuid::new_v4();

        hub.publish(id, log_event("not retained"));
        assert!(!hub.feeds.lock().unwrap().contains_key(&id));

        let (backlog, _first_receiver, first) = hub.subscribe(id);
        assert!(first);
        assert!(backlog.is_empty());
        hub.publish(id, log_event("retained"));

        let (backlog, _second_receiver, first) = hub.subscribe(id);
        assert!(!first);
        assert_eq!(backlog.len(), 1);
        assert_eq!(backlog[0].message, "retained");
        assert!(!hub.unsubscribe(id));
        assert!(hub.unsubscribe(id));

        hub.publish(id, log_event("not retained after close"));
        assert!(!hub.feeds.lock().unwrap().contains_key(&id));
    }
}
