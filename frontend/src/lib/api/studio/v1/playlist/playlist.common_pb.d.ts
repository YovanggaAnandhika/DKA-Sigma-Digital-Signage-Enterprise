// package: signage.studio.v1.playlist
// file: studio/v1/playlist/playlist.common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as common_v1_types_pb from "../../../common/v1/types_pb";
import * as studio_v1_media_media_common_pb from "../../../studio/v1/media/media.common_pb";

export class PlaylistItem extends jspb.Message { 
    getId(): string;
    setId(value: string): PlaylistItem;
    getPlaylistId(): string;
    setPlaylistId(value: string): PlaylistItem;
    getMediaItemId(): string;
    setMediaItemId(value: string): PlaylistItem;

    hasMediaItem(): boolean;
    clearMediaItem(): void;
    getMediaItem(): studio_v1_media_media_common_pb.MediaItem | undefined;
    setMediaItem(value?: studio_v1_media_media_common_pb.MediaItem): PlaylistItem;
    getPosition(): number;
    setPosition(value: number): PlaylistItem;
    getDurationSeconds(): number;
    setDurationSeconds(value: number): PlaylistItem;
    getTransitionType(): string;
    setTransitionType(value: string): PlaylistItem;
    getCreatedAt(): string;
    setCreatedAt(value: string): PlaylistItem;
    getIsMuted(): boolean;
    setIsMuted(value: boolean): PlaylistItem;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlaylistItem.AsObject;
    static toObject(includeInstance: boolean, msg: PlaylistItem): PlaylistItem.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlaylistItem, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlaylistItem;
    static deserializeBinaryFromReader(message: PlaylistItem, reader: jspb.BinaryReader): PlaylistItem;
}

export namespace PlaylistItem {
    export type AsObject = {
        id: string,
        playlistId: string,
        mediaItemId: string,
        mediaItem?: studio_v1_media_media_common_pb.MediaItem.AsObject,
        position: number,
        durationSeconds: number,
        transitionType: string,
        createdAt: string,
        isMuted: boolean,
    }
}

export class Playlist extends jspb.Message { 
    getId(): string;
    setId(value: string): Playlist;
    getName(): string;
    setName(value: string): Playlist;
    getDescription(): string;
    setDescription(value: string): Playlist;
    getIsShuffle(): boolean;
    setIsShuffle(value: boolean): Playlist;
    clearItemsList(): void;
    getItemsList(): Array<PlaylistItem>;
    setItemsList(value: Array<PlaylistItem>): Playlist;
    addItems(value?: PlaylistItem, index?: number): PlaylistItem;
    getTotalDurationSeconds(): number;
    setTotalDurationSeconds(value: number): Playlist;
    getCreatedAt(): string;
    setCreatedAt(value: string): Playlist;
    getUpdatedAt(): string;
    setUpdatedAt(value: string): Playlist;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Playlist.AsObject;
    static toObject(includeInstance: boolean, msg: Playlist): Playlist.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Playlist, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Playlist;
    static deserializeBinaryFromReader(message: Playlist, reader: jspb.BinaryReader): Playlist;
}

export namespace Playlist {
    export type AsObject = {
        id: string,
        name: string,
        description: string,
        isShuffle: boolean,
        itemsList: Array<PlaylistItem.AsObject>,
        totalDurationSeconds: number,
        createdAt: string,
        updatedAt: string,
    }
}

export class CreatePlaylistRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreatePlaylistRequest;
    getDescription(): string;
    setDescription(value: string): CreatePlaylistRequest;
    getIsShuffle(): boolean;
    setIsShuffle(value: boolean): CreatePlaylistRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreatePlaylistRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreatePlaylistRequest): CreatePlaylistRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreatePlaylistRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreatePlaylistRequest;
    static deserializeBinaryFromReader(message: CreatePlaylistRequest, reader: jspb.BinaryReader): CreatePlaylistRequest;
}

export namespace CreatePlaylistRequest {
    export type AsObject = {
        name: string,
        description: string,
        isShuffle: boolean,
    }
}

