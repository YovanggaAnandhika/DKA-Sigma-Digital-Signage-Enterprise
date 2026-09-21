// package: signage.studio.v1.layout
// file: studio/v1/layout/layout.common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as common_v1_types_pb from "../../../common/v1/types_pb";
import * as hardware_v1_device_device_common_pb from "../../../hardware/v1/device/device.common_pb";
import * as studio_v1_playlist_playlist_common_pb from "../../../studio/v1/playlist/playlist.common_pb";
import * as studio_v1_media_media_common_pb from "../../../studio/v1/media/media.common_pb";

export class ZonePlaylistItemOverride extends jspb.Message { 
    getId(): string;
    setId(value: string): ZonePlaylistItemOverride;
    getZonePlaylistId(): string;
    setZonePlaylistId(value: string): ZonePlaylistItemOverride;
    getPlaylistItemId(): string;
    setPlaylistItemId(value: string): ZonePlaylistItemOverride;
    getIsMuted(): boolean;
    setIsMuted(value: boolean): ZonePlaylistItemOverride;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ZonePlaylistItemOverride.AsObject;
    static toObject(includeInstance: boolean, msg: ZonePlaylistItemOverride): ZonePlaylistItemOverride.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ZonePlaylistItemOverride, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ZonePlaylistItemOverride;
    static deserializeBinaryFromReader(message: ZonePlaylistItemOverride, reader: jspb.BinaryReader): ZonePlaylistItemOverride;
}

export namespace ZonePlaylistItemOverride {
    export type AsObject = {
        id: string,
        zonePlaylistId: string,
        playlistItemId: string,
        isMuted: boolean,
    }
}

export class Zone extends jspb.Message { 
    getId(): string;
    setId(value: string): Zone;
    getLayoutId(): string;
    setLayoutId(value: string): Zone;
    getName(): string;
    setName(value: string): Zone;
    getX(): number;
    setX(value: number): Zone;
    getY(): number;
    setY(value: number): Zone;
    getWidth(): number;
    setWidth(value: number): Zone;
    getHeight(): number;
    setHeight(value: number): Zone;
    getZIndex(): number;
    setZIndex(value: number): Zone;
    clearBlocksList(): void;
    getBlocksList(): Array<ZonePlaylist>;
    setBlocksList(value: Array<ZonePlaylist>): Zone;
    addBlocks(value?: ZonePlaylist, index?: number): ZonePlaylist;
    getBackgroundColor(): string;
    setBackgroundColor(value: string): Zone;
    getCreatedAt(): string;
    setCreatedAt(value: string): Zone;
    getUpdatedAt(): string;
    setUpdatedAt(value: string): Zone;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Zone.AsObject;
    static toObject(includeInstance: boolean, msg: Zone): Zone.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Zone, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Zone;
    static deserializeBinaryFromReader(message: Zone, reader: jspb.BinaryReader): Zone;
}

export namespace Zone {
    export type AsObject = {
        id: string,
        layoutId: string,
        name: string,
        x: number,
        y: number,
        width: number,
        height: number,
        zIndex: number,
        blocksList: Array<ZonePlaylist.AsObject>,
        backgroundColor: string,
        createdAt: string,
        updatedAt: string,
    }
}

export class ZonePlaylist extends jspb.Message { 
    getId(): string;
    setId(value: string): ZonePlaylist;
    getZoneId(): string;
    setZoneId(value: string): ZonePlaylist;
    getPlaylistId(): string;
    setPlaylistId(value: string): ZonePlaylist;

    hasPlaylist(): boolean;
    clearPlaylist(): void;
    getPlaylist(): studio_v1_playlist_playlist_common_pb.Playlist | undefined;
    setPlaylist(value?: studio_v1_playlist_playlist_common_pb.Playlist): ZonePlaylist;
    getStartTimeSeconds(): number;
    setStartTimeSeconds(value: number): ZonePlaylist;
    getDurationSeconds(): number;
    setDurationSeconds(value: number): ZonePlaylist;
    getTransitionType(): string;
    setTransitionType(value: string): ZonePlaylist;
    getOrderIndex(): number;
    setOrderIndex(value: number): ZonePlaylist;
    clearItemOverridesList(): void;
    getItemOverridesList(): Array<ZonePlaylistItemOverride>;
    setItemOverridesList(value: Array<ZonePlaylistItemOverride>): ZonePlaylist;
    addItemOverrides(value?: ZonePlaylistItemOverride, index?: number): ZonePlaylistItemOverride;
    getCreatedAt(): string;
    setCreatedAt(value: string): ZonePlaylist;
    getMediaItemId(): string;
    setMediaItemId(value: string): ZonePlaylist;

