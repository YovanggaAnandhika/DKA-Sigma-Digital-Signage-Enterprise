// package: signage.studio.v1.media
// file: studio/v1/media/media.common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as common_v1_types_pb from "../../../common/v1/types_pb";

export class MediaItem extends jspb.Message { 
    getId(): string;
    setId(value: string): MediaItem;
    getName(): string;
    setName(value: string): MediaItem;
    getOriginalFilename(): string;
    setOriginalFilename(value: string): MediaItem;
    getFilePath(): string;
    setFilePath(value: string): MediaItem;
    getPublicUrl(): string;
    setPublicUrl(value: string): MediaItem;
    getFileSizeBytes(): number;
    setFileSizeBytes(value: number): MediaItem;
    getMimeType(): string;
    setMimeType(value: string): MediaItem;
    getSha256Hash(): string;
    setSha256Hash(value: string): MediaItem;
    getMediaType(): MediaType;
    setMediaType(value: MediaType): MediaItem;
    getWidth(): number;
    setWidth(value: number): MediaItem;
    getHeight(): number;
    setHeight(value: number): MediaItem;
    getDurationSeconds(): number;
    setDurationSeconds(value: number): MediaItem;
    getThumbnailUrl(): string;
    setThumbnailUrl(value: string): MediaItem;
    getCreatedAt(): string;
    setCreatedAt(value: string): MediaItem;
    getUpdatedAt(): string;
    setUpdatedAt(value: string): MediaItem;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MediaItem.AsObject;
    static toObject(includeInstance: boolean, msg: MediaItem): MediaItem.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MediaItem, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MediaItem;
    static deserializeBinaryFromReader(message: MediaItem, reader: jspb.BinaryReader): MediaItem;
}

export namespace MediaItem {
    export type AsObject = {
        id: string,
        name: string,
        originalFilename: string,
        filePath: string,
        publicUrl: string,
        fileSizeBytes: number,
        mimeType: string,
        sha256Hash: string,
        mediaType: MediaType,
        width: number,
        height: number,
        durationSeconds: number,
        thumbnailUrl: string,
        createdAt: string,
        updatedAt: string,
    }
}

export class CreateMediaRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateMediaRequest;
    getOriginalFilename(): string;
    setOriginalFilename(value: string): CreateMediaRequest;
    getFilePath(): string;
    setFilePath(value: string): CreateMediaRequest;
    getPublicUrl(): string;
    setPublicUrl(value: string): CreateMediaRequest;
    getFileSizeBytes(): number;
    setFileSizeBytes(value: number): CreateMediaRequest;
    getMimeType(): string;
    setMimeType(value: string): CreateMediaRequest;
    getSha256Hash(): string;
    setSha256Hash(value: string): CreateMediaRequest;
    getMediaType(): MediaType;
    setMediaType(value: MediaType): CreateMediaRequest;
    getWidth(): number;
    setWidth(value: number): CreateMediaRequest;
    getHeight(): number;
    setHeight(value: number): CreateMediaRequest;
    getDurationSeconds(): number;
    setDurationSeconds(value: number): CreateMediaRequest;
    getThumbnailUrl(): string;
    setThumbnailUrl(value: string): CreateMediaRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateMediaRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateMediaRequest): CreateMediaRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateMediaRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateMediaRequest;
    static deserializeBinaryFromReader(message: CreateMediaRequest, reader: jspb.BinaryReader): CreateMediaRequest;
}

export namespace CreateMediaRequest {
    export type AsObject = {
        name: string,
        originalFilename: string,
        filePath: string,
        publicUrl: string,
        fileSizeBytes: number,
        mimeType: string,
        sha256Hash: string,
        mediaType: MediaType,
        width: number,
        height: number,
        durationSeconds: number,
        thumbnailUrl: string,
    }
}

export class GetMediaRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): GetMediaRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetMediaRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetMediaRequest): GetMediaRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetMediaRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetMediaRequest;
    static deserializeBinaryFromReader(message: GetMediaRequest, reader: jspb.BinaryReader): GetMediaRequest;
}

export namespace GetMediaRequest {
    export type AsObject = {
        id: string,
    }
}

export class ListMediaRequest extends jspb.Message { 

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationRequest | undefined;
    setPagination(value?: common_v1_types_pb.PaginationRequest): ListMediaRequest;
    getSearch(): string;
    setSearch(value: string): ListMediaRequest;
    getMediaType(): MediaType;
    setMediaType(value: MediaType): ListMediaRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListMediaRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListMediaRequest): ListMediaRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListMediaRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListMediaRequest;
    static deserializeBinaryFromReader(message: ListMediaRequest, reader: jspb.BinaryReader): ListMediaRequest;
}

