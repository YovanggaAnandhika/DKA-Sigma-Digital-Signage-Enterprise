#![recursion_limit = "512"]

mod cli;
mod common;
mod config;
mod db;
mod grpc;
mod modules;
mod seeders;
mod streamer_auth;
mod workers;

use crate::modules::distribution::stream::services::StreamConnectionManager;
use config::Config;
use std::{env, fmt, time::Duration};
use std::net::SocketAddr;
use tokio::sync::watch;
use tonic::transport::Server;
use tower_http::classify::{
    ClassifiedResponse, ClassifyEos, ClassifyResponse, GrpcErrorsAsFailures,
    GrpcEosErrorsAsFailures, GrpcFailureClass, MakeClassifier,
};
use tracing::{info, warn};

#[derive(Clone, Copy)]
struct GrpcEndpointClassifier;

#[derive(Clone)]
struct GrpcEndpointResponseClassifier {
    endpoint: String,
    inner: GrpcErrorsAsFailures,
}

struct GrpcEndpointEosClassifier {
    endpoint: String,
    inner: GrpcEosErrorsAsFailures,
}

struct GrpcEndpointFailure {
    endpoint: String,
    classification: GrpcFailureClass,
}

impl fmt::Display for GrpcEndpointFailure {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{}: {}", self.endpoint, self.classification)
    }
}

impl MakeClassifier for GrpcEndpointClassifier {
    type FailureClass = GrpcEndpointFailure;
    type ClassifyEos = GrpcEndpointEosClassifier;
    type Classifier = GrpcEndpointResponseClassifier;

    fn make_classifier<B>(
        &self,
        request: &tonic::codegen::http::Request<B>,
    ) -> Self::Classifier {
        GrpcEndpointResponseClassifier {
            endpoint: request.uri().path().to_owned(),
            inner: GrpcErrorsAsFailures::new(),
        }
    }
}

impl ClassifyResponse for GrpcEndpointResponseClassifier {
    type FailureClass = GrpcEndpointFailure;
    type ClassifyEos = GrpcEndpointEosClassifier;

    fn classify_response<B>(
        self,
        response: &tonic::codegen::http::Response<B>,
    ) -> ClassifiedResponse<Self::FailureClass, Self::ClassifyEos> {
        match self.inner.classify_response(response) {
            ClassifiedResponse::Ready(result) => ClassifiedResponse::Ready(
                result.map_err(|classification| GrpcEndpointFailure {
                    endpoint: self.endpoint,
                    classification,
                }),
            ),
            ClassifiedResponse::RequiresEos(inner) => {
                ClassifiedResponse::RequiresEos(GrpcEndpointEosClassifier {
                    endpoint: self.endpoint,
                    inner,
                })
            }
        }
    }

    fn classify_error<E>(self, error: &E) -> Self::FailureClass
    where
        E: fmt::Display + 'static,
    {
        GrpcEndpointFailure {
            endpoint: self.endpoint,
            classification: self.inner.classify_error(error),
        }
    }
}

impl ClassifyEos for GrpcEndpointEosClassifier {
    type FailureClass = GrpcEndpointFailure;

    fn classify_eos(
        self,
        trailers: Option<&tonic::codegen::http::HeaderMap>,
    ) -> Result<(), Self::FailureClass> {
        self.inner
            .classify_eos(trailers)
            .map_err(|classification| GrpcEndpointFailure {
                endpoint: self.endpoint,
                classification,
            })
    }

    fn classify_error<E>(self, error: &E) -> Self::FailureClass
    where
        E: fmt::Display + 'static,
    {
        GrpcEndpointFailure {
            endpoint: self.endpoint,
            classification: self.inner.classify_error(error),
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let default_filter = if cfg!(debug_assertions) {
        "info,signage_backend=debug"
    } else {
        "error"
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
        "Configuration loaded. Host: {}, gRPC Port: {}, Streamer Auth Port: {}",
        config.host, config.grpc_port, 50052
    );

    workers::upload_cleanup::start(&config.upload_dir).await?;

    let grpc_addr: SocketAddr = format!("{}:{}", config.host, config.grpc_port).parse()?;
    let auth_addr: SocketAddr = format!("{}:50052", config.host).parse()?;
    info!("Pure gRPC Server listening on {}", grpc_addr);

    let stream_manager = StreamConnectionManager::new();
    grpc::iot::mqtt::spawn_mqtt_worker(pool.clone(), stream_manager.clone());

    let relay_manager = crate::workers::live_stream_relay::LiveStreamRelayManager::new(
        config.upload_dir.clone(),
        config.streamer_api_url.clone(),
        config.streamer_rtmp_url.clone(),
    );
    let relay_manager_startup = relay_manager.clone();
    let pool_startup = pool.clone();
    tokio::spawn(async move {
        relay_manager_startup.sync_active_relays(&pool_startup).await;
    });
    let relay_manager_shutdown = relay_manager.clone();

    let auth_pool = pool.clone();
    let mut router = Server::builder().layer(
        tower_http::trace::TraceLayer::new(GrpcEndpointClassifier).on_failure(
            |failure: GrpcEndpointFailure, latency: Duration, _span: &tracing::Span| {
                tracing::error!(
                    endpoint = %failure.endpoint,
                    classification = %failure.classification,
                    ?latency,
                    "gRPC request failed"
                );
            },
        ),
    );
    let router = crate::register_grpc_services!(router, pool, config, stream_manager, relay_manager);

    let (shutdown_tx, shutdown_rx) = watch::channel(false);
    tokio::spawn(async move {
        let mut sigterm = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install SIGTERM handler");
        tokio::select! {
            _ = tokio::signal::ctrl_c() => {},
            _ = sigterm.recv() => {},
        }
        let _ = shutdown_tx.send(true);
        info!("Shutdown signal received, terminating active RTMP/HLS relays so encoders disconnect cleanly...");
        relay_manager_shutdown.stop_all().await;
    });

    let grpc_server = router.serve_with_shutdown(grpc_addr, wait_for_shutdown(shutdown_rx.clone()));
    let auth_listener = tokio::net::TcpListener::bind(auth_addr).await?;
    let auth_server = axum::serve(auth_listener, streamer_auth::router(auth_pool))
        .with_graceful_shutdown(wait_for_shutdown(shutdown_rx));
    info!("Streamer auth callback listening on {}", auth_addr);

    tokio::select! {
        result = grpc_server => result?,
        result = auth_server => result?,
    }
    Ok(())
}

async fn wait_for_shutdown(mut shutdown: watch::Receiver<bool>) {
    if !*shutdown.borrow() {
        let _ = shutdown.changed().await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn grpc_failure_classification_includes_endpoint() {
        let request = tonic::codegen::http::Request::builder()
            .uri("/signage.v1.MediaService/ListMedia")
            .body(())
            .unwrap();
        let classifier = GrpcEndpointClassifier.make_classifier(&request);
        let response = tonic::codegen::http::Response::builder()
            .header("grpc-status", "13")
            .body(())
            .unwrap();

        match classifier.classify_response(&response) {
            ClassifiedResponse::Ready(Err(failure)) => {
                assert_eq!(failure.endpoint, "/signage.v1.MediaService/ListMedia");
                assert_eq!(failure.classification.to_string(), "Code: 13");
            }
            _ => panic!("expected a classified gRPC failure"),
        }
    }
}
