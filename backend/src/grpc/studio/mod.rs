pub mod layer;
pub mod layout;
pub mod media;
pub mod playlist;
pub mod schedule;
pub mod transition;
pub mod visual_filter;

#[macro_export]
macro_rules! register_studio_services {
    ($router:expr, $pool:expr) => {
        $router
            .add_service(crate::grpc::proto::studio::v1::media::media_service_server::MediaServiceServer::new(
                crate::grpc::studio::media::service::MediaServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::studio::v1::playlist::playlist_service_server::PlaylistServiceServer::new(
                crate::grpc::studio::playlist::service::PlaylistServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::studio::v1::layout::layout_service_server::LayoutServiceServer::new(
                crate::grpc::studio::layout::service::LayoutServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::studio::v1::layer::layer_service_server::LayerServiceServer::new(
                crate::grpc::studio::layer::layer::service::LayerServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::studio::v1::layer::layer_block_service_server::LayerBlockServiceServer::new(
                crate::grpc::studio::layer::block::service::LayerBlockServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::studio::v1::layer::layer_item_override_service_server::LayerItemOverrideServiceServer::new(
                crate::grpc::studio::layer::item_override::service::LayerItemOverrideServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::studio::v1::schedule::schedule_service_server::ScheduleServiceServer::new(
                crate::grpc::studio::schedule::service::ScheduleServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::studio::v1::transition::transition_service_server::TransitionServiceServer::new(
                crate::grpc::studio::transition::service::MyTransitionService::new(
                    std::sync::Arc::new(crate::modules::studio::transition::repositories::TransitionRepository::new($pool.clone()))
                )
            ))
            .add_service(crate::grpc::proto::studio::v1::visual_filter::visual_filter_service_server::VisualFilterServiceServer::new(
                crate::grpc::studio::visual_filter::service::MyVisualFilterService::new(
                    std::sync::Arc::new(crate::modules::studio::visual_filter::repositories::VisualFilterRepository::new($pool.clone()))
                )
            ))
    };
}
