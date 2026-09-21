// package: signage.studio.v1.layout
// file: studio/v1/layout/layout.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as studio_v1_layout_layout_pb from "../../../studio/v1/layout/layout_pb";
import * as studio_v1_layout_layout_common_pb from "../../../studio/v1/layout/layout.common_pb";

interface ILayoutServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createLayout: ILayoutServiceService_ICreateLayout;
    getLayout: ILayoutServiceService_IGetLayout;
    listLayouts: ILayoutServiceService_IListLayouts;
    updateLayout: ILayoutServiceService_IUpdateLayout;
    deleteLayout: ILayoutServiceService_IDeleteLayout;
    createZone: ILayoutServiceService_ICreateZone;
    getZone: ILayoutServiceService_IGetZone;
    updateZone: ILayoutServiceService_IUpdateZone;
    deleteZone: ILayoutServiceService_IDeleteZone;
    addPlaylistBlock: ILayoutServiceService_IAddPlaylistBlock;
    addMediaBlock: ILayoutServiceService_IAddMediaBlock;
    updatePlaylistBlock: ILayoutServiceService_IUpdatePlaylistBlock;
    removePlaylistBlock: ILayoutServiceService_IRemovePlaylistBlock;
    setPlaylistItemOverride: ILayoutServiceService_ISetPlaylistItemOverride;
}

