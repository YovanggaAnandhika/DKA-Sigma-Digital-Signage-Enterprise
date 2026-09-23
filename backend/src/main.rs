#![allow(dead_code, unused_imports, unused_variables)]

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
use grpc::proto::studio::v1::playlist::playlist_service_server::PlaylistServiceServer;
use grpc::proto::studio::v1::schedule::schedule_service_server::ScheduleServiceServer;
use grpc::studio::media::service::MediaServiceImpl;
use grpc::studio::playlist::service::PlaylistServiceImpl;
use grpc::studio::layout::service::LayoutServiceImpl;
use grpc::studio::schedule::service::ScheduleServiceImpl;
use std::env;
use std::net::SocketAddr;
use tonic::transport::Server;
use tracing::{info, warn};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,signage_backend=debug".into()),
        )
        .init();

    let args: Vec<String> = env::args().collect();
    let has_migrate = args.iter().any(|arg| arg == "--migrate");
    let has_fresh = args.iter().any(|arg| arg == "--fresh");
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

    // CLI Arguments Handler: --migrate, --fresh, --seed
    if has_migrate || has_seed {
        if has_fresh {
            info!("--fresh flag detected. Resetting entire database schema...");
            if let Err(e) = db::drop_all_tables(&pool).await {
                tracing::error!("Failed to drop database schema: {}", e);
                return Err(e.into());
            }
        }

        if has_migrate {
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

    let grpc_addr: SocketAddr = format!("{}:{}", config.host, config.grpc_port).parse()?;
    info!("Pure gRPC Server listening on {}", grpc_addr);

    // Instantiate service implementations
    let stream_manager = StreamConnectionManager::new();

    

    // Build and serve Tonic gRPC server
    let mut router = Server::builder();
    let router = crate::register_hardware_services!(router, pool);
    let router = crate::register_iam_services!(router, pool, config);
    let router = crate::register_studio_services!(router, pool);
    let router = crate::register_distribution_services!(router, pool, stream_manager.clone());
    let router = crate::register_common_services!(router, pool);
    
    router.serve(grpc_addr)
        .await?;

    Ok(())
}
