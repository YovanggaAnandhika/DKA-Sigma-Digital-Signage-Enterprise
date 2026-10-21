#![allow(dead_code, unused_imports, unused_variables)]
#![recursion_limit = "512"]

mod common;
mod config;
mod db;
mod grpc;
mod modules;
mod seeders;

use config::Config;
use crate::grpc::common::orientation::service::OrientationServiceImpl;
use crate::grpc::studio::layer::block::service::LayerBlockServiceImpl;
use crate::grpc::studio::layer::item_override::service::LayerItemOverrideServiceImpl;
use crate::grpc::studio::layer::layer::service::LayerServiceImpl;
use crate::modules::distribution::stream::services::StreamConnectionManager;
use grpc::distribution::canary::service::CanaryServiceImpl;
use grpc::distribution::manifest::service::ManifestServiceImpl;
use grpc::distribution::stream::service::StreamServiceImpl;
use grpc::hardware::device::service::DeviceServiceImpl;
use grpc::hardware::display_group::service::DisplayGroupServiceImpl;
use grpc::iam::permission::service::PermissionServiceImpl;
use grpc::iam::role::service::RoleServiceImpl;
use grpc::iam::role_group::service::RoleGroupServiceImpl;
use grpc::iam::user::service::UserServiceImpl;
use grpc::proto::common::v1::orientation::orientation_service_server::OrientationServiceServer;
use grpc::proto::distribution::v1::canary::canary_service_server::CanaryServiceServer;
use grpc::proto::distribution::v1::manifest::manifest_service_server::ManifestServiceServer;
use grpc::proto::distribution::v1::stream::stream_service_server::StreamServiceServer;
use grpc::proto::hardware::v1::device::device_service_server::DeviceServiceServer;
use grpc::proto::hardware::v1::display_group::display_group_service_server::DisplayGroupServiceServer;
use grpc::proto::iam::v1::permission::permission_service_server::PermissionServiceServer;
use grpc::proto::iam::v1::role::role_service_server::RoleServiceServer;
use grpc::proto::iam::v1::role_group::role_group_service_server::RoleGroupServiceServer;
use grpc::proto::iam::v1::user::user_service_server::UserServiceServer;
use grpc::proto::studio::v1::layer::layer_block_service_server::LayerBlockServiceServer;
use grpc::proto::studio::v1::layer::layer_item_override_service_server::LayerItemOverrideServiceServer;
use grpc::proto::studio::v1::layer::layer_service_server::LayerServiceServer;
use grpc::proto::studio::v1::layout::layout_service_server::LayoutServiceServer;
use grpc::proto::studio::v1::media::media_service_server::MediaServiceServer;
use std::env;
use std::net::SocketAddr;
use tonic::transport::Server;
use tracing::{info, warn};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let rust_env = env::var("RUST_ENV").unwrap_or_else(|_| "development".to_string());
    let default_filter = if rust_env == "production" {
        "error"
    } else {
        "info,signage_backend=debug"
    };

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| default_filter.into()),
        )
        .init();

    let args: Vec<String> = env::args().collect();
    let has_migrate = args.iter().any(|arg| arg == "--migrate");
    let has_migrate_fresh = args.iter().any(|arg| arg == "--migrate:fresh");
    let has_migrate_revert = args.iter().any(|arg| arg == "--migrate:revert");
    let has_seed = args.iter().any(|arg| arg == "--seed");

    let config = Config::from_env();

    // Database Connection Pool
    let pool = match db::create_pool(&config.database_url).await {
        Ok(p) => {
            info!("Database connected successfully.");
            p
        }
        Err(e) => {
            warn!("Warning: Could not connect to PostgreSQL ({}). Running server with pool initialization deferred.", e);
            sqlx::PgPool::connect_lazy(&config.database_url)?
        }
    };

    // CLI Arguments Handler: --migrate, --migrate:fresh, --migrate:revert, --seed
    if has_migrate || has_migrate_fresh || has_migrate_revert || has_seed {
        if has_migrate_fresh {
            info!("--migrate:fresh flag detected. Resetting entire database schema...");
            if let Err(e) = db::drop_all_tables(&pool).await {
                tracing::error!("Failed to drop database schema: {}", e);
                return Err(e.into());
            }
            info!("Running migrations on fresh schema...");
            if let Err(e) = db::run_migrations(&pool).await {
                tracing::error!("Migration failed: {}", e);
                return Err(e.into());
            }
        } else if has_migrate_revert {
            info!("--migrate:revert flag detected. Reverting last migration...");
            if let Err(e) = db::revert_migration(&pool).await {
                tracing::error!("Migration revert failed: {}", e);
                return Err(e);
            }
        } else if has_migrate {
            info!("--migrate flag detected. Running migrations...");
            if let Err(e) = db::run_migrations(&pool).await {
                tracing::error!("Migration failed: {}", e);
                return Err(e.into());
            }
        }

        if has_seed {
            info!("--seed flag detected. Executing database seeders...");
            if let Err(e) = seeders::seed_database(&pool).await {
                tracing::error!("Seeding failed: {}", e);
                return Err(e);
            }
        }

        info!("CLI tasks completed successfully. Exiting.");
        return Ok(());
    }

    info!("Starting Pure gRPC Digital Signage Platform Backend...");
    info!("Configuration loaded. Host: {}, gRPC Port: {}", config.host, config.grpc_port);

    let upload_dir = env::var("UPLOAD_DIR").unwrap_or_else(|_| "./uploads".to_string());
    tokio::fs::create_dir_all(&upload_dir).await.ok();
    let cleanup_upload_dir = upload_dir.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(3600)); // Every hour
        loop {
            interval.tick().await;
            if let Ok(mut entries) = tokio::fs::read_dir(&cleanup_upload_dir).await {
                while let Ok(Some(entry)) = entries.next_entry().await {
                    let file_name = entry.file_name().into_string().unwrap_or_default();
                    if file_name.starts_with(".part_") {
                        if let Ok(metadata) = entry.metadata().await {
                            if let Ok(modified) = metadata.modified() {
                                if let Ok(duration) = modified.elapsed() {
                                    if duration.as_secs() > 86400 { // 24 hours
                                        let _ = tokio::fs::remove_file(entry.path()).await;
                                        tracing::info!("Garbage collected orphan upload: {}", file_name);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    let grpc_addr: SocketAddr = format!("{}:{}", config.host, config.grpc_port).parse()?;
    info!("Pure gRPC Server listening on {}", grpc_addr);

    // Instantiate service implementations
    let stream_manager = StreamConnectionManager::new();

    // Spawn MQTT Worker for IoT Queue Devices (NodeMCU ESP32)
    spawn_mqtt_worker(pool.clone());

    // Build and serve Tonic gRPC server
    let mut router = Server::builder()
        .layer(tower_http::trace::TraceLayer::new_for_grpc());
    let router = crate::register_hardware_services!(router, pool);
    let router = crate::register_iam_services!(router, pool, config);
    let router = crate::register_studio_services!(router, pool);
    let router = crate::register_components_services!(router, pool);
    let router = crate::register_distribution_services!(router, pool, stream_manager.clone());
    let router = crate::register_common_services!(router, pool);
    
    router.serve(grpc_addr)
        .await?;

    Ok(())
}

fn spawn_mqtt_worker(pool: sqlx::PgPool) {
    let mqtt_host = std::env::var("MQTT_HOST").unwrap_or_else(|_| "dka-product-sigma-mqtt".to_string());
    let mqtt_port: u16 = std::env::var("MQTT_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(1883);

    tokio::spawn(async move {
        let mut mqttoptions = rumqttc::MqttOptions::new("dka-backend-worker", &mqtt_host, mqtt_port);
        mqttoptions.set_keep_alive(std::time::Duration::from_secs(15));
        mqttoptions.set_clean_session(true);

        loop {
            tracing::info!("Connecting to MQTT Broker at {}:{}...", mqtt_host, mqtt_port);
            let (client, mut eventloop) = rumqttc::AsyncClient::new(mqttoptions.clone(), 100);

            // Subscribe to queue IoT actions & telemetry
            if let Err(e) = client.subscribe("dka/iot/+/action", rumqttc::QoS::AtLeastOnce).await {
                tracing::warn!("Failed to subscribe to dka/iot/+/action: {}. Retrying in 5s...", e);
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                continue;
            }
            let _ = client.subscribe("dka/iot/+/telemetry", rumqttc::QoS::AtMostOnce).await;
            tracing::info!("Successfully connected & subscribed to MQTT topics for IoT Queue Devices");

            loop {
                match eventloop.poll().await {
                    Ok(rumqttc::Event::Incoming(rumqttc::Packet::Publish(p))) => {
                        let topic = p.topic;
                        let payload_str = match std::str::from_utf8(&p.payload) {
                            Ok(s) => s,
                            Err(_) => continue,
                        };

                        if topic.ends_with("/action") {
                            if let Ok(val) = serde_json::from_str::<serde_json::Value>(payload_str) {
                                let device_uid = val.get("device_uid")
                                    .and_then(|u| u.as_str())
                                    .or_else(|| {
                                        let parts: Vec<&str> = topic.split('/').collect();
                                        if parts.len() >= 3 { Some(parts[2]) } else { None }
                                    });

                                let pin = val.get("pin").and_then(|p| p.as_i64()).unwrap_or(13) as i32;

                                if let Some(uid) = device_uid {
                                    let queue_svc = crate::grpc::components::queue::service::QueueServiceImpl::new(pool.clone());
                                    use crate::grpc::proto::components::v1::queue::device::queue_device_service_server::QueueDeviceService;
                                    use crate::grpc::proto::components::v1::queue::device::TriggerDeviceActionRequest;

                                    let res = queue_svc.trigger_action(tonic::Request::new(TriggerDeviceActionRequest {
                                        queue_display_id: String::new(),
                                        device_uid: uid.to_string(),
                                        pin,
                                    })).await;

                                    let ack_topic = format!("dka/iot/{}/ack", uid);
                                    let (status, msg, action) = match res {
                                        Ok(r) => {
                                            let inner = r.into_inner();
                                            (if inner.success { "OK" } else { "IGNORED" }, inner.message, inner.action)
                                        }
                                        Err(e) => ("ERROR", e.message().to_string(), "NONE".to_string()),
                                    };

                                    let ack_payload = serde_json::json!({
                                        "status": status,
                                        "action": action,
                                        "pin": pin,
                                        "message": msg,
                                        "ts": chrono::Utc::now().timestamp(),
                                    }).to_string();

                                    let _ = client.publish(&ack_topic, rumqttc::QoS::AtLeastOnce, false, ack_payload.into_bytes()).await;

                                    let _ = sqlx::query(
                                        r#"
                                        INSERT INTO components_queue_iot_discoveries (device_uid, last_seen_at)
                                        VALUES ($1, NOW())
                                        ON CONFLICT (device_uid) DO UPDATE SET last_seen_at = NOW()
                                        "#
                                    )
                                    .bind(uid)
                                    .execute(&pool)
                                    .await;
                                }
                            }
                        } else if topic.ends_with("/telemetry") {
                            if let Ok(val) = serde_json::from_str::<serde_json::Value>(payload_str) {
                                let parts: Vec<&str> = topic.split('/').collect();
                                if parts.len() >= 3 {
                                    let uid = parts[2];
                                    let ip = val.get("ip").and_then(|i| i.as_str());
                                    let fw = val.get("fw").and_then(|f| f.as_str());

                                    let _ = sqlx::query(
                                        r#"
                                        INSERT INTO components_queue_iot_discoveries (device_uid, ip_address, firmware_version, last_seen_at)
                                        VALUES ($1, $2, $3, NOW())
                                        ON CONFLICT (device_uid) DO UPDATE
                                        SET ip_address = COALESCE(EXCLUDED.ip_address, components_queue_iot_discoveries.ip_address),
                                            firmware_version = COALESCE(EXCLUDED.firmware_version, components_queue_iot_discoveries.firmware_version),
                                            last_seen_at = NOW()
                                        "#
                                    )
                                    .bind(uid)
                                    .bind(ip)
                                    .bind(fw)
                                    .execute(&pool)
                                    .await;

                                    let _ = sqlx::query(
                                        r#"
                                        UPDATE components_queue_iot_devices
                                        SET last_seen_at = NOW(),
                                            ip_address = COALESCE($2, ip_address),
                                            firmware_version = COALESCE($3, firmware_version)
                                        WHERE device_uid = $1
                                        "#
                                    )
                                    .bind(uid)
                                    .bind(ip)
                                    .bind(fw)
                                    .execute(&pool)
                                    .await;
                                }
                            }
                        }
                    }
                    Ok(_) => {}
                    Err(e) => {
                        tracing::warn!("MQTT event loop disconnected: {}. Reconnecting in 5s...", e);
                        tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                        break;
                    }
                }
            }
        }
    });
}
