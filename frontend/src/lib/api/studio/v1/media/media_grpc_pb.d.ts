// package: signage.studio.v1.media
// file: studio/v1/media/media.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as studio_v1_media_media_pb from "../../../studio/v1/media/media_pb";
import * as studio_v1_media_media_common_pb from "../../../studio/v1/media/media.common_pb";

interface IMediaServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createMedia: IMediaServiceService_ICreateMedia;
    getMedia: IMediaServiceService_IGetMedia;
    listMedia: IMediaServiceService_IListMedia;
    updateMedia: IMediaServiceService_IUpdateMedia;
    deleteMedia: IMediaServiceService_IDeleteMedia;
    uploadMediaChunk: IMediaServiceService_IUploadMediaChunk;
    getMediaFile: IMediaServiceService_IGetMediaFile;
}

interface IMediaServiceService_ICreateMedia extends grpc.MethodDefinition<studio_v1_media_media_common_pb.CreateMediaRequest, studio_v1_media_media_common_pb.MediaItem> {
    path: "/signage.studio.v1.media.MediaService/CreateMedia";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_media_media_common_pb.CreateMediaRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_media_media_common_pb.CreateMediaRequest>;
    responseSerialize: grpc.serialize<studio_v1_media_media_common_pb.MediaItem>;
    responseDeserialize: grpc.deserialize<studio_v1_media_media_common_pb.MediaItem>;
}
interface IMediaServiceService_IGetMedia extends grpc.MethodDefinition<studio_v1_media_media_common_pb.GetMediaRequest, studio_v1_media_media_common_pb.MediaItem> {
    path: "/signage.studio.v1.media.MediaService/GetMedia";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_media_media_common_pb.GetMediaRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_media_media_common_pb.GetMediaRequest>;
    responseSerialize: grpc.serialize<studio_v1_media_media_common_pb.MediaItem>;
    responseDeserialize: grpc.deserialize<studio_v1_media_media_common_pb.MediaItem>;
}
interface IMediaServiceService_IListMedia extends grpc.MethodDefinition<studio_v1_media_media_common_pb.ListMediaRequest, studio_v1_media_media_common_pb.ListMediaResponse> {
    path: "/signage.studio.v1.media.MediaService/ListMedia";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_media_media_common_pb.ListMediaRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_media_media_common_pb.ListMediaRequest>;
    responseSerialize: grpc.serialize<studio_v1_media_media_common_pb.ListMediaResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_media_media_common_pb.ListMediaResponse>;
}
interface IMediaServiceService_IUpdateMedia extends grpc.MethodDefinition<studio_v1_media_media_common_pb.UpdateMediaRequest, studio_v1_media_media_common_pb.MediaItem> {
    path: "/signage.studio.v1.media.MediaService/UpdateMedia";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_media_media_common_pb.UpdateMediaRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_media_media_common_pb.UpdateMediaRequest>;
    responseSerialize: grpc.serialize<studio_v1_media_media_common_pb.MediaItem>;
    responseDeserialize: grpc.deserialize<studio_v1_media_media_common_pb.MediaItem>;
}
interface IMediaServiceService_IDeleteMedia extends grpc.MethodDefinition<studio_v1_media_media_common_pb.DeleteMediaRequest, studio_v1_media_media_common_pb.DeleteMediaResponse> {
    path: "/signage.studio.v1.media.MediaService/DeleteMedia";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_media_media_common_pb.DeleteMediaRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_media_media_common_pb.DeleteMediaRequest>;
    responseSerialize: grpc.serialize<studio_v1_media_media_common_pb.DeleteMediaResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_media_media_common_pb.DeleteMediaResponse>;
}
interface IMediaServiceService_IUploadMediaChunk extends grpc.MethodDefinition<studio_v1_media_media_common_pb.UploadMediaChunkRequest, studio_v1_media_media_common_pb.UploadMediaChunkResponse> {
    path: "/signage.studio.v1.media.MediaService/UploadMediaChunk";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_media_media_common_pb.UploadMediaChunkRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_media_media_common_pb.UploadMediaChunkRequest>;
    responseSerialize: grpc.serialize<studio_v1_media_media_common_pb.UploadMediaChunkResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_media_media_common_pb.UploadMediaChunkResponse>;
}
interface IMediaServiceService_IGetMediaFile extends grpc.MethodDefinition<studio_v1_media_media_common_pb.GetMediaFileRequest, studio_v1_media_media_common_pb.GetMediaFileResponse> {
    path: "/signage.studio.v1.media.MediaService/GetMediaFile";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_media_media_common_pb.GetMediaFileRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_media_media_common_pb.GetMediaFileRequest>;
    responseSerialize: grpc.serialize<studio_v1_media_media_common_pb.GetMediaFileResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_media_media_common_pb.GetMediaFileResponse>;
}

