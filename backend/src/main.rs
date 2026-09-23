#![allow(dead_code, unused_imports, unused_variables)]

mod common;
mod config;
mod db;
mod grpc;
mod modules;
mod seeders;

use config::Config;
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

    // Hardware Services
    use grpc::hardware::{DeviceServiceImpl, DisplayGroupServiceImpl};
    use grpc::proto::hardware::v1::device::device_service_server::DeviceServiceServer;
    use grpc::proto::hardware::v1::display_group::display_group_service_server::DisplayGroupServiceServer;

    // IAM Services
    use grpc::iam::{PermissionServiceImpl, RoleServiceImpl, RoleGroupServiceImpl, UserServiceImpl};
    use grpc::proto::iam::v1::permission::permission_service_server::PermissionServiceServer;
    use grpc::proto::iam::v1::role::role_service_server::RoleServiceServer;
    use grpc::proto::iam::v1::role_group::role_group_service_server::RoleGroupServiceServer;
    use grpc::proto::iam::v1::user::user_service_server::UserServiceServer;

    // Studio Services
    use grpc::studio::{MediaServiceImpl, PlaylistServiceImpl, LayoutServiceImpl, ScheduleServiceImpl};
    use grpc::proto::studio::v1::media::media_service_server::MediaServiceServer;
    use grpc::proto::studio::v1::playlist::playlist_service_server::PlaylistServiceServer;
    use grpc::proto::studio::v1::layout::layout_service_server::LayoutServiceServer;
    use grpc::proto::studio::v1::layer::layer_service_server::LayerServiceServer;
    use grpc::proto::common::v1::orientation::orientation_service_server::OrientationServiceServer;
    use grpc::proto::studio::v1::schedule::schedule_service_server::ScheduleServiceServer;

    // Distribution Services
    use grpc::distribution::{ManifestServiceImpl, StreamServiceImpl, CanaryServiceImpl};
    use grpc::proto::distribution::v1::manifest::manifest_service_server::ManifestServiceServer;
    use grpc::proto::distribution::v1::stream::stream_service_server::StreamServiceServer;
    use grpc::proto::distribution::v1::canary::canary_service_server::CanaryServiceServer;

    // Instantiate service implementations
    let stream_manager = modules::distribution::stream::services::StreamConnectionManager::new();

    let device_svc = DeviceServiceImpl::new(pool.clone());
    let display_group_svc = DisplayGroupServiceImpl::new(pool.clone());
    let perm_svc = PermissionServiceImpl::new(pool.clone());
    let role_svc = RoleServiceImpl::new(pool.clone());
    let role_grp_svc = RoleGroupServiceImpl::new(pool.clone());
    let user_svc = UserServiceImpl::new(pool.clone(), config);
    let media_svc = MediaServiceImpl::new(pool.clone());
    let playlist_svc = PlaylistServiceImpl::new(pool.clone());
    let layout_svc = LayoutServiceImpl::new(pool.clone());
    let layer_svc = crate::grpc::studio::layer::service::LayerServiceImpl::new(pool.clone());
    let orientation_svc = crate::grpc::common::orientation::service::OrientationServiceImpl::new(pool.clone());
    let schedule_svc = ScheduleServiceImpl::new(pool.clone());
    let manifest_svc = ManifestServiceImpl::new(pool.clone());
    let stream_svc = StreamServiceImpl::new(pool.clone(), stream_manager);
    let canary_svc = CanaryServiceImpl::new(pool);

    // Build and serve Tonic gRPC server
    Server::builder()
        // Hardware
        .add_service(DeviceServiceServer::new(device_svc))
        .add_service(DisplayGroupServiceServer::new(display_group_svc))
        // IAM
        .add_service(PermissionServiceServer::new(perm_svc))
        .add_service(RoleServiceServer::new(role_svc))
        .add_service(RoleGroupServiceServer::new(role_grp_svc))
        .add_service(UserServiceServer::new(user_svc))
        // Studio
        .add_service(MediaServiceServer::new(media_svc))
        .add_service(PlaylistServiceServer::new(playlist_svc))
        .add_service(LayoutServiceServer::new(layout_svc))
        .add_service(LayerServiceServer::new(layer_svc))
        .add_service(OrientationServiceServer::new(orientation_svc))
        .add_service(ScheduleServiceServer::new(schedule_svc))
        // Distribution
        .add_service(ManifestServiceServer::new(manifest_svc))
        .add_service(StreamServiceServer::new(stream_svc))
        .add_service(CanaryServiceServer::new(canary_svc))
        .serve(grpc_addr)
        .await?;

    Ok(())
}