interface ILayoutServiceService_ICreateLayout extends grpc.MethodDefinition<studio_v1_layout_layout_common_pb.CreateLayoutRequest, studio_v1_layout_layout_common_pb.Layout> {
    path: "/signage.studio.v1.layout.LayoutService/CreateLayout";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.CreateLayoutRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.CreateLayoutRequest>;
    responseSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.Layout>;
    responseDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.Layout>;
}
interface ILayoutServiceService_IGetLayout extends grpc.MethodDefinition<studio_v1_layout_layout_common_pb.GetLayoutRequest, studio_v1_layout_layout_common_pb.Layout> {
    path: "/signage.studio.v1.layout.LayoutService/GetLayout";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.GetLayoutRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.GetLayoutRequest>;
    responseSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.Layout>;
    responseDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.Layout>;
}
interface ILayoutServiceService_IListLayouts extends grpc.MethodDefinition<studio_v1_layout_layout_common_pb.ListLayoutsRequest, studio_v1_layout_layout_common_pb.ListLayoutsResponse> {
    path: "/signage.studio.v1.layout.LayoutService/ListLayouts";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.ListLayoutsRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.ListLayoutsRequest>;
    responseSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.ListLayoutsResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.ListLayoutsResponse>;
}
interface ILayoutServiceService_IUpdateLayout extends grpc.MethodDefinition<studio_v1_layout_layout_common_pb.UpdateLayoutRequest, studio_v1_layout_layout_common_pb.Layout> {
    path: "/signage.studio.v1.layout.LayoutService/UpdateLayout";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.UpdateLayoutRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.UpdateLayoutRequest>;
    responseSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.Layout>;
    responseDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.Layout>;
}
interface ILayoutServiceService_IDeleteLayout extends grpc.MethodDefinition<studio_v1_layout_layout_common_pb.DeleteLayoutRequest, studio_v1_layout_layout_common_pb.DeleteLayoutResponse> {
    path: "/signage.studio.v1.layout.LayoutService/DeleteLayout";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.DeleteLayoutRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.DeleteLayoutRequest>;
    responseSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.DeleteLayoutResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.DeleteLayoutResponse>;
}
interface ILayoutServiceService_ICreateZone extends grpc.MethodDefinition<studio_v1_layout_layout_common_pb.CreateZoneRequest, studio_v1_layout_layout_common_pb.Zone> {
    path: "/signage.studio.v1.layout.LayoutService/CreateZone";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.CreateZoneRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.CreateZoneRequest>;
    responseSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.Zone>;
    responseDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.Zone>;
}
interface ILayoutServiceService_IGetZone extends grpc.MethodDefinition<studio_v1_layout_layout_common_pb.GetZoneRequest, studio_v1_layout_layout_common_pb.Zone> {
    path: "/signage.studio.v1.layout.LayoutService/GetZone";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.GetZoneRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.GetZoneRequest>;
    responseSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.Zone>;
    responseDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.Zone>;
}
interface ILayoutServiceService_IUpdateZone extends grpc.MethodDefinition<studio_v1_layout_layout_common_pb.UpdateZoneRequest, studio_v1_layout_layout_common_pb.Zone> {
    path: "/signage.studio.v1.layout.LayoutService/UpdateZone";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.UpdateZoneRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.UpdateZoneRequest>;
    responseSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.Zone>;
    responseDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.Zone>;
}
interface ILayoutServiceService_IDeleteZone extends grpc.MethodDefinition<studio_v1_layout_layout_common_pb.DeleteZoneRequest, studio_v1_layout_layout_common_pb.DeleteZoneResponse> {
    path: "/signage.studio.v1.layout.LayoutService/DeleteZone";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.DeleteZoneRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.DeleteZoneRequest>;
    responseSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.DeleteZoneResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.DeleteZoneResponse>;
}
interface ILayoutServiceService_IAddPlaylistBlock extends grpc.MethodDefinition<studio_v1_layout_layout_common_pb.AddPlaylistBlockRequest, studio_v1_layout_layout_common_pb.PlaylistBlockResponse> {
    path: "/signage.studio.v1.layout.LayoutService/AddPlaylistBlock";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.AddPlaylistBlockRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.AddPlaylistBlockRequest>;
    responseSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.PlaylistBlockResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.PlaylistBlockResponse>;
}
interface ILayoutServiceService_IAddMediaBlock extends grpc.MethodDefinition<studio_v1_layout_layout_common_pb.AddMediaBlockRequest, studio_v1_layout_layout_common_pb.PlaylistBlockResponse> {
    path: "/signage.studio.v1.layout.LayoutService/AddMediaBlock";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.AddMediaBlockRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.AddMediaBlockRequest>;
    responseSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.PlaylistBlockResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.PlaylistBlockResponse>;
}
interface ILayoutServiceService_IUpdatePlaylistBlock extends grpc.MethodDefinition<studio_v1_layout_layout_common_pb.UpdatePlaylistBlockRequest, studio_v1_layout_layout_common_pb.PlaylistBlockResponse> {
    path: "/signage.studio.v1.layout.LayoutService/UpdatePlaylistBlock";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.UpdatePlaylistBlockRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.UpdatePlaylistBlockRequest>;
    responseSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.PlaylistBlockResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.PlaylistBlockResponse>;
}
interface ILayoutServiceService_IRemovePlaylistBlock extends grpc.MethodDefinition<studio_v1_layout_layout_common_pb.RemovePlaylistBlockRequest, studio_v1_layout_layout_common_pb.PlaylistBlockResponse> {
    path: "/signage.studio.v1.layout.LayoutService/RemovePlaylistBlock";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.RemovePlaylistBlockRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.RemovePlaylistBlockRequest>;
    responseSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.PlaylistBlockResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.PlaylistBlockResponse>;
}
interface ILayoutServiceService_ISetPlaylistItemOverride extends grpc.MethodDefinition<studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideRequest, studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideResponse> {
    path: "/signage.studio.v1.layout.LayoutService/SetPlaylistItemOverride";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideRequest>;
    responseSerialize: grpc.serialize<studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideResponse>;
}

export const LayoutServiceService: ILayoutServiceService;