export const MediaServiceService: IMediaServiceService;

export interface IMediaServiceServer extends grpc.UntypedServiceImplementation {
    createMedia: grpc.handleUnaryCall<studio_v1_media_media_common_pb.CreateMediaRequest, studio_v1_media_media_common_pb.MediaItem>;
    getMedia: grpc.handleUnaryCall<studio_v1_media_media_common_pb.GetMediaRequest, studio_v1_media_media_common_pb.MediaItem>;
    listMedia: grpc.handleUnaryCall<studio_v1_media_media_common_pb.ListMediaRequest, studio_v1_media_media_common_pb.ListMediaResponse>;
    updateMedia: grpc.handleUnaryCall<studio_v1_media_media_common_pb.UpdateMediaRequest, studio_v1_media_media_common_pb.MediaItem>;
    deleteMedia: grpc.handleUnaryCall<studio_v1_media_media_common_pb.DeleteMediaRequest, studio_v1_media_media_common_pb.DeleteMediaResponse>;
    uploadMediaChunk: grpc.handleUnaryCall<studio_v1_media_media_common_pb.UploadMediaChunkRequest, studio_v1_media_media_common_pb.UploadMediaChunkResponse>;
    getMediaFile: grpc.handleUnaryCall<studio_v1_media_media_common_pb.GetMediaFileRequest, studio_v1_media_media_common_pb.GetMediaFileResponse>;
}

export interface IMediaServiceClient {
    createMedia(request: studio_v1_media_media_common_pb.CreateMediaRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    createMedia(request: studio_v1_media_media_common_pb.CreateMediaRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    createMedia(request: studio_v1_media_media_common_pb.CreateMediaRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    getMedia(request: studio_v1_media_media_common_pb.GetMediaRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    getMedia(request: studio_v1_media_media_common_pb.GetMediaRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    getMedia(request: studio_v1_media_media_common_pb.GetMediaRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    listMedia(request: studio_v1_media_media_common_pb.ListMediaRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.ListMediaResponse) => void): grpc.ClientUnaryCall;
    listMedia(request: studio_v1_media_media_common_pb.ListMediaRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.ListMediaResponse) => void): grpc.ClientUnaryCall;
    listMedia(request: studio_v1_media_media_common_pb.ListMediaRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.ListMediaResponse) => void): grpc.ClientUnaryCall;
    updateMedia(request: studio_v1_media_media_common_pb.UpdateMediaRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    updateMedia(request: studio_v1_media_media_common_pb.UpdateMediaRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    updateMedia(request: studio_v1_media_media_common_pb.UpdateMediaRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    deleteMedia(request: studio_v1_media_media_common_pb.DeleteMediaRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.DeleteMediaResponse) => void): grpc.ClientUnaryCall;
    deleteMedia(request: studio_v1_media_media_common_pb.DeleteMediaRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.DeleteMediaResponse) => void): grpc.ClientUnaryCall;
    deleteMedia(request: studio_v1_media_media_common_pb.DeleteMediaRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.DeleteMediaResponse) => void): grpc.ClientUnaryCall;
    uploadMediaChunk(request: studio_v1_media_media_common_pb.UploadMediaChunkRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.UploadMediaChunkResponse) => void): grpc.ClientUnaryCall;
    uploadMediaChunk(request: studio_v1_media_media_common_pb.UploadMediaChunkRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.UploadMediaChunkResponse) => void): grpc.ClientUnaryCall;
    uploadMediaChunk(request: studio_v1_media_media_common_pb.UploadMediaChunkRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.UploadMediaChunkResponse) => void): grpc.ClientUnaryCall;
    getMediaFile(request: studio_v1_media_media_common_pb.GetMediaFileRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.GetMediaFileResponse) => void): grpc.ClientUnaryCall;
    getMediaFile(request: studio_v1_media_media_common_pb.GetMediaFileRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.GetMediaFileResponse) => void): grpc.ClientUnaryCall;
    getMediaFile(request: studio_v1_media_media_common_pb.GetMediaFileRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.GetMediaFileResponse) => void): grpc.ClientUnaryCall;
}