    hasMediaItem(): boolean;
    clearMediaItem(): void;
    getMediaItem(): studio_v1_media_media_common_pb.MediaItem | undefined;
    setMediaItem(value?: studio_v1_media_media_common_pb.MediaItem): ZonePlaylist;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ZonePlaylist.AsObject;
    static toObject(includeInstance: boolean, msg: ZonePlaylist): ZonePlaylist.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ZonePlaylist, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ZonePlaylist;
    static deserializeBinaryFromReader(message: ZonePlaylist, reader: jspb.BinaryReader): ZonePlaylist;
}

export namespace ZonePlaylist {
    export type AsObject = {
        id: string,
        zoneId: string,
        playlistId: string,
        playlist?: studio_v1_playlist_playlist_common_pb.Playlist.AsObject,
        startTimeSeconds: number,
        durationSeconds: number,
        transitionType: string,
        orderIndex: number,
        itemOverridesList: Array<ZonePlaylistItemOverride.AsObject>,
        createdAt: string,
        mediaItemId: string,
        mediaItem?: studio_v1_media_media_common_pb.MediaItem.AsObject,
    }
}

export class Layout extends jspb.Message { 
    getId(): string;
    setId(value: string): Layout;
    getName(): string;
    setName(value: string): Layout;
    getDescription(): string;
    setDescription(value: string): Layout;
    getCanvasWidth(): number;
    setCanvasWidth(value: number): Layout;
    getCanvasHeight(): number;
    setCanvasHeight(value: number): Layout;
    getOrientation(): hardware_v1_device_device_common_pb.DeviceOrientation;
    setOrientation(value: hardware_v1_device_device_common_pb.DeviceOrientation): Layout;
    getBackgroundColor(): string;
    setBackgroundColor(value: string): Layout;
    getBackgroundImageUrl(): string;
    setBackgroundImageUrl(value: string): Layout;
    clearZonesList(): void;
    getZonesList(): Array<Zone>;
    setZonesList(value: Array<Zone>): Layout;
    addZones(value?: Zone, index?: number): Zone;
    getCreatedAt(): string;
    setCreatedAt(value: string): Layout;
    getUpdatedAt(): string;
    setUpdatedAt(value: string): Layout;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Layout.AsObject;
    static toObject(includeInstance: boolean, msg: Layout): Layout.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Layout, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Layout;
    static deserializeBinaryFromReader(message: Layout, reader: jspb.BinaryReader): Layout;
}

export namespace Layout {
    export type AsObject = {
        id: string,
        name: string,
        description: string,
        canvasWidth: number,
        canvasHeight: number,
        orientation: hardware_v1_device_device_common_pb.DeviceOrientation,
        backgroundColor: string,
        backgroundImageUrl: string,
        zonesList: Array<Zone.AsObject>,
        createdAt: string,
        updatedAt: string,
    }
}

export class CreateLayoutRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateLayoutRequest;
    getDescription(): string;
    setDescription(value: string): CreateLayoutRequest;
    getCanvasWidth(): number;
    setCanvasWidth(value: number): CreateLayoutRequest;
    getCanvasHeight(): number;
    setCanvasHeight(value: number): CreateLayoutRequest;
    getOrientation(): hardware_v1_device_device_common_pb.DeviceOrientation;
    setOrientation(value: hardware_v1_device_device_common_pb.DeviceOrientation): CreateLayoutRequest;
    getBackgroundColor(): string;
    setBackgroundColor(value: string): CreateLayoutRequest;
    getBackgroundImageUrl(): string;
    setBackgroundImageUrl(value: string): CreateLayoutRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateLayoutRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateLayoutRequest): CreateLayoutRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateLayoutRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateLayoutRequest;
    static deserializeBinaryFromReader(message: CreateLayoutRequest, reader: jspb.BinaryReader): CreateLayoutRequest;
}

export namespace CreateLayoutRequest {
    export type AsObject = {
        name: string,
        description: string,
        canvasWidth: number,
        canvasHeight: number,
        orientation: hardware_v1_device_device_common_pb.DeviceOrientation,
        backgroundColor: string,
        backgroundImageUrl: string,
    }
}

export class GetLayoutRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): GetLayoutRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetLayoutRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetLayoutRequest): GetLayoutRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetLayoutRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetLayoutRequest;
    static deserializeBinaryFromReader(message: GetLayoutRequest, reader: jspb.BinaryReader): GetLayoutRequest;
}

