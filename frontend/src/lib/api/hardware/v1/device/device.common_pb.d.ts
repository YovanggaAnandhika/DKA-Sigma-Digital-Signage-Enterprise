// package: signage.hardware.v1.device
// file: hardware/v1/device/device.common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as common_v1_types_pb from "../../../common/v1/types_pb";

export class Device extends jspb.Message { 
    getId(): string;
    setId(value: string): Device;
    getName(): string;
    setName(value: string): Device;
    getPairingCode(): string;
    setPairingCode(value: string): Device;
    getIsPaired(): boolean;
    setIsPaired(value: boolean): Device;
    getDeviceToken(): string;
    setDeviceToken(value: string): Device;
    getScreenWidth(): number;
    setScreenWidth(value: number): Device;
    getScreenHeight(): number;
    setScreenHeight(value: number): Device;
    getOrientation(): DeviceOrientation;
    setOrientation(value: DeviceOrientation): Device;
    getIpAddress(): string;
    setIpAddress(value: string): Device;
    getMacAddress(): string;
    setMacAddress(value: string): Device;
    getAppVersion(): string;
    setAppVersion(value: string): Device;
    getAndroidVersion(): string;
    setAndroidVersion(value: string): Device;
    getStorageTotalBytes(): number;
    setStorageTotalBytes(value: number): Device;
    getStorageFreeBytes(): number;
    setStorageFreeBytes(value: number): Device;
    getCurrentLayoutId(): string;
    setCurrentLayoutId(value: string): Device;
    getCurrentLayoutName(): string;
    setCurrentLayoutName(value: string): Device;
    getCanaryGroupId(): string;
    setCanaryGroupId(value: string): Device;
    getIsOnline(): boolean;
    setIsOnline(value: boolean): Device;
    getLastHeartbeatAt(): string;
    setLastHeartbeatAt(value: string): Device;
    getCreatedAt(): string;
    setCreatedAt(value: string): Device;
    getUpdatedAt(): string;
    setUpdatedAt(value: string): Device;
    getDisplayGroupId(): string;
    setDisplayGroupId(value: string): Device;
    getScheduleId(): string;
    setScheduleId(value: string): Device;
    getTimezone(): string;
    setTimezone(value: string): Device;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Device.AsObject;
    static toObject(includeInstance: boolean, msg: Device): Device.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Device, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Device;
    static deserializeBinaryFromReader(message: Device, reader: jspb.BinaryReader): Device;
}

export namespace Device {
    export type AsObject = {
        id: string,
        name: string,
        pairingCode: string,
        isPaired: boolean,
        deviceToken: string,
        screenWidth: number,
        screenHeight: number,
        orientation: DeviceOrientation,
        ipAddress: string,
        macAddress: string,
        appVersion: string,
        androidVersion: string,
        storageTotalBytes: number,
        storageFreeBytes: number,
        currentLayoutId: string,
        currentLayoutName: string,
        canaryGroupId: string,
        isOnline: boolean,
        lastHeartbeatAt: string,
        createdAt: string,
        updatedAt: string,
        displayGroupId: string,
        scheduleId: string,
        timezone: string,
    }
}

export class RegisterDeviceRequest extends jspb.Message { 
    getMacAddress(): string;
    setMacAddress(value: string): RegisterDeviceRequest;
    getAppVersion(): string;
    setAppVersion(value: string): RegisterDeviceRequest;
    getAndroidVersion(): string;
    setAndroidVersion(value: string): RegisterDeviceRequest;
    getScreenWidth(): number;
    setScreenWidth(value: number): RegisterDeviceRequest;
    getScreenHeight(): number;
    setScreenHeight(value: number): RegisterDeviceRequest;
    getOrientation(): DeviceOrientation;
    setOrientation(value: DeviceOrientation): RegisterDeviceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RegisterDeviceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RegisterDeviceRequest): RegisterDeviceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RegisterDeviceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RegisterDeviceRequest;
    static deserializeBinaryFromReader(message: RegisterDeviceRequest, reader: jspb.BinaryReader): RegisterDeviceRequest;
}

export namespace RegisterDeviceRequest {
    export type AsObject = {
        macAddress: string,
        appVersion: string,
        androidVersion: string,
        screenWidth: number,
        screenHeight: number,
        orientation: DeviceOrientation,
    }
}

