pub mod album;
pub mod clock;
pub mod live_stream;
pub mod queue;
pub mod ticker;
pub mod webview;

#[macro_export]
macro_rules! register_components_services {
    ($router:expr, $pool:expr, $stream_manager:expr, $relay_manager:expr) => {{
        let queue_service = crate::grpc::components::queue::service::QueueServiceImpl::with_stream_manager($pool.clone(), $stream_manager.clone());

        $router
            .add_service(crate::grpc::proto::components::v1::ticker::ticker_service_server::TickerServiceServer::new(
                crate::grpc::components::ticker::service::TickerServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::components::v1::clock::clock_service_server::ClockServiceServer::new(
                crate::grpc::components::clock::service::ClockServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::components::v1::webview::webview_service_server::WebviewServiceServer::new(
                crate::grpc::components::webview::service::WebviewServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::components::v1::live_stream::live_stream_service_server::LiveStreamServiceServer::new(
                crate::grpc::components::live_stream::service::LiveStreamServiceImpl::new($pool.clone(), $relay_manager.clone())
            ))
            .add_service(crate::grpc::proto::components::v1::album::album::album_service_server::AlbumServiceServer::new(
                crate::grpc::components::album::service::AlbumServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::components::v1::album::photo::album_photo_service_server::AlbumPhotoServiceServer::new(
                crate::grpc::components::album::service::AlbumPhotoServiceImpl::new($pool.clone())
            ))
            .add_service(crate::grpc::proto::components::v1::queue::display::queue_display_service_server::QueueDisplayServiceServer::new(
                queue_service.clone()
            ))
            .add_service(crate::grpc::proto::components::v1::queue::layout_item::queue_layout_item_service_server::QueueLayoutItemServiceServer::new(
                queue_service.clone()
            ))
            .add_service(crate::grpc::proto::components::v1::queue::counter::queue_counter_service_server::QueueCounterServiceServer::new(
                queue_service.clone()
            ))
            .add_service(crate::grpc::proto::components::v1::queue::ticket::queue_ticket_service_server::QueueTicketServiceServer::new(
                queue_service.clone()
            ))
            .add_service(crate::grpc::proto::components::v1::queue::audio::queue_audio_service_server::QueueAudioServiceServer::new(
                queue_service.clone()
            ))
            .add_service(crate::grpc::proto::components::v1::queue::sector::queue_sector_service_server::QueueSectorServiceServer::new(
                queue_service.clone()
            ))
            .add_service(crate::grpc::proto::components::v1::queue::iot_binding::queue_iot_binding_service_server::QueueIotBindingServiceServer::new(
                crate::grpc::components::queue::binding::QueueIotBindingServiceImpl::new($pool.clone())
            ))
    }};
}