export namespace GetLayoutRequest {
    export type AsObject = {
        id: string,
    }
}

export class ListLayoutsRequest extends jspb.Message { 

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationRequest | undefined;
    setPagination(value?: common_v1_types_pb.PaginationRequest): ListLayoutsRequest;
    getSearch(): string;
    setSearch(value: string): ListLayoutsRequest;
    getOrientation(): hardware_v1_device_device_common_pb.DeviceOrientation;
    setOrientation(value: hardware_v1_device_device_common_pb.DeviceOrientation): ListLayoutsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListLayoutsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListLayoutsRequest): ListLayoutsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListLayoutsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListLayoutsRequest;
    static deserializeBinaryFromReader(message: ListLayoutsRequest, reader: jspb.BinaryReader): ListLayoutsRequest;
}

export namespace ListLayoutsRequest {
    export type AsObject = {
        pagination?: common_v1_types_pb.PaginationRequest.AsObject,
        search: string,
        orientation: hardware_v1_device_device_common_pb.DeviceOrientation,
    }
}

export class ListLayoutsResponse extends jspb.Message { 
    clearItemsList(): void;
    getItemsList(): Array<Layout>;
    setItemsList(value: Array<Layout>): ListLayoutsResponse;
    addItems(value?: Layout, index?: number): Layout;

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationResponse | undefined;
    setPagination(value?: common_v1_types_pb.PaginationResponse): ListLayoutsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListLayoutsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListLayoutsResponse): ListLayoutsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListLayoutsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListLayoutsResponse;
    static deserializeBinaryFromReader(message: ListLayoutsResponse, reader: jspb.BinaryReader): ListLayoutsResponse;
}

export namespace ListLayoutsResponse {
    export type AsObject = {
        itemsList: Array<Layout.AsObject>,
        pagination?: common_v1_types_pb.PaginationResponse.AsObject,
    }
}

export class UpdateLayoutRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): UpdateLayoutRequest;
    getName(): string;
    setName(value: string): UpdateLayoutRequest;
    getDescription(): string;
    setDescription(value: string): UpdateLayoutRequest;
    getCanvasWidth(): number;
    setCanvasWidth(value: number): UpdateLayoutRequest;
    getCanvasHeight(): number;
    setCanvasHeight(value: number): UpdateLayoutRequest;
    getOrientation(): hardware_v1_device_device_common_pb.DeviceOrientation;
    setOrientation(value: hardware_v1_device_device_common_pb.DeviceOrientation): UpdateLayoutRequest;
    getBackgroundColor(): string;
    setBackgroundColor(value: string): UpdateLayoutRequest;
    getBackgroundImageUrl(): string;
    setBackgroundImageUrl(value: string): UpdateLayoutRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateLayoutRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateLayoutRequest): UpdateLayoutRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateLayoutRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateLayoutRequest;
    static deserializeBinaryFromReader(message: UpdateLayoutRequest, reader: jspb.BinaryReader): UpdateLayoutRequest;
}

export namespace UpdateLayoutRequest {
    export type AsObject = {
        id: string,
        name: string,
        description: string,
        canvasWidth: number,
        canvasHeight: number,
        orientation: hardware_v1_device_device_common_pb.DeviceOrientation,
        backgroundColor: string,
        backgroundImageUrl: string,
    }
}

export class DeleteLayoutRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): DeleteLayoutRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteLayoutRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteLayoutRequest): DeleteLayoutRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteLayoutRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteLayoutRequest;
    static deserializeBinaryFromReader(message: DeleteLayoutRequest, reader: jspb.BinaryReader): DeleteLayoutRequest;
}

export namespace DeleteLayoutRequest {
    export type AsObject = {
        id: string,
    }
}

export class DeleteLayoutResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): DeleteLayoutResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteLayoutResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteLayoutResponse): DeleteLayoutResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteLayoutResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteLayoutResponse;
    static deserializeBinaryFromReader(message: DeleteLayoutResponse, reader: jspb.BinaryReader): DeleteLayoutResponse;
}

export namespace DeleteLayoutResponse {
    export type AsObject = {
        success: boolean,
    }
}

