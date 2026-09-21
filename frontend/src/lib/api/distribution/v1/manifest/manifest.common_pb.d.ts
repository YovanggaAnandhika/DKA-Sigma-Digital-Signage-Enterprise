// package: signage.distribution.v1.manifest
// file: distribution/v1/manifest/manifest.common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as hardware_v1_device_device_common_pb from "../../../hardware/v1/device/device.common_pb";
import * as studio_v1_layout_layout_common_pb from "../../../studio/v1/layout/layout.common_pb";
import * as studio_v1_media_media_common_pb from "../../../studio/v1/media/media.common_pb";

export class ManifestAsset extends jspb.Message { 
    getMediaId(): string;
    setMediaId(value: string): ManifestAsset;
    getUrl(): string;
    setUrl(value: string): ManifestAsset;
    getSha256Hash(): string;
    setSha256Hash(value: string): ManifestAsset;
    getFileSizeBytes(): number;
    setFileSizeBytes(value: number): ManifestAsset;
    getLocalFilename(): string;
    setLocalFilename(value: string): ManifestAsset;
    getMediaType(): studio_v1_media_media_common_pb.MediaType;
    setMediaType(value: studio_v1_media_media_common_pb.MediaType): ManifestAsset;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ManifestAsset.AsObject;
    static toObject(includeInstance: boolean, msg: ManifestAsset): ManifestAsset.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ManifestAsset, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ManifestAsset;
    static deserializeBinaryFromReader(message: ManifestAsset, reader: jspb.BinaryReader): ManifestAsset;
}

export namespace ManifestAsset {
    export type AsObject = {
        mediaId: string,
        url: string,
        sha256Hash: string,
        fileSizeBytes: number,
        localFilename: string,
        mediaType: studio_v1_media_media_common_pb.MediaType,
    }
}

export class CompiledManifest extends jspb.Message { 
    getManifestId(): string;
    setManifestId(value: string): CompiledManifest;
    getDeviceId(): string;
    setDeviceId(value: string): CompiledManifest;
    getVersionHash(): string;
    setVersionHash(value: string): CompiledManifest;
    getGeneratedAt(): string;
    setGeneratedAt(value: string): CompiledManifest;

    hasLayout(): boolean;
    clearLayout(): void;
    getLayout(): studio_v1_layout_layout_common_pb.Layout | undefined;
    setLayout(value?: studio_v1_layout_layout_common_pb.Layout): CompiledManifest;
    clearRequiredAssetsList(): void;
    getRequiredAssetsList(): Array<ManifestAsset>;
    setRequiredAssetsList(value: Array<ManifestAsset>): CompiledManifest;
    addRequiredAssets(value?: ManifestAsset, index?: number): ManifestAsset;
    getTotalDownloadSizeBytes(): number;
    setTotalDownloadSizeBytes(value: number): CompiledManifest;
    getIsCanary(): boolean;
    setIsCanary(value: boolean): CompiledManifest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CompiledManifest.AsObject;
    static toObject(includeInstance: boolean, msg: CompiledManifest): CompiledManifest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CompiledManifest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CompiledManifest;
    static deserializeBinaryFromReader(message: CompiledManifest, reader: jspb.BinaryReader): CompiledManifest;
}

export namespace CompiledManifest {
    export type AsObject = {
        manifestId: string,
        deviceId: string,
        versionHash: string,
        generatedAt: string,
        layout?: studio_v1_layout_layout_common_pb.Layout.AsObject,
        requiredAssetsList: Array<ManifestAsset.AsObject>,
        totalDownloadSizeBytes: number,
        isCanary: boolean,
    }
}

export class GetActiveManifestRequest extends jspb.Message { 
    getDeviceId(): string;
    setDeviceId(value: string): GetActiveManifestRequest;
    getDeviceToken(): string;
    setDeviceToken(value: string): GetActiveManifestRequest;
    getClientCurrentHash(): string;
    setClientCurrentHash(value: string): GetActiveManifestRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetActiveManifestRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetActiveManifestRequest): GetActiveManifestRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetActiveManifestRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetActiveManifestRequest;
    static deserializeBinaryFromReader(message: GetActiveManifestRequest, reader: jspb.BinaryReader): GetActiveManifestRequest;
}

export namespace GetActiveManifestRequest {
    export type AsObject = {
        deviceId: string,
        deviceToken: string,
        clientCurrentHash: string,
    }
}

export class GetActiveManifestResponse extends jspb.Message { 
    getIsUpToDate(): boolean;
    setIsUpToDate(value: boolean): GetActiveManifestResponse;

    hasManifest(): boolean;
    clearManifest(): void;
    getManifest(): CompiledManifest | undefined;
    setManifest(value?: CompiledManifest): GetActiveManifestResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetActiveManifestResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetActiveManifestResponse): GetActiveManifestResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetActiveManifestResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetActiveManifestResponse;
    static deserializeBinaryFromReader(message: GetActiveManifestResponse, reader: jspb.BinaryReader): GetActiveManifestResponse;
}

export namespace GetActiveManifestResponse {
    export type AsObject = {
        isUpToDate: boolean,
        manifest?: CompiledManifest.AsObject,
    }
}

export class AssignLayoutToDeviceRequest extends jspb.Message { 
    getDeviceId(): string;
    setDeviceId(value: string): AssignLayoutToDeviceRequest;
    getLayoutId(): string;
    setLayoutId(value: string): AssignLayoutToDeviceRequest;
    getIsActive(): boolean;
    setIsActive(value: boolean): AssignLayoutToDeviceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AssignLayoutToDeviceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AssignLayoutToDeviceRequest): AssignLayoutToDeviceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AssignLayoutToDeviceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AssignLayoutToDeviceRequest;
    static deserializeBinaryFromReader(message: AssignLayoutToDeviceRequest, reader: jspb.BinaryReader): AssignLayoutToDeviceRequest;
}

export namespace AssignLayoutToDeviceRequest {
    export type AsObject = {
        deviceId: string,
        layoutId: string,
        isActive: boolean,
    }
}

export class AssignLayoutToDeviceResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): AssignLayoutToDeviceResponse;
    getNewManifestHash(): string;
    setNewManifestHash(value: string): AssignLayoutToDeviceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AssignLayoutToDeviceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AssignLayoutToDeviceResponse): AssignLayoutToDeviceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AssignLayoutToDeviceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AssignLayoutToDeviceResponse;
    static deserializeBinaryFromReader(message: AssignLayoutToDeviceResponse, reader: jspb.BinaryReader): AssignLayoutToDeviceResponse;
}

export namespace AssignLayoutToDeviceResponse {
    export type AsObject = {
        success: boolean,
        newManifestHash: string,
    }
}
