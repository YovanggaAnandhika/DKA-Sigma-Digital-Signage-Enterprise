pub mod album;
pub mod clock;
pub mod queue;
pub mod ticker;
pub mod webview;

#[macro_export]
macro_rules! register_components_services {
    ($router:expr, $pool:expr) => {{
        let queue_service = crate::grpc::components::queue::service::QueueServiceImpl::new($pool.clone());
        let album_service = crate::grpc::components::album::service::AlbumServiceImpl::new($pool.clone());

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
            .add_service(crate::grpc::proto::components::v1::queue::device::queue_device_service_server::QueueDeviceServiceServer::new(
                queue_service.clone()
            ))
    }};
}