export class CreateZoneRequest extends jspb.Message { 
    getLayoutId(): string;
    setLayoutId(value: string): CreateZoneRequest;
    getName(): string;
    setName(value: string): CreateZoneRequest;
    getX(): number;
    setX(value: number): CreateZoneRequest;
    getY(): number;
    setY(value: number): CreateZoneRequest;
    getWidth(): number;
    setWidth(value: number): CreateZoneRequest;
    getHeight(): number;
    setHeight(value: number): CreateZoneRequest;
    getZIndex(): number;
    setZIndex(value: number): CreateZoneRequest;
    getBackgroundColor(): string;
    setBackgroundColor(value: string): CreateZoneRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateZoneRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateZoneRequest): CreateZoneRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateZoneRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateZoneRequest;
    static deserializeBinaryFromReader(message: CreateZoneRequest, reader: jspb.BinaryReader): CreateZoneRequest;
}

export namespace CreateZoneRequest {
    export type AsObject = {
        layoutId: string,
        name: string,
        x: number,
        y: number,
        width: number,
        height: number,
        zIndex: number,
        backgroundColor: string,
    }
}

export class GetZoneRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): GetZoneRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetZoneRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetZoneRequest): GetZoneRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetZoneRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetZoneRequest;
    static deserializeBinaryFromReader(message: GetZoneRequest, reader: jspb.BinaryReader): GetZoneRequest;
}

export namespace GetZoneRequest {
    export type AsObject = {
        id: string,
    }
}

export class UpdateZoneRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): UpdateZoneRequest;
    getName(): string;
    setName(value: string): UpdateZoneRequest;
    getX(): number;
    setX(value: number): UpdateZoneRequest;
    getY(): number;
    setY(value: number): UpdateZoneRequest;
    getWidth(): number;
    setWidth(value: number): UpdateZoneRequest;
    getHeight(): number;
    setHeight(value: number): UpdateZoneRequest;
    getZIndex(): number;
    setZIndex(value: number): UpdateZoneRequest;
    getBackgroundColor(): string;
    setBackgroundColor(value: string): UpdateZoneRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateZoneRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateZoneRequest): UpdateZoneRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateZoneRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateZoneRequest;
    static deserializeBinaryFromReader(message: UpdateZoneRequest, reader: jspb.BinaryReader): UpdateZoneRequest;
}

export namespace UpdateZoneRequest {
    export type AsObject = {
        id: string,
        name: string,
        x: number,
        y: number,
        width: number,
        height: number,
        zIndex: number,
        backgroundColor: string,
    }
}

export class DeleteZoneRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): DeleteZoneRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteZoneRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteZoneRequest): DeleteZoneRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteZoneRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteZoneRequest;
    static deserializeBinaryFromReader(message: DeleteZoneRequest, reader: jspb.BinaryReader): DeleteZoneRequest;
}

export namespace DeleteZoneRequest {
    export type AsObject = {
        id: string,
    }
}

export class DeleteZoneResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): DeleteZoneResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteZoneResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteZoneResponse): DeleteZoneResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteZoneResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteZoneResponse;
    static deserializeBinaryFromReader(message: DeleteZoneResponse, reader: jspb.BinaryReader): DeleteZoneResponse;
}

export namespace DeleteZoneResponse {
    export type AsObject = {
        success: boolean,
    }
}

export class AddPlaylistBlockRequest extends jspb.Message { 
    getZoneId(): string;
    setZoneId(value: string): AddPlaylistBlockRequest;
    getPlaylistId(): string;
    setPlaylistId(value: string): AddPlaylistBlockRequest;
    getStartTimeSeconds(): number;
    setStartTimeSeconds(value: number): AddPlaylistBlockRequest;
    getDurationSeconds(): number;
    setDurationSeconds(value: number): AddPlaylistBlockRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddPlaylistBlockRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AddPlaylistBlockRequest): AddPlaylistBlockRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddPlaylistBlockRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddPlaylistBlockRequest;
    static deserializeBinaryFromReader(message: AddPlaylistBlockRequest, reader: jspb.BinaryReader): AddPlaylistBlockRequest;
}

export namespace AddPlaylistBlockRequest {
    export type AsObject = {
        zoneId: string,
        playlistId: string,
        startTimeSeconds: number,
        durationSeconds: number,
    }
}

export class AddMediaBlockRequest extends jspb.Message { 
    getZoneId(): string;
    setZoneId(value: string): AddMediaBlockRequest;
    getMediaItemId(): string;
    setMediaItemId(value: string): AddMediaBlockRequest;
    getStartTimeSeconds(): number;
    setStartTimeSeconds(value: number): AddMediaBlockRequest;
    getDurationSeconds(): number;
    setDurationSeconds(value: number): AddMediaBlockRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddMediaBlockRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AddMediaBlockRequest): AddMediaBlockRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddMediaBlockRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddMediaBlockRequest;
    static deserializeBinaryFromReader(message: AddMediaBlockRequest, reader: jspb.BinaryReader): AddMediaBlockRequest;
}

