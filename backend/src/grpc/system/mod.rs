pub mod update;

#[macro_export]
macro_rules! register_system_services {
    ($router:expr, $pool:expr) => {
        $router.add_service(
            crate::grpc::proto::system::v1::update::app_update_service_server::AppUpdateServiceServer::new(
                crate::grpc::system::update::service::AppUpdateServiceImpl::new($pool.clone()),
            ),
        )
    };
}