export interface ILayoutServiceServer extends grpc.UntypedServiceImplementation {
    createLayout: grpc.handleUnaryCall<studio_v1_layout_layout_common_pb.CreateLayoutRequest, studio_v1_layout_layout_common_pb.Layout>;
    getLayout: grpc.handleUnaryCall<studio_v1_layout_layout_common_pb.GetLayoutRequest, studio_v1_layout_layout_common_pb.Layout>;
    listLayouts: grpc.handleUnaryCall<studio_v1_layout_layout_common_pb.ListLayoutsRequest, studio_v1_layout_layout_common_pb.ListLayoutsResponse>;
    updateLayout: grpc.handleUnaryCall<studio_v1_layout_layout_common_pb.UpdateLayoutRequest, studio_v1_layout_layout_common_pb.Layout>;
    deleteLayout: grpc.handleUnaryCall<studio_v1_layout_layout_common_pb.DeleteLayoutRequest, studio_v1_layout_layout_common_pb.DeleteLayoutResponse>;
    createZone: grpc.handleUnaryCall<studio_v1_layout_layout_common_pb.CreateZoneRequest, studio_v1_layout_layout_common_pb.Zone>;
    getZone: grpc.handleUnaryCall<studio_v1_layout_layout_common_pb.GetZoneRequest, studio_v1_layout_layout_common_pb.Zone>;
    updateZone: grpc.handleUnaryCall<studio_v1_layout_layout_common_pb.UpdateZoneRequest, studio_v1_layout_layout_common_pb.Zone>;
    deleteZone: grpc.handleUnaryCall<studio_v1_layout_layout_common_pb.DeleteZoneRequest, studio_v1_layout_layout_common_pb.DeleteZoneResponse>;
    addPlaylistBlock: grpc.handleUnaryCall<studio_v1_layout_layout_common_pb.AddPlaylistBlockRequest, studio_v1_layout_layout_common_pb.PlaylistBlockResponse>;
    addMediaBlock: grpc.handleUnaryCall<studio_v1_layout_layout_common_pb.AddMediaBlockRequest, studio_v1_layout_layout_common_pb.PlaylistBlockResponse>;
    updatePlaylistBlock: grpc.handleUnaryCall<studio_v1_layout_layout_common_pb.UpdatePlaylistBlockRequest, studio_v1_layout_layout_common_pb.PlaylistBlockResponse>;
    removePlaylistBlock: grpc.handleUnaryCall<studio_v1_layout_layout_common_pb.RemovePlaylistBlockRequest, studio_v1_layout_layout_common_pb.PlaylistBlockResponse>;
    setPlaylistItemOverride: grpc.handleUnaryCall<studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideRequest, studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideResponse>;
}

