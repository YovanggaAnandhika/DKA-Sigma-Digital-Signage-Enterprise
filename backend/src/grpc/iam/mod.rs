pub mod permission;
pub mod role;
pub mod role_group;
pub mod user;

#[macro_export]
macro_rules! register_iam_services {
    ($router:expr, $pool:expr, $config:expr) => {
        $router
            .add_service(crate::grpc::proto::iam::v1::permission::permission_service_server::PermissionServiceServer::new(
                crate::grpc::iam::permission::service::PermissionServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::iam::v1::role::role_service_server::RoleServiceServer::new(
                crate::grpc::iam::role::service::RoleServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::iam::v1::role_group::role_group_service_server::RoleGroupServiceServer::new(
                crate::grpc::iam::role_group::service::RoleGroupServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::iam::v1::user::user_service_server::UserServiceServer::new(
                crate::grpc::iam::user::service::UserServiceImpl::new($pool.clone(), $config.clone())
            ))
    };
}
