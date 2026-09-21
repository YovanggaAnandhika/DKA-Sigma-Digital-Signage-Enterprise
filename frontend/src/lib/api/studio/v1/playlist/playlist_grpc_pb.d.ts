// package: signage.studio.v1.playlist
// file: studio/v1/playlist/playlist.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as studio_v1_playlist_playlist_pb from "../../../studio/v1/playlist/playlist_pb";
import * as studio_v1_playlist_playlist_common_pb from "../../../studio/v1/playlist/playlist.common_pb";

interface IPlaylistServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createPlaylist: IPlaylistServiceService_ICreatePlaylist;
    getPlaylist: IPlaylistServiceService_IGetPlaylist;
    listPlaylists: IPlaylistServiceService_IListPlaylists;
    updatePlaylist: IPlaylistServiceService_IUpdatePlaylist;
    deletePlaylist: IPlaylistServiceService_IDeletePlaylist;
    addPlaylistItem: IPlaylistServiceService_IAddPlaylistItem;
    updatePlaylistItem: IPlaylistServiceService_IUpdatePlaylistItem;
    removePlaylistItem: IPlaylistServiceService_IRemovePlaylistItem;
    reorderPlaylistItems: IPlaylistServiceService_IReorderPlaylistItems;
}

interface IPlaylistServiceService_ICreatePlaylist extends grpc.MethodDefinition<studio_v1_playlist_playlist_common_pb.CreatePlaylistRequest, studio_v1_playlist_playlist_common_pb.Playlist> {
    path: "/signage.studio.v1.playlist.PlaylistService/CreatePlaylist";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.CreatePlaylistRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.CreatePlaylistRequest>;
    responseSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.Playlist>;
    responseDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.Playlist>;
}
interface IPlaylistServiceService_IGetPlaylist extends grpc.MethodDefinition<studio_v1_playlist_playlist_common_pb.GetPlaylistRequest, studio_v1_playlist_playlist_common_pb.Playlist> {
    path: "/signage.studio.v1.playlist.PlaylistService/GetPlaylist";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.GetPlaylistRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.GetPlaylistRequest>;
    responseSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.Playlist>;
    responseDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.Playlist>;
}
interface IPlaylistServiceService_IListPlaylists extends grpc.MethodDefinition<studio_v1_playlist_playlist_common_pb.ListPlaylistsRequest, studio_v1_playlist_playlist_common_pb.ListPlaylistsResponse> {
    path: "/signage.studio.v1.playlist.PlaylistService/ListPlaylists";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.ListPlaylistsRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.ListPlaylistsRequest>;
    responseSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.ListPlaylistsResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.ListPlaylistsResponse>;
}
interface IPlaylistServiceService_IUpdatePlaylist extends grpc.MethodDefinition<studio_v1_playlist_playlist_common_pb.UpdatePlaylistRequest, studio_v1_playlist_playlist_common_pb.Playlist> {
    path: "/signage.studio.v1.playlist.PlaylistService/UpdatePlaylist";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.UpdatePlaylistRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.UpdatePlaylistRequest>;
    responseSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.Playlist>;
    responseDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.Playlist>;
}
interface IPlaylistServiceService_IDeletePlaylist extends grpc.MethodDefinition<studio_v1_playlist_playlist_common_pb.DeletePlaylistRequest, studio_v1_playlist_playlist_common_pb.DeletePlaylistResponse> {
    path: "/signage.studio.v1.playlist.PlaylistService/DeletePlaylist";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.DeletePlaylistRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.DeletePlaylistRequest>;
    responseSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.DeletePlaylistResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.DeletePlaylistResponse>;
}
interface IPlaylistServiceService_IAddPlaylistItem extends grpc.MethodDefinition<studio_v1_playlist_playlist_common_pb.AddPlaylistItemRequest, studio_v1_playlist_playlist_common_pb.PlaylistItem> {
    path: "/signage.studio.v1.playlist.PlaylistService/AddPlaylistItem";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.AddPlaylistItemRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.AddPlaylistItemRequest>;
    responseSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.PlaylistItem>;
    responseDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.PlaylistItem>;
}
interface IPlaylistServiceService_IUpdatePlaylistItem extends grpc.MethodDefinition<studio_v1_playlist_playlist_common_pb.UpdatePlaylistItemRequest, studio_v1_playlist_playlist_common_pb.PlaylistItem> {
    path: "/signage.studio.v1.playlist.PlaylistService/UpdatePlaylistItem";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.UpdatePlaylistItemRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.UpdatePlaylistItemRequest>;
    responseSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.PlaylistItem>;
    responseDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.PlaylistItem>;
}
interface IPlaylistServiceService_IRemovePlaylistItem extends grpc.MethodDefinition<studio_v1_playlist_playlist_common_pb.RemovePlaylistItemRequest, studio_v1_playlist_playlist_common_pb.RemovePlaylistItemResponse> {
    path: "/signage.studio.v1.playlist.PlaylistService/RemovePlaylistItem";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.RemovePlaylistItemRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.RemovePlaylistItemRequest>;
    responseSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.RemovePlaylistItemResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.RemovePlaylistItemResponse>;
}
interface IPlaylistServiceService_IReorderPlaylistItems extends grpc.MethodDefinition<studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsRequest, studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsResponse> {
    path: "/signage.studio.v1.playlist.PlaylistService/ReorderPlaylistItems";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsRequest>;
    responseSerialize: grpc.serialize<studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsResponse>;
}