export class GetPlaylistRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): GetPlaylistRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetPlaylistRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetPlaylistRequest): GetPlaylistRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetPlaylistRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetPlaylistRequest;
    static deserializeBinaryFromReader(message: GetPlaylistRequest, reader: jspb.BinaryReader): GetPlaylistRequest;
}

export namespace GetPlaylistRequest {
    export type AsObject = {
        id: string,
    }
}

export class ListPlaylistsRequest extends jspb.Message { 

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationRequest | undefined;
    setPagination(value?: common_v1_types_pb.PaginationRequest): ListPlaylistsRequest;
    getSearch(): string;
    setSearch(value: string): ListPlaylistsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListPlaylistsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListPlaylistsRequest): ListPlaylistsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListPlaylistsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListPlaylistsRequest;
    static deserializeBinaryFromReader(message: ListPlaylistsRequest, reader: jspb.BinaryReader): ListPlaylistsRequest;
}

export namespace ListPlaylistsRequest {
    export type AsObject = {
        pagination?: common_v1_types_pb.PaginationRequest.AsObject,
        search: string,
    }
}

export class ListPlaylistsResponse extends jspb.Message { 
    clearItemsList(): void;
    getItemsList(): Array<Playlist>;
    setItemsList(value: Array<Playlist>): ListPlaylistsResponse;
    addItems(value?: Playlist, index?: number): Playlist;

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationResponse | undefined;
    setPagination(value?: common_v1_types_pb.PaginationResponse): ListPlaylistsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListPlaylistsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListPlaylistsResponse): ListPlaylistsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListPlaylistsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListPlaylistsResponse;
    static deserializeBinaryFromReader(message: ListPlaylistsResponse, reader: jspb.BinaryReader): ListPlaylistsResponse;
}

export namespace ListPlaylistsResponse {
    export type AsObject = {
        itemsList: Array<Playlist.AsObject>,
        pagination?: common_v1_types_pb.PaginationResponse.AsObject,
    }
}

export class UpdatePlaylistRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): UpdatePlaylistRequest;
    getName(): string;
    setName(value: string): UpdatePlaylistRequest;
    getDescription(): string;
    setDescription(value: string): UpdatePlaylistRequest;
    getIsShuffle(): boolean;
    setIsShuffle(value: boolean): UpdatePlaylistRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdatePlaylistRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdatePlaylistRequest): UpdatePlaylistRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdatePlaylistRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdatePlaylistRequest;
    static deserializeBinaryFromReader(message: UpdatePlaylistRequest, reader: jspb.BinaryReader): UpdatePlaylistRequest;
}

export namespace UpdatePlaylistRequest {
    export type AsObject = {
        id: string,
        name: string,
        description: string,
        isShuffle: boolean,
    }
}

export class DeletePlaylistRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): DeletePlaylistRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeletePlaylistRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeletePlaylistRequest): DeletePlaylistRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeletePlaylistRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeletePlaylistRequest;
    static deserializeBinaryFromReader(message: DeletePlaylistRequest, reader: jspb.BinaryReader): DeletePlaylistRequest;
}

export namespace DeletePlaylistRequest {
    export type AsObject = {
        id: string,
    }
}

export class DeletePlaylistResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): DeletePlaylistResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeletePlaylistResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeletePlaylistResponse): DeletePlaylistResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeletePlaylistResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeletePlaylistResponse;
    static deserializeBinaryFromReader(message: DeletePlaylistResponse, reader: jspb.BinaryReader): DeletePlaylistResponse;
}

export namespace DeletePlaylistResponse {
    export type AsObject = {
        success: boolean,
    }
}

export class AddPlaylistItemRequest extends jspb.Message { 
    getPlaylistId(): string;
    setPlaylistId(value: string): AddPlaylistItemRequest;
    getMediaItemId(): string;
    setMediaItemId(value: string): AddPlaylistItemRequest;
    getDurationSeconds(): number;
    setDurationSeconds(value: number): AddPlaylistItemRequest;
    getTransitionType(): string;
    setTransitionType(value: string): AddPlaylistItemRequest;
    getPosition(): number;
    setPosition(value: number): AddPlaylistItemRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddPlaylistItemRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AddPlaylistItemRequest): AddPlaylistItemRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddPlaylistItemRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddPlaylistItemRequest;
    static deserializeBinaryFromReader(message: AddPlaylistItemRequest, reader: jspb.BinaryReader): AddPlaylistItemRequest;
}

