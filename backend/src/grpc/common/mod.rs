pub mod orientation;

#[macro_export]
macro_rules! register_common_services {
    ($router:expr, $pool:expr) => {
        $router
            .add_service(crate::grpc::proto::common::v1::orientation::orientation_service_server::OrientationServiceServer::new(
                crate::grpc::common::orientation::service::OrientationServiceImpl::new($pool.clone())
            ))
    };
}