export const PlaylistServiceService: IPlaylistServiceService;

export interface IPlaylistServiceServer extends grpc.UntypedServiceImplementation {
    createPlaylist: grpc.handleUnaryCall<studio_v1_playlist_playlist_common_pb.CreatePlaylistRequest, studio_v1_playlist_playlist_common_pb.Playlist>;
    getPlaylist: grpc.handleUnaryCall<studio_v1_playlist_playlist_common_pb.GetPlaylistRequest, studio_v1_playlist_playlist_common_pb.Playlist>;
    listPlaylists: grpc.handleUnaryCall<studio_v1_playlist_playlist_common_pb.ListPlaylistsRequest, studio_v1_playlist_playlist_common_pb.ListPlaylistsResponse>;
    updatePlaylist: grpc.handleUnaryCall<studio_v1_playlist_playlist_common_pb.UpdatePlaylistRequest, studio_v1_playlist_playlist_common_pb.Playlist>;
    deletePlaylist: grpc.handleUnaryCall<studio_v1_playlist_playlist_common_pb.DeletePlaylistRequest, studio_v1_playlist_playlist_common_pb.DeletePlaylistResponse>;
    addPlaylistItem: grpc.handleUnaryCall<studio_v1_playlist_playlist_common_pb.AddPlaylistItemRequest, studio_v1_playlist_playlist_common_pb.PlaylistItem>;
    updatePlaylistItem: grpc.handleUnaryCall<studio_v1_playlist_playlist_common_pb.UpdatePlaylistItemRequest, studio_v1_playlist_playlist_common_pb.PlaylistItem>;
    removePlaylistItem: grpc.handleUnaryCall<studio_v1_playlist_playlist_common_pb.RemovePlaylistItemRequest, studio_v1_playlist_playlist_common_pb.RemovePlaylistItemResponse>;
    reorderPlaylistItems: grpc.handleUnaryCall<studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsRequest, studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsResponse>;
}

export interface IPlaylistServiceClient {
    createPlaylist(request: studio_v1_playlist_playlist_common_pb.CreatePlaylistRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    createPlaylist(request: studio_v1_playlist_playlist_common_pb.CreatePlaylistRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    createPlaylist(request: studio_v1_playlist_playlist_common_pb.CreatePlaylistRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    getPlaylist(request: studio_v1_playlist_playlist_common_pb.GetPlaylistRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    getPlaylist(request: studio_v1_playlist_playlist_common_pb.GetPlaylistRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    getPlaylist(request: studio_v1_playlist_playlist_common_pb.GetPlaylistRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    listPlaylists(request: studio_v1_playlist_playlist_common_pb.ListPlaylistsRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.ListPlaylistsResponse) => void): grpc.ClientUnaryCall;
    listPlaylists(request: studio_v1_playlist_playlist_common_pb.ListPlaylistsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.ListPlaylistsResponse) => void): grpc.ClientUnaryCall;
    listPlaylists(request: studio_v1_playlist_playlist_common_pb.ListPlaylistsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.ListPlaylistsResponse) => void): grpc.ClientUnaryCall;
    updatePlaylist(request: studio_v1_playlist_playlist_common_pb.UpdatePlaylistRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    updatePlaylist(request: studio_v1_playlist_playlist_common_pb.UpdatePlaylistRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    updatePlaylist(request: studio_v1_playlist_playlist_common_pb.UpdatePlaylistRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    deletePlaylist(request: studio_v1_playlist_playlist_common_pb.DeletePlaylistRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.DeletePlaylistResponse) => void): grpc.ClientUnaryCall;
    deletePlaylist(request: studio_v1_playlist_playlist_common_pb.DeletePlaylistRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.DeletePlaylistResponse) => void): grpc.ClientUnaryCall;
    deletePlaylist(request: studio_v1_playlist_playlist_common_pb.DeletePlaylistRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.DeletePlaylistResponse) => void): grpc.ClientUnaryCall;
    addPlaylistItem(request: studio_v1_playlist_playlist_common_pb.AddPlaylistItemRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.PlaylistItem) => void): grpc.ClientUnaryCall;
    addPlaylistItem(request: studio_v1_playlist_playlist_common_pb.AddPlaylistItemRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.PlaylistItem) => void): grpc.ClientUnaryCall;
    addPlaylistItem(request: studio_v1_playlist_playlist_common_pb.AddPlaylistItemRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.PlaylistItem) => void): grpc.ClientUnaryCall;
    updatePlaylistItem(request: studio_v1_playlist_playlist_common_pb.UpdatePlaylistItemRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.PlaylistItem) => void): grpc.ClientUnaryCall;
    updatePlaylistItem(request: studio_v1_playlist_playlist_common_pb.UpdatePlaylistItemRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.PlaylistItem) => void): grpc.ClientUnaryCall;
    updatePlaylistItem(request: studio_v1_playlist_playlist_common_pb.UpdatePlaylistItemRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.PlaylistItem) => void): grpc.ClientUnaryCall;
    removePlaylistItem(request: studio_v1_playlist_playlist_common_pb.RemovePlaylistItemRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.RemovePlaylistItemResponse) => void): grpc.ClientUnaryCall;
    removePlaylistItem(request: studio_v1_playlist_playlist_common_pb.RemovePlaylistItemRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.RemovePlaylistItemResponse) => void): grpc.ClientUnaryCall;
    removePlaylistItem(request: studio_v1_playlist_playlist_common_pb.RemovePlaylistItemRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.RemovePlaylistItemResponse) => void): grpc.ClientUnaryCall;
    reorderPlaylistItems(request: studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsResponse) => void): grpc.ClientUnaryCall;
    reorderPlaylistItems(request: studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsResponse) => void): grpc.ClientUnaryCall;
    reorderPlaylistItems(request: studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsResponse) => void): grpc.ClientUnaryCall;
}