export class RegisterDeviceResponse extends jspb.Message { 
    getDeviceId(): string;
    setDeviceId(value: string): RegisterDeviceResponse;
    getPairingCode(): string;
    setPairingCode(value: string): RegisterDeviceResponse;
    getExpiresInSeconds(): number;
    setExpiresInSeconds(value: number): RegisterDeviceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RegisterDeviceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RegisterDeviceResponse): RegisterDeviceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RegisterDeviceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RegisterDeviceResponse;
    static deserializeBinaryFromReader(message: RegisterDeviceResponse, reader: jspb.BinaryReader): RegisterDeviceResponse;
}

export namespace RegisterDeviceResponse {
    export type AsObject = {
        deviceId: string,
        pairingCode: string,
        expiresInSeconds: number,
    }
}

export class PairDeviceRequest extends jspb.Message { 
    getPairingCode(): string;
    setPairingCode(value: string): PairDeviceRequest;
    getDeviceName(): string;
    setDeviceName(value: string): PairDeviceRequest;
    getStoreLocation(): string;
    setStoreLocation(value: string): PairDeviceRequest;
    getDefaultLayoutId(): string;
    setDefaultLayoutId(value: string): PairDeviceRequest;
    getCanaryGroupId(): string;
    setCanaryGroupId(value: string): PairDeviceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PairDeviceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PairDeviceRequest): PairDeviceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PairDeviceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PairDeviceRequest;
    static deserializeBinaryFromReader(message: PairDeviceRequest, reader: jspb.BinaryReader): PairDeviceRequest;
}

export namespace PairDeviceRequest {
    export type AsObject = {
        pairingCode: string,
        deviceName: string,
        storeLocation: string,
        defaultLayoutId: string,
        canaryGroupId: string,
    }
}

export class PairDeviceResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): PairDeviceResponse;

    hasDevice(): boolean;
    clearDevice(): void;
    getDevice(): Device | undefined;
    setDevice(value?: Device): PairDeviceResponse;
    getDeviceToken(): string;
    setDeviceToken(value: string): PairDeviceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PairDeviceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PairDeviceResponse): PairDeviceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PairDeviceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PairDeviceResponse;
    static deserializeBinaryFromReader(message: PairDeviceResponse, reader: jspb.BinaryReader): PairDeviceResponse;
}

export namespace PairDeviceResponse {
    export type AsObject = {
        success: boolean,
        device?: Device.AsObject,
        deviceToken: string,
    }
}

export class HeartbeatRequest extends jspb.Message { 
    getDeviceId(): string;
    setDeviceId(value: string): HeartbeatRequest;
    getDeviceToken(): string;
    setDeviceToken(value: string): HeartbeatRequest;
    getStorageFreeBytes(): number;
    setStorageFreeBytes(value: number): HeartbeatRequest;
    getStorageTotalBytes(): number;
    setStorageTotalBytes(value: number): HeartbeatRequest;
    getMemoryUsagePercent(): number;
    setMemoryUsagePercent(value: number): HeartbeatRequest;
    getCurrentPlayingMediaId(): string;
    setCurrentPlayingMediaId(value: string): HeartbeatRequest;
    getActiveLayoutId(): string;
    setActiveLayoutId(value: string): HeartbeatRequest;
    getActiveManifestHash(): string;
    setActiveManifestHash(value: string): HeartbeatRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HeartbeatRequest.AsObject;
    static toObject(includeInstance: boolean, msg: HeartbeatRequest): HeartbeatRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HeartbeatRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HeartbeatRequest;
    static deserializeBinaryFromReader(message: HeartbeatRequest, reader: jspb.BinaryReader): HeartbeatRequest;
}

export namespace HeartbeatRequest {
    export type AsObject = {
        deviceId: string,
        deviceToken: string,
        storageFreeBytes: number,
        storageTotalBytes: number,
        memoryUsagePercent: number,
        currentPlayingMediaId: string,
        activeLayoutId: string,
        activeManifestHash: string,
    }
}

export class HeartbeatResponse extends jspb.Message { 
    getAcknowledged(): boolean;
    setAcknowledged(value: boolean): HeartbeatResponse;
    getNeedsManifestSync(): boolean;
    setNeedsManifestSync(value: boolean): HeartbeatResponse;
    getServerTime(): string;
    setServerTime(value: string): HeartbeatResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HeartbeatResponse.AsObject;
    static toObject(includeInstance: boolean, msg: HeartbeatResponse): HeartbeatResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HeartbeatResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HeartbeatResponse;
    static deserializeBinaryFromReader(message: HeartbeatResponse, reader: jspb.BinaryReader): HeartbeatResponse;
}

export namespace HeartbeatResponse {
    export type AsObject = {
        acknowledged: boolean,
        needsManifestSync: boolean,
        serverTime: string,
    }
}