export namespace ListMediaRequest {
    export type AsObject = {
        pagination?: common_v1_types_pb.PaginationRequest.AsObject,
        search: string,
        mediaType: MediaType,
    }
}

export class ListMediaResponse extends jspb.Message { 
    clearItemsList(): void;
    getItemsList(): Array<MediaItem>;
    setItemsList(value: Array<MediaItem>): ListMediaResponse;
    addItems(value?: MediaItem, index?: number): MediaItem;

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationResponse | undefined;
    setPagination(value?: common_v1_types_pb.PaginationResponse): ListMediaResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListMediaResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListMediaResponse): ListMediaResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListMediaResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListMediaResponse;
    static deserializeBinaryFromReader(message: ListMediaResponse, reader: jspb.BinaryReader): ListMediaResponse;
}

export namespace ListMediaResponse {
    export type AsObject = {
        itemsList: Array<MediaItem.AsObject>,
        pagination?: common_v1_types_pb.PaginationResponse.AsObject,
    }
}

export class UpdateMediaRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): UpdateMediaRequest;
    getName(): string;
    setName(value: string): UpdateMediaRequest;
    getDurationSeconds(): number;
    setDurationSeconds(value: number): UpdateMediaRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateMediaRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateMediaRequest): UpdateMediaRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateMediaRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateMediaRequest;
    static deserializeBinaryFromReader(message: UpdateMediaRequest, reader: jspb.BinaryReader): UpdateMediaRequest;
}

export namespace UpdateMediaRequest {
    export type AsObject = {
        id: string,
        name: string,
        durationSeconds: number,
    }
}

export class DeleteMediaRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): DeleteMediaRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteMediaRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteMediaRequest): DeleteMediaRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteMediaRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteMediaRequest;
    static deserializeBinaryFromReader(message: DeleteMediaRequest, reader: jspb.BinaryReader): DeleteMediaRequest;
}

export namespace DeleteMediaRequest {
    export type AsObject = {
        id: string,
    }
}

export class DeleteMediaResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): DeleteMediaResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteMediaResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteMediaResponse): DeleteMediaResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteMediaResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteMediaResponse;
    static deserializeBinaryFromReader(message: DeleteMediaResponse, reader: jspb.BinaryReader): DeleteMediaResponse;
}

export namespace DeleteMediaResponse {
    export type AsObject = {
        success: boolean,
    }
}

export class UploadMediaChunkRequest extends jspb.Message { 
    getUploadId(): string;
    setUploadId(value: string): UploadMediaChunkRequest;
    getOriginalFilename(): string;
    setOriginalFilename(value: string): UploadMediaChunkRequest;
    getMimeType(): string;
    setMimeType(value: string): UploadMediaChunkRequest;
    getChunkIndex(): number;
    setChunkIndex(value: number): UploadMediaChunkRequest;
    getTotalChunks(): number;
    setTotalChunks(value: number): UploadMediaChunkRequest;
    getChunkData(): Uint8Array | string;
    getChunkData_asU8(): Uint8Array;
    getChunkData_asB64(): string;
    setChunkData(value: Uint8Array | string): UploadMediaChunkRequest;
    getTotalFileSize(): number;
    setTotalFileSize(value: number): UploadMediaChunkRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UploadMediaChunkRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UploadMediaChunkRequest): UploadMediaChunkRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UploadMediaChunkRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UploadMediaChunkRequest;
    static deserializeBinaryFromReader(message: UploadMediaChunkRequest, reader: jspb.BinaryReader): UploadMediaChunkRequest;
}

export namespace UploadMediaChunkRequest {
    export type AsObject = {
        uploadId: string,
        originalFilename: string,
        mimeType: string,
        chunkIndex: number,
        totalChunks: number,
        chunkData: Uint8Array | string,
        totalFileSize: number,
    }
}