export class PlaylistServiceClient extends grpc.Client implements IPlaylistServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createPlaylist(request: studio_v1_playlist_playlist_common_pb.CreatePlaylistRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    public createPlaylist(request: studio_v1_playlist_playlist_common_pb.CreatePlaylistRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    public createPlaylist(request: studio_v1_playlist_playlist_common_pb.CreatePlaylistRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    public getPlaylist(request: studio_v1_playlist_playlist_common_pb.GetPlaylistRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    public getPlaylist(request: studio_v1_playlist_playlist_common_pb.GetPlaylistRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    public getPlaylist(request: studio_v1_playlist_playlist_common_pb.GetPlaylistRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    public listPlaylists(request: studio_v1_playlist_playlist_common_pb.ListPlaylistsRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.ListPlaylistsResponse) => void): grpc.ClientUnaryCall;
    public listPlaylists(request: studio_v1_playlist_playlist_common_pb.ListPlaylistsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.ListPlaylistsResponse) => void): grpc.ClientUnaryCall;
    public listPlaylists(request: studio_v1_playlist_playlist_common_pb.ListPlaylistsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.ListPlaylistsResponse) => void): grpc.ClientUnaryCall;
    public updatePlaylist(request: studio_v1_playlist_playlist_common_pb.UpdatePlaylistRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    public updatePlaylist(request: studio_v1_playlist_playlist_common_pb.UpdatePlaylistRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    public updatePlaylist(request: studio_v1_playlist_playlist_common_pb.UpdatePlaylistRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.Playlist) => void): grpc.ClientUnaryCall;
    public deletePlaylist(request: studio_v1_playlist_playlist_common_pb.DeletePlaylistRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.DeletePlaylistResponse) => void): grpc.ClientUnaryCall;
    public deletePlaylist(request: studio_v1_playlist_playlist_common_pb.DeletePlaylistRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.DeletePlaylistResponse) => void): grpc.ClientUnaryCall;
    public deletePlaylist(request: studio_v1_playlist_playlist_common_pb.DeletePlaylistRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.DeletePlaylistResponse) => void): grpc.ClientUnaryCall;
    public addPlaylistItem(request: studio_v1_playlist_playlist_common_pb.AddPlaylistItemRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.PlaylistItem) => void): grpc.ClientUnaryCall;
    public addPlaylistItem(request: studio_v1_playlist_playlist_common_pb.AddPlaylistItemRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.PlaylistItem) => void): grpc.ClientUnaryCall;
    public addPlaylistItem(request: studio_v1_playlist_playlist_common_pb.AddPlaylistItemRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.PlaylistItem) => void): grpc.ClientUnaryCall;
    public updatePlaylistItem(request: studio_v1_playlist_playlist_common_pb.UpdatePlaylistItemRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.PlaylistItem) => void): grpc.ClientUnaryCall;
    public updatePlaylistItem(request: studio_v1_playlist_playlist_common_pb.UpdatePlaylistItemRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.PlaylistItem) => void): grpc.ClientUnaryCall;
    public updatePlaylistItem(request: studio_v1_playlist_playlist_common_pb.UpdatePlaylistItemRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.PlaylistItem) => void): grpc.ClientUnaryCall;
    public removePlaylistItem(request: studio_v1_playlist_playlist_common_pb.RemovePlaylistItemRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.RemovePlaylistItemResponse) => void): grpc.ClientUnaryCall;
    public removePlaylistItem(request: studio_v1_playlist_playlist_common_pb.RemovePlaylistItemRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.RemovePlaylistItemResponse) => void): grpc.ClientUnaryCall;
    public removePlaylistItem(request: studio_v1_playlist_playlist_common_pb.RemovePlaylistItemRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.RemovePlaylistItemResponse) => void): grpc.ClientUnaryCall;
    public reorderPlaylistItems(request: studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsResponse) => void): grpc.ClientUnaryCall;
    public reorderPlaylistItems(request: studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsResponse) => void): grpc.ClientUnaryCall;
    public reorderPlaylistItems(request: studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsResponse) => void): grpc.ClientUnaryCall;
}
