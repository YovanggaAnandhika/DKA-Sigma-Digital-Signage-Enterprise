pub mod device;
pub mod display_group;

#[macro_export]
macro_rules! register_hardware_services {
    ($router:expr, $pool:expr) => {
        $router
            .add_service(crate::grpc::proto::hardware::v1::device::device_service_server::DeviceServiceServer::new(
                crate::grpc::hardware::device::service::DeviceServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::hardware::v1::display_group::display_group_service_server::DisplayGroupServiceServer::new(
                crate::grpc::hardware::display_group::service::DisplayGroupServiceImpl::new($pool.clone())
            ))
    };
}