export class GetDeviceRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): GetDeviceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetDeviceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetDeviceRequest): GetDeviceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetDeviceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetDeviceRequest;
    static deserializeBinaryFromReader(message: GetDeviceRequest, reader: jspb.BinaryReader): GetDeviceRequest;
}

export namespace GetDeviceRequest {
    export type AsObject = {
        id: string,
    }
}

export class ListDevicesRequest extends jspb.Message { 

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationRequest | undefined;
    setPagination(value?: common_v1_types_pb.PaginationRequest): ListDevicesRequest;
    getSearch(): string;
    setSearch(value: string): ListDevicesRequest;

    hasIsOnline(): boolean;
    clearIsOnline(): void;
    getIsOnline(): boolean | undefined;
    setIsOnline(value: boolean): ListDevicesRequest;
    getCanaryGroupId(): string;
    setCanaryGroupId(value: string): ListDevicesRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListDevicesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListDevicesRequest): ListDevicesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListDevicesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListDevicesRequest;
    static deserializeBinaryFromReader(message: ListDevicesRequest, reader: jspb.BinaryReader): ListDevicesRequest;
}

export namespace ListDevicesRequest {
    export type AsObject = {
        pagination?: common_v1_types_pb.PaginationRequest.AsObject,
        search: string,
        isOnline?: boolean,
        canaryGroupId: string,
    }
}

export class ListDevicesResponse extends jspb.Message { 
    clearItemsList(): void;
    getItemsList(): Array<Device>;
    setItemsList(value: Array<Device>): ListDevicesResponse;
    addItems(value?: Device, index?: number): Device;

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationResponse | undefined;
    setPagination(value?: common_v1_types_pb.PaginationResponse): ListDevicesResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListDevicesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListDevicesResponse): ListDevicesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListDevicesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListDevicesResponse;
    static deserializeBinaryFromReader(message: ListDevicesResponse, reader: jspb.BinaryReader): ListDevicesResponse;
}

export namespace ListDevicesResponse {
    export type AsObject = {
        itemsList: Array<Device.AsObject>,
        pagination?: common_v1_types_pb.PaginationResponse.AsObject,
    }
}

export class UpdateDeviceRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): UpdateDeviceRequest;
    getName(): string;
    setName(value: string): UpdateDeviceRequest;
    getScreenWidth(): number;
    setScreenWidth(value: number): UpdateDeviceRequest;
    getScreenHeight(): number;
    setScreenHeight(value: number): UpdateDeviceRequest;
    getOrientation(): DeviceOrientation;
    setOrientation(value: DeviceOrientation): UpdateDeviceRequest;
    getCurrentLayoutId(): string;
    setCurrentLayoutId(value: string): UpdateDeviceRequest;
    getCanaryGroupId(): string;
    setCanaryGroupId(value: string): UpdateDeviceRequest;
    getDisplayGroupId(): string;
    setDisplayGroupId(value: string): UpdateDeviceRequest;
    getScheduleId(): string;
    setScheduleId(value: string): UpdateDeviceRequest;
    getTimezone(): string;
    setTimezone(value: string): UpdateDeviceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateDeviceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateDeviceRequest): UpdateDeviceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateDeviceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateDeviceRequest;
    static deserializeBinaryFromReader(message: UpdateDeviceRequest, reader: jspb.BinaryReader): UpdateDeviceRequest;
}

export namespace UpdateDeviceRequest {
    export type AsObject = {
        id: string,
        name: string,
        screenWidth: number,
        screenHeight: number,
        orientation: DeviceOrientation,
        currentLayoutId: string,
        canaryGroupId: string,
        displayGroupId: string,
        scheduleId: string,
        timezone: string,
    }
}

export class DeleteDeviceRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): DeleteDeviceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteDeviceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteDeviceRequest): DeleteDeviceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteDeviceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteDeviceRequest;
    static deserializeBinaryFromReader(message: DeleteDeviceRequest, reader: jspb.BinaryReader): DeleteDeviceRequest;
}

export namespace DeleteDeviceRequest {
    export type AsObject = {
        id: string,
    }
}

export class DeleteDeviceResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): DeleteDeviceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteDeviceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteDeviceResponse): DeleteDeviceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteDeviceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteDeviceResponse;
    static deserializeBinaryFromReader(message: DeleteDeviceResponse, reader: jspb.BinaryReader): DeleteDeviceResponse;
}

export namespace DeleteDeviceResponse {
    export type AsObject = {
        success: boolean,
    }
}

export enum DeviceOrientation {
    ORIENTATION_UNSPECIFIED = 0,
    ORIENTATION_LANDSCAPE = 1,
    ORIENTATION_PORTRAIT = 2,
}