export namespace AddPlaylistItemRequest {
    export type AsObject = {
        playlistId: string,
        mediaItemId: string,
        durationSeconds: number,
        transitionType: string,
        position: number,
    }
}

export class UpdatePlaylistItemRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): UpdatePlaylistItemRequest;
    getDurationSeconds(): number;
    setDurationSeconds(value: number): UpdatePlaylistItemRequest;
    getTransitionType(): string;
    setTransitionType(value: string): UpdatePlaylistItemRequest;
    getPosition(): number;
    setPosition(value: number): UpdatePlaylistItemRequest;

    hasIsMuted(): boolean;
    clearIsMuted(): void;
    getIsMuted(): boolean | undefined;
    setIsMuted(value: boolean): UpdatePlaylistItemRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdatePlaylistItemRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdatePlaylistItemRequest): UpdatePlaylistItemRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdatePlaylistItemRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdatePlaylistItemRequest;
    static deserializeBinaryFromReader(message: UpdatePlaylistItemRequest, reader: jspb.BinaryReader): UpdatePlaylistItemRequest;
}

export namespace UpdatePlaylistItemRequest {
    export type AsObject = {
        id: string,
        durationSeconds: number,
        transitionType: string,
        position: number,
        isMuted?: boolean,
    }
}

export class RemovePlaylistItemRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): RemovePlaylistItemRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RemovePlaylistItemRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RemovePlaylistItemRequest): RemovePlaylistItemRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RemovePlaylistItemRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RemovePlaylistItemRequest;
    static deserializeBinaryFromReader(message: RemovePlaylistItemRequest, reader: jspb.BinaryReader): RemovePlaylistItemRequest;
}

export namespace RemovePlaylistItemRequest {
    export type AsObject = {
        id: string,
    }
}

export class RemovePlaylistItemResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): RemovePlaylistItemResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RemovePlaylistItemResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RemovePlaylistItemResponse): RemovePlaylistItemResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RemovePlaylistItemResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RemovePlaylistItemResponse;
    static deserializeBinaryFromReader(message: RemovePlaylistItemResponse, reader: jspb.BinaryReader): RemovePlaylistItemResponse;
}

export namespace RemovePlaylistItemResponse {
    export type AsObject = {
        success: boolean,
    }
}

export class ReorderPlaylistItemsRequest extends jspb.Message { 
    getPlaylistId(): string;
    setPlaylistId(value: string): ReorderPlaylistItemsRequest;
    clearItemIdsInOrderList(): void;
    getItemIdsInOrderList(): Array<string>;
    setItemIdsInOrderList(value: Array<string>): ReorderPlaylistItemsRequest;
    addItemIdsInOrder(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReorderPlaylistItemsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ReorderPlaylistItemsRequest): ReorderPlaylistItemsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReorderPlaylistItemsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReorderPlaylistItemsRequest;
    static deserializeBinaryFromReader(message: ReorderPlaylistItemsRequest, reader: jspb.BinaryReader): ReorderPlaylistItemsRequest;
}

export namespace ReorderPlaylistItemsRequest {
    export type AsObject = {
        playlistId: string,
        itemIdsInOrderList: Array<string>,
    }
}

export class ReorderPlaylistItemsResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): ReorderPlaylistItemsResponse;

    hasPlaylist(): boolean;
    clearPlaylist(): void;
    getPlaylist(): Playlist | undefined;
    setPlaylist(value?: Playlist): ReorderPlaylistItemsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReorderPlaylistItemsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ReorderPlaylistItemsResponse): ReorderPlaylistItemsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReorderPlaylistItemsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReorderPlaylistItemsResponse;
    static deserializeBinaryFromReader(message: ReorderPlaylistItemsResponse, reader: jspb.BinaryReader): ReorderPlaylistItemsResponse;
}

export namespace ReorderPlaylistItemsResponse {
    export type AsObject = {
        success: boolean,
        playlist?: Playlist.AsObject,
    }
}