export class UploadMediaChunkResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): UploadMediaChunkResponse;
    getUploadId(): string;
    setUploadId(value: string): UploadMediaChunkResponse;
    getChunkIndex(): number;
    setChunkIndex(value: number): UploadMediaChunkResponse;
    getIsCompleted(): boolean;
    setIsCompleted(value: boolean): UploadMediaChunkResponse;
    getFilePath(): string;
    setFilePath(value: string): UploadMediaChunkResponse;
    getPublicUrl(): string;
    setPublicUrl(value: string): UploadMediaChunkResponse;
    getSha256Hash(): string;
    setSha256Hash(value: string): UploadMediaChunkResponse;
    getFileSizeBytes(): number;
    setFileSizeBytes(value: number): UploadMediaChunkResponse;
    getErrorMessage(): string;
    setErrorMessage(value: string): UploadMediaChunkResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UploadMediaChunkResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UploadMediaChunkResponse): UploadMediaChunkResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UploadMediaChunkResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UploadMediaChunkResponse;
    static deserializeBinaryFromReader(message: UploadMediaChunkResponse, reader: jspb.BinaryReader): UploadMediaChunkResponse;
}

export namespace UploadMediaChunkResponse {
    export type AsObject = {
        success: boolean,
        uploadId: string,
        chunkIndex: number,
        isCompleted: boolean,
        filePath: string,
        publicUrl: string,
        sha256Hash: string,
        fileSizeBytes: number,
        errorMessage: string,
    }
}

export class GetMediaFileRequest extends jspb.Message { 
    getFilename(): string;
    setFilename(value: string): GetMediaFileRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetMediaFileRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetMediaFileRequest): GetMediaFileRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetMediaFileRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetMediaFileRequest;
    static deserializeBinaryFromReader(message: GetMediaFileRequest, reader: jspb.BinaryReader): GetMediaFileRequest;
}

export namespace GetMediaFileRequest {
    export type AsObject = {
        filename: string,
    }
}

export class GetMediaFileResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): GetMediaFileResponse;
    getFilename(): string;
    setFilename(value: string): GetMediaFileResponse;
    getMimeType(): string;
    setMimeType(value: string): GetMediaFileResponse;
    getFileData(): Uint8Array | string;
    getFileData_asU8(): Uint8Array;
    getFileData_asB64(): string;
    setFileData(value: Uint8Array | string): GetMediaFileResponse;
    getErrorMessage(): string;
    setErrorMessage(value: string): GetMediaFileResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetMediaFileResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetMediaFileResponse): GetMediaFileResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetMediaFileResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetMediaFileResponse;
    static deserializeBinaryFromReader(message: GetMediaFileResponse, reader: jspb.BinaryReader): GetMediaFileResponse;
}

export namespace GetMediaFileResponse {
    export type AsObject = {
        success: boolean,
        filename: string,
        mimeType: string,
        fileData: Uint8Array | string,
        errorMessage: string,
    }
}

export class StreamMediaFileRequest extends jspb.Message { 
    getFilename(): string;
    setFilename(value: string): StreamMediaFileRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StreamMediaFileRequest.AsObject;
    static toObject(includeInstance: boolean, msg: StreamMediaFileRequest): StreamMediaFileRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StreamMediaFileRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StreamMediaFileRequest;
    static deserializeBinaryFromReader(message: StreamMediaFileRequest, reader: jspb.BinaryReader): StreamMediaFileRequest;
}

export namespace StreamMediaFileRequest {
    export type AsObject = {
        filename: string,
    }
}

export class StreamMediaFileResponse extends jspb.Message { 
    getChunkData(): Uint8Array | string;
    getChunkData_asU8(): Uint8Array;
    getChunkData_asB64(): string;
    setChunkData(value: Uint8Array | string): StreamMediaFileResponse;
    getMimeType(): string;
    setMimeType(value: string): StreamMediaFileResponse;
    getTotalSize(): number;
    setTotalSize(value: number): StreamMediaFileResponse;
    getErrorMessage(): string;
    setErrorMessage(value: string): StreamMediaFileResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StreamMediaFileResponse.AsObject;
    static toObject(includeInstance: boolean, msg: StreamMediaFileResponse): StreamMediaFileResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StreamMediaFileResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StreamMediaFileResponse;
    static deserializeBinaryFromReader(message: StreamMediaFileResponse, reader: jspb.BinaryReader): StreamMediaFileResponse;
}

export namespace StreamMediaFileResponse {
    export type AsObject = {
        chunkData: Uint8Array | string,
        mimeType: string,
        totalSize: number,
        errorMessage: string,
    }
}

export enum MediaType {
    MEDIA_TYPE_UNSPECIFIED = 0,
    MEDIA_TYPE_IMAGE = 1,
    MEDIA_TYPE_VIDEO = 2,
    MEDIA_TYPE_WEB = 3,
}
