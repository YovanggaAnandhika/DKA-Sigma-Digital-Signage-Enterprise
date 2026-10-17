pub mod orientation;
pub mod resolution;

#[macro_export]
macro_rules! register_common_services {
    ($router:expr, $pool:expr) => {
        $router
            .add_service(crate::grpc::proto::common::v1::orientation::orientation_service_server::OrientationServiceServer::new(
                crate::grpc::common::orientation::service::OrientationServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::common::v1::resolution::resolution_service_server::ResolutionServiceServer::new(
                crate::grpc::common::resolution::service::ResolutionServiceImpl::new($pool.clone())
            ))
    };
}

