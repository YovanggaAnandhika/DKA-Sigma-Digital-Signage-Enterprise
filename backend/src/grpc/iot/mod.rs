pub mod service;

#[macro_export]
macro_rules! register_iot_services {
    ($router:expr, $pool:expr, $stream_manager:expr) => {
        $router.add_service(
            crate::grpc::proto::iot::v1::device::iot_device_service_server::IotDeviceServiceServer::new(
                crate::grpc::iot::service::IotDeviceServiceImpl::new(
                    $pool.clone(),
                    $stream_manager.clone(),
                ),
            ),
        )
    };
}
