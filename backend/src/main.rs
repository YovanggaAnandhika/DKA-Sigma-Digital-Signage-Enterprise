#![recursion_limit = "512"]

mod cli;
mod common;
mod config;
mod db;
mod grpc;
mod modules;
mod seeders;
mod workers;

use crate::modules::distribution::stream::services::StreamConnectionManager;
use config::Config;
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
    let config = Config::from_env();
    let pool = match db::create_pool(&config.database_url).await {
        Ok(pool) => {
            info!("Database connected successfully.");
            pool
        }
        Err(error) => {
            warn!("Warning: Could not connect to PostgreSQL ({}). Running server with pool initialization deferred.", error);
            sqlx::PgPool::connect_lazy(&config.database_url)?
        }
    };

    if cli::run_if_requested(&args, &pool).await? {
        return Ok(());
    }

    info!("Starting Pure gRPC Digital Signage Platform Backend...");
    info!(
        "Configuration loaded. Host: {}, gRPC Port: {}",
        config.host, config.grpc_port
    );

    workers::upload_cleanup::start(&config.upload_dir).await?;

    let grpc_addr: SocketAddr = format!("{}:{}", config.host, config.grpc_port).parse()?;
    info!("Pure gRPC Server listening on {}", grpc_addr);

    let stream_manager = StreamConnectionManager::new();
    grpc::iot::mqtt::spawn_mqtt_worker(pool.clone(), stream_manager.clone());

    let mut router = Server::builder().layer(tower_http::trace::TraceLayer::new_for_grpc());
    let router = crate::register_grpc_services!(router, pool, config, stream_manager);

    router.serve(grpc_addr).await?;
    Ok(())
}