export namespace AddMediaBlockRequest {
    export type AsObject = {
        zoneId: string,
        mediaItemId: string,
        startTimeSeconds: number,
        durationSeconds: number,
    }
}

export class UpdatePlaylistBlockRequest extends jspb.Message { 
    getBlockId(): string;
    setBlockId(value: string): UpdatePlaylistBlockRequest;
    getStartTimeSeconds(): number;
    setStartTimeSeconds(value: number): UpdatePlaylistBlockRequest;
    getDurationSeconds(): number;
    setDurationSeconds(value: number): UpdatePlaylistBlockRequest;
    getTransitionType(): string;
    setTransitionType(value: string): UpdatePlaylistBlockRequest;
    getOrderIndex(): number;
    setOrderIndex(value: number): UpdatePlaylistBlockRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdatePlaylistBlockRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdatePlaylistBlockRequest): UpdatePlaylistBlockRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdatePlaylistBlockRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdatePlaylistBlockRequest;
    static deserializeBinaryFromReader(message: UpdatePlaylistBlockRequest, reader: jspb.BinaryReader): UpdatePlaylistBlockRequest;
}

export namespace UpdatePlaylistBlockRequest {
    export type AsObject = {
        blockId: string,
        startTimeSeconds: number,
        durationSeconds: number,
        transitionType: string,
        orderIndex: number,
    }
}

export class RemovePlaylistBlockRequest extends jspb.Message { 
    getBlockId(): string;
    setBlockId(value: string): RemovePlaylistBlockRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RemovePlaylistBlockRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RemovePlaylistBlockRequest): RemovePlaylistBlockRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RemovePlaylistBlockRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RemovePlaylistBlockRequest;
    static deserializeBinaryFromReader(message: RemovePlaylistBlockRequest, reader: jspb.BinaryReader): RemovePlaylistBlockRequest;
}

export namespace RemovePlaylistBlockRequest {
    export type AsObject = {
        blockId: string,
    }
}

export class PlaylistBlockResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): PlaylistBlockResponse;

    hasBlock(): boolean;
    clearBlock(): void;
    getBlock(): ZonePlaylist | undefined;
    setBlock(value?: ZonePlaylist): PlaylistBlockResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PlaylistBlockResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PlaylistBlockResponse): PlaylistBlockResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PlaylistBlockResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PlaylistBlockResponse;
    static deserializeBinaryFromReader(message: PlaylistBlockResponse, reader: jspb.BinaryReader): PlaylistBlockResponse;
}

export namespace PlaylistBlockResponse {
    export type AsObject = {
        success: boolean,
        block?: ZonePlaylist.AsObject,
    }
}

export class SetPlaylistItemOverrideRequest extends jspb.Message { 
    getZonePlaylistId(): string;
    setZonePlaylistId(value: string): SetPlaylistItemOverrideRequest;
    getPlaylistItemId(): string;
    setPlaylistItemId(value: string): SetPlaylistItemOverrideRequest;
    getIsMuted(): boolean;
    setIsMuted(value: boolean): SetPlaylistItemOverrideRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetPlaylistItemOverrideRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SetPlaylistItemOverrideRequest): SetPlaylistItemOverrideRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetPlaylistItemOverrideRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetPlaylistItemOverrideRequest;
    static deserializeBinaryFromReader(message: SetPlaylistItemOverrideRequest, reader: jspb.BinaryReader): SetPlaylistItemOverrideRequest;
}

export namespace SetPlaylistItemOverrideRequest {
    export type AsObject = {
        zonePlaylistId: string,
        playlistItemId: string,
        isMuted: boolean,
    }
}

export class SetPlaylistItemOverrideResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): SetPlaylistItemOverrideResponse;

    hasOverride(): boolean;
    clearOverride(): void;
    getOverride(): ZonePlaylistItemOverride | undefined;
    setOverride(value?: ZonePlaylistItemOverride): SetPlaylistItemOverrideResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetPlaylistItemOverrideResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SetPlaylistItemOverrideResponse): SetPlaylistItemOverrideResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetPlaylistItemOverrideResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetPlaylistItemOverrideResponse;
    static deserializeBinaryFromReader(message: SetPlaylistItemOverrideResponse, reader: jspb.BinaryReader): SetPlaylistItemOverrideResponse;
}

export namespace SetPlaylistItemOverrideResponse {
    export type AsObject = {
        success: boolean,
        override?: ZonePlaylistItemOverride.AsObject,
    }
}