export interface ILayoutServiceClient {
    createLayout(request: studio_v1_layout_layout_common_pb.CreateLayoutRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    createLayout(request: studio_v1_layout_layout_common_pb.CreateLayoutRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    createLayout(request: studio_v1_layout_layout_common_pb.CreateLayoutRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    getLayout(request: studio_v1_layout_layout_common_pb.GetLayoutRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    getLayout(request: studio_v1_layout_layout_common_pb.GetLayoutRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    getLayout(request: studio_v1_layout_layout_common_pb.GetLayoutRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    listLayouts(request: studio_v1_layout_layout_common_pb.ListLayoutsRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.ListLayoutsResponse) => void): grpc.ClientUnaryCall;
    listLayouts(request: studio_v1_layout_layout_common_pb.ListLayoutsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.ListLayoutsResponse) => void): grpc.ClientUnaryCall;
    listLayouts(request: studio_v1_layout_layout_common_pb.ListLayoutsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.ListLayoutsResponse) => void): grpc.ClientUnaryCall;
    updateLayout(request: studio_v1_layout_layout_common_pb.UpdateLayoutRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    updateLayout(request: studio_v1_layout_layout_common_pb.UpdateLayoutRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    updateLayout(request: studio_v1_layout_layout_common_pb.UpdateLayoutRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    deleteLayout(request: studio_v1_layout_layout_common_pb.DeleteLayoutRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.DeleteLayoutResponse) => void): grpc.ClientUnaryCall;
    deleteLayout(request: studio_v1_layout_layout_common_pb.DeleteLayoutRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.DeleteLayoutResponse) => void): grpc.ClientUnaryCall;
    deleteLayout(request: studio_v1_layout_layout_common_pb.DeleteLayoutRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.DeleteLayoutResponse) => void): grpc.ClientUnaryCall;
    createZone(request: studio_v1_layout_layout_common_pb.CreateZoneRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    createZone(request: studio_v1_layout_layout_common_pb.CreateZoneRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    createZone(request: studio_v1_layout_layout_common_pb.CreateZoneRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    getZone(request: studio_v1_layout_layout_common_pb.GetZoneRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    getZone(request: studio_v1_layout_layout_common_pb.GetZoneRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    getZone(request: studio_v1_layout_layout_common_pb.GetZoneRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    updateZone(request: studio_v1_layout_layout_common_pb.UpdateZoneRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    updateZone(request: studio_v1_layout_layout_common_pb.UpdateZoneRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    updateZone(request: studio_v1_layout_layout_common_pb.UpdateZoneRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    deleteZone(request: studio_v1_layout_layout_common_pb.DeleteZoneRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.DeleteZoneResponse) => void): grpc.ClientUnaryCall;
    deleteZone(request: studio_v1_layout_layout_common_pb.DeleteZoneRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.DeleteZoneResponse) => void): grpc.ClientUnaryCall;
    deleteZone(request: studio_v1_layout_layout_common_pb.DeleteZoneRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.DeleteZoneResponse) => void): grpc.ClientUnaryCall;
    addPlaylistBlock(request: studio_v1_layout_layout_common_pb.AddPlaylistBlockRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    addPlaylistBlock(request: studio_v1_layout_layout_common_pb.AddPlaylistBlockRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    addPlaylistBlock(request: studio_v1_layout_layout_common_pb.AddPlaylistBlockRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    addMediaBlock(request: studio_v1_layout_layout_common_pb.AddMediaBlockRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    addMediaBlock(request: studio_v1_layout_layout_common_pb.AddMediaBlockRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    addMediaBlock(request: studio_v1_layout_layout_common_pb.AddMediaBlockRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    updatePlaylistBlock(request: studio_v1_layout_layout_common_pb.UpdatePlaylistBlockRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    updatePlaylistBlock(request: studio_v1_layout_layout_common_pb.UpdatePlaylistBlockRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    updatePlaylistBlock(request: studio_v1_layout_layout_common_pb.UpdatePlaylistBlockRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    removePlaylistBlock(request: studio_v1_layout_layout_common_pb.RemovePlaylistBlockRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    removePlaylistBlock(request: studio_v1_layout_layout_common_pb.RemovePlaylistBlockRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    removePlaylistBlock(request: studio_v1_layout_layout_common_pb.RemovePlaylistBlockRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    setPlaylistItemOverride(request: studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideResponse) => void): grpc.ClientUnaryCall;
    setPlaylistItemOverride(request: studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideResponse) => void): grpc.ClientUnaryCall;
    setPlaylistItemOverride(request: studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideResponse) => void): grpc.ClientUnaryCall;
}

export class LayoutServiceClient extends grpc.Client implements ILayoutServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createLayout(request: studio_v1_layout_layout_common_pb.CreateLayoutRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    public createLayout(request: studio_v1_layout_layout_common_pb.CreateLayoutRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    public createLayout(request: studio_v1_layout_layout_common_pb.CreateLayoutRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    public getLayout(request: studio_v1_layout_layout_common_pb.GetLayoutRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    public getLayout(request: studio_v1_layout_layout_common_pb.GetLayoutRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    public getLayout(request: studio_v1_layout_layout_common_pb.GetLayoutRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    public listLayouts(request: studio_v1_layout_layout_common_pb.ListLayoutsRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.ListLayoutsResponse) => void): grpc.ClientUnaryCall;
    public listLayouts(request: studio_v1_layout_layout_common_pb.ListLayoutsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.ListLayoutsResponse) => void): grpc.ClientUnaryCall;
    public listLayouts(request: studio_v1_layout_layout_common_pb.ListLayoutsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.ListLayoutsResponse) => void): grpc.ClientUnaryCall;
    public updateLayout(request: studio_v1_layout_layout_common_pb.UpdateLayoutRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    public updateLayout(request: studio_v1_layout_layout_common_pb.UpdateLayoutRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    public updateLayout(request: studio_v1_layout_layout_common_pb.UpdateLayoutRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Layout) => void): grpc.ClientUnaryCall;
    public deleteLayout(request: studio_v1_layout_layout_common_pb.DeleteLayoutRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.DeleteLayoutResponse) => void): grpc.ClientUnaryCall;
    public deleteLayout(request: studio_v1_layout_layout_common_pb.DeleteLayoutRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.DeleteLayoutResponse) => void): grpc.ClientUnaryCall;
    public deleteLayout(request: studio_v1_layout_layout_common_pb.DeleteLayoutRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.DeleteLayoutResponse) => void): grpc.ClientUnaryCall;
    public createZone(request: studio_v1_layout_layout_common_pb.CreateZoneRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    public createZone(request: studio_v1_layout_layout_common_pb.CreateZoneRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    public createZone(request: studio_v1_layout_layout_common_pb.CreateZoneRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    public getZone(request: studio_v1_layout_layout_common_pb.GetZoneRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    public getZone(request: studio_v1_layout_layout_common_pb.GetZoneRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    public getZone(request: studio_v1_layout_layout_common_pb.GetZoneRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    public updateZone(request: studio_v1_layout_layout_common_pb.UpdateZoneRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    public updateZone(request: studio_v1_layout_layout_common_pb.UpdateZoneRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    public updateZone(request: studio_v1_layout_layout_common_pb.UpdateZoneRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.Zone) => void): grpc.ClientUnaryCall;
    public deleteZone(request: studio_v1_layout_layout_common_pb.DeleteZoneRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.DeleteZoneResponse) => void): grpc.ClientUnaryCall;
    public deleteZone(request: studio_v1_layout_layout_common_pb.DeleteZoneRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.DeleteZoneResponse) => void): grpc.ClientUnaryCall;
    public deleteZone(request: studio_v1_layout_layout_common_pb.DeleteZoneRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.DeleteZoneResponse) => void): grpc.ClientUnaryCall;
    public addPlaylistBlock(request: studio_v1_layout_layout_common_pb.AddPlaylistBlockRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    public addPlaylistBlock(request: studio_v1_layout_layout_common_pb.AddPlaylistBlockRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    public addPlaylistBlock(request: studio_v1_layout_layout_common_pb.AddPlaylistBlockRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    public addMediaBlock(request: studio_v1_layout_layout_common_pb.AddMediaBlockRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    public addMediaBlock(request: studio_v1_layout_layout_common_pb.AddMediaBlockRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    public addMediaBlock(request: studio_v1_layout_layout_common_pb.AddMediaBlockRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    public updatePlaylistBlock(request: studio_v1_layout_layout_common_pb.UpdatePlaylistBlockRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    public updatePlaylistBlock(request: studio_v1_layout_layout_common_pb.UpdatePlaylistBlockRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    public updatePlaylistBlock(request: studio_v1_layout_layout_common_pb.UpdatePlaylistBlockRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    public removePlaylistBlock(request: studio_v1_layout_layout_common_pb.RemovePlaylistBlockRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    public removePlaylistBlock(request: studio_v1_layout_layout_common_pb.RemovePlaylistBlockRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    public removePlaylistBlock(request: studio_v1_layout_layout_common_pb.RemovePlaylistBlockRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.PlaylistBlockResponse) => void): grpc.ClientUnaryCall;
    public setPlaylistItemOverride(request: studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideResponse) => void): grpc.ClientUnaryCall;
    public setPlaylistItemOverride(request: studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideResponse) => void): grpc.ClientUnaryCall;
    public setPlaylistItemOverride(request: studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideResponse) => void): grpc.ClientUnaryCall;
}
