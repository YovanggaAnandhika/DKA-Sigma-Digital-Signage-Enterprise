// package: signage.distribution.v1.stream
// file: distribution/v1/stream/stream.common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class StreamServerMessage extends jspb.Message { 
    getMessageId(): string;
    setMessageId(value: string): StreamServerMessage;
    getTimestamp(): number;
    setTimestamp(value: number): StreamServerMessage;
    getCommandType(): ServerCommandType;
    setCommandType(value: ServerCommandType): StreamServerMessage;
    getPayloadJson(): string;
    setPayloadJson(value: string): StreamServerMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StreamServerMessage.AsObject;
    static toObject(includeInstance: boolean, msg: StreamServerMessage): StreamServerMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StreamServerMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StreamServerMessage;
    static deserializeBinaryFromReader(message: StreamServerMessage, reader: jspb.BinaryReader): StreamServerMessage;
}

export namespace StreamServerMessage {
    export type AsObject = {
        messageId: string,
        timestamp: number,
        commandType: ServerCommandType,
        payloadJson: string,
    }
}

export class StreamClientMessage extends jspb.Message { 
    getDeviceId(): string;
    setDeviceId(value: string): StreamClientMessage;
    getDeviceToken(): string;
    setDeviceToken(value: string): StreamClientMessage;
    getTimestamp(): number;
    setTimestamp(value: number): StreamClientMessage;

    hasPing(): boolean;
    clearPing(): void;
    getPing(): HeartbeatPing | undefined;
    setPing(value?: HeartbeatPing): StreamClientMessage;

    hasCommandAck(): boolean;
    clearCommandAck(): void;
    getCommandAck(): CommandAck | undefined;
    setCommandAck(value?: CommandAck): StreamClientMessage;

    hasScreenshot(): boolean;
    clearScreenshot(): void;
    getScreenshot(): ScreenshotUpload | undefined;
    setScreenshot(value?: ScreenshotUpload): StreamClientMessage;

    getPayloadCase(): StreamClientMessage.PayloadCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StreamClientMessage.AsObject;
    static toObject(includeInstance: boolean, msg: StreamClientMessage): StreamClientMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StreamClientMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StreamClientMessage;
    static deserializeBinaryFromReader(message: StreamClientMessage, reader: jspb.BinaryReader): StreamClientMessage;
}

export namespace StreamClientMessage {
    export type AsObject = {
        deviceId: string,
        deviceToken: string,
        timestamp: number,
        ping?: HeartbeatPing.AsObject,
        commandAck?: CommandAck.AsObject,
        screenshot?: ScreenshotUpload.AsObject,
    }

    export enum PayloadCase {
        PAYLOAD_NOT_SET = 0,
        PING = 4,
        COMMAND_ACK = 5,
        SCREENSHOT = 6,
    }

}

export class HeartbeatPing extends jspb.Message { 
    getMemoryPercent(): number;
    setMemoryPercent(value: number): HeartbeatPing;
    getStorageFreeBytes(): number;
    setStorageFreeBytes(value: number): HeartbeatPing;
    getCurrentPlayingMediaId(): string;
    setCurrentPlayingMediaId(value: string): HeartbeatPing;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HeartbeatPing.AsObject;
    static toObject(includeInstance: boolean, msg: HeartbeatPing): HeartbeatPing.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HeartbeatPing, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HeartbeatPing;
    static deserializeBinaryFromReader(message: HeartbeatPing, reader: jspb.BinaryReader): HeartbeatPing;
}

export namespace HeartbeatPing {
    export type AsObject = {
        memoryPercent: number,
        storageFreeBytes: number,
        currentPlayingMediaId: string,
    }
}

export class CommandAck extends jspb.Message { 
    getMessageId(): string;
    setMessageId(value: string): CommandAck;
    getSuccess(): boolean;
    setSuccess(value: boolean): CommandAck;
    getErrorMessage(): string;
    setErrorMessage(value: string): CommandAck;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CommandAck.AsObject;
    static toObject(includeInstance: boolean, msg: CommandAck): CommandAck.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CommandAck, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CommandAck;
    static deserializeBinaryFromReader(message: CommandAck, reader: jspb.BinaryReader): CommandAck;
}

export namespace CommandAck {
    export type AsObject = {
        messageId: string,
        success: boolean,
        errorMessage: string,
    }
}

export class ScreenshotUpload extends jspb.Message { 
    getRequestId(): string;
    setRequestId(value: string): ScreenshotUpload;
    getImageData(): Uint8Array | string;
    getImageData_asU8(): Uint8Array;
    getImageData_asB64(): string;
    setImageData(value: Uint8Array | string): ScreenshotUpload;
    getMimeType(): string;
    setMimeType(value: string): ScreenshotUpload;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ScreenshotUpload.AsObject;
    static toObject(includeInstance: boolean, msg: ScreenshotUpload): ScreenshotUpload.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ScreenshotUpload, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ScreenshotUpload;
    static deserializeBinaryFromReader(message: ScreenshotUpload, reader: jspb.BinaryReader): ScreenshotUpload;
}

export namespace ScreenshotUpload {
    export type AsObject = {
        requestId: string,
        imageData: Uint8Array | string,
        mimeType: string,
    }
}

export class PushCommandRequest extends jspb.Message { 
    getDeviceId(): string;
    setDeviceId(value: string): PushCommandRequest;
    getCommandType(): ServerCommandType;
    setCommandType(value: ServerCommandType): PushCommandRequest;
    getPayloadJson(): string;
    setPayloadJson(value: string): PushCommandRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PushCommandRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PushCommandRequest): PushCommandRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PushCommandRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PushCommandRequest;
    static deserializeBinaryFromReader(message: PushCommandRequest, reader: jspb.BinaryReader): PushCommandRequest;
}

export namespace PushCommandRequest {
    export type AsObject = {
        deviceId: string,
        commandType: ServerCommandType,
        payloadJson: string,
    }
}

export class PushCommandResponse extends jspb.Message { 
    getQueued(): boolean;
    setQueued(value: boolean): PushCommandResponse;
    getCommandId(): string;
    setCommandId(value: string): PushCommandResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PushCommandResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PushCommandResponse): PushCommandResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PushCommandResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PushCommandResponse;
    static deserializeBinaryFromReader(message: PushCommandResponse, reader: jspb.BinaryReader): PushCommandResponse;
}

export namespace PushCommandResponse {
    export type AsObject = {
        queued: boolean,
        commandId: string,
    }
}

export enum ServerCommandType {
    COMMAND_UNSPECIFIED = 0,
    COMMAND_RELOAD_MANIFEST = 1,
    COMMAND_CAPTURE_SCREENSHOT = 2,
    COMMAND_REBOOT_PLAYER = 3,
    COMMAND_EMERGENCY_BROADCAST = 4,
    COMMAND_CLEAR_CACHE = 5,
}