export class MediaServiceClient extends grpc.Client implements IMediaServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createMedia(request: studio_v1_media_media_common_pb.CreateMediaRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    public createMedia(request: studio_v1_media_media_common_pb.CreateMediaRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    public createMedia(request: studio_v1_media_media_common_pb.CreateMediaRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    public getMedia(request: studio_v1_media_media_common_pb.GetMediaRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    public getMedia(request: studio_v1_media_media_common_pb.GetMediaRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    public getMedia(request: studio_v1_media_media_common_pb.GetMediaRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    public listMedia(request: studio_v1_media_media_common_pb.ListMediaRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.ListMediaResponse) => void): grpc.ClientUnaryCall;
    public listMedia(request: studio_v1_media_media_common_pb.ListMediaRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.ListMediaResponse) => void): grpc.ClientUnaryCall;
    public listMedia(request: studio_v1_media_media_common_pb.ListMediaRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.ListMediaResponse) => void): grpc.ClientUnaryCall;
    public updateMedia(request: studio_v1_media_media_common_pb.UpdateMediaRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    public updateMedia(request: studio_v1_media_media_common_pb.UpdateMediaRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    public updateMedia(request: studio_v1_media_media_common_pb.UpdateMediaRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.MediaItem) => void): grpc.ClientUnaryCall;
    public deleteMedia(request: studio_v1_media_media_common_pb.DeleteMediaRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.DeleteMediaResponse) => void): grpc.ClientUnaryCall;
    public deleteMedia(request: studio_v1_media_media_common_pb.DeleteMediaRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.DeleteMediaResponse) => void): grpc.ClientUnaryCall;
    public deleteMedia(request: studio_v1_media_media_common_pb.DeleteMediaRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.DeleteMediaResponse) => void): grpc.ClientUnaryCall;
    public uploadMediaChunk(request: studio_v1_media_media_common_pb.UploadMediaChunkRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.UploadMediaChunkResponse) => void): grpc.ClientUnaryCall;
    public uploadMediaChunk(request: studio_v1_media_media_common_pb.UploadMediaChunkRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.UploadMediaChunkResponse) => void): grpc.ClientUnaryCall;
    public uploadMediaChunk(request: studio_v1_media_media_common_pb.UploadMediaChunkRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.UploadMediaChunkResponse) => void): grpc.ClientUnaryCall;
    public getMediaFile(request: studio_v1_media_media_common_pb.GetMediaFileRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.GetMediaFileResponse) => void): grpc.ClientUnaryCall;
    public getMediaFile(request: studio_v1_media_media_common_pb.GetMediaFileRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.GetMediaFileResponse) => void): grpc.ClientUnaryCall;
    public getMediaFile(request: studio_v1_media_media_common_pb.GetMediaFileRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_media_media_common_pb.GetMediaFileResponse) => void): grpc.ClientUnaryCall;
}
