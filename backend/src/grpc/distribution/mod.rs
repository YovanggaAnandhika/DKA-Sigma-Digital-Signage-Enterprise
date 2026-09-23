pub mod canary;
pub mod manifest;
pub mod stream;

#[macro_export]
macro_rules! register_distribution_services {
    ($router:expr, $pool:expr, $stream_manager:expr) => {
        $router
            .add_service(crate::grpc::proto::distribution::v1::manifest::manifest_service_server::ManifestServiceServer::new(
                crate::grpc::distribution::manifest::service::ManifestServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::distribution::v1::stream::stream_service_server::StreamServiceServer::new(
                crate::grpc::distribution::stream::service::StreamServiceImpl::new($pool.clone(), $stream_manager)
            ))
            .add_service(crate::grpc::proto::distribution::v1::canary::canary_service_server::CanaryServiceServer::new(
                crate::grpc::distribution::canary::service::CanaryServiceImpl::new($pool.clone())
            ))
    };
}
