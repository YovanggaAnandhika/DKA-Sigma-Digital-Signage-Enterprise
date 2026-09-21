// package: signage.hardware.v1.display_group
// file: hardware/v1/display_group/display_group.common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as common_v1_types_pb from "../../../common/v1/types_pb";

export class DisplayGroup extends jspb.Message { 
    getId(): string;
    setId(value: string): DisplayGroup;
    getName(): string;
    setName(value: string): DisplayGroup;
    getDescription(): string;
    setDescription(value: string): DisplayGroup;
    getDefaultLayoutId(): string;
    setDefaultLayoutId(value: string): DisplayGroup;
    getDefaultLayoutName(): string;
    setDefaultLayoutName(value: string): DisplayGroup;
    getScheduleId(): string;
    setScheduleId(value: string): DisplayGroup;
    getScheduleName(): string;
    setScheduleName(value: string): DisplayGroup;
    getCreatedAt(): string;
    setCreatedAt(value: string): DisplayGroup;
    getUpdatedAt(): string;
    setUpdatedAt(value: string): DisplayGroup;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DisplayGroup.AsObject;
    static toObject(includeInstance: boolean, msg: DisplayGroup): DisplayGroup.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DisplayGroup, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DisplayGroup;
    static deserializeBinaryFromReader(message: DisplayGroup, reader: jspb.BinaryReader): DisplayGroup;
}

export namespace DisplayGroup {
    export type AsObject = {
        id: string,
        name: string,
        description: string,
        defaultLayoutId: string,
        defaultLayoutName: string,
        scheduleId: string,
        scheduleName: string,
        createdAt: string,
        updatedAt: string,
    }
}

export class CreateDisplayGroupRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateDisplayGroupRequest;
    getDescription(): string;
    setDescription(value: string): CreateDisplayGroupRequest;
    getDefaultLayoutId(): string;
    setDefaultLayoutId(value: string): CreateDisplayGroupRequest;
    getScheduleId(): string;
    setScheduleId(value: string): CreateDisplayGroupRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateDisplayGroupRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateDisplayGroupRequest): CreateDisplayGroupRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateDisplayGroupRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateDisplayGroupRequest;
    static deserializeBinaryFromReader(message: CreateDisplayGroupRequest, reader: jspb.BinaryReader): CreateDisplayGroupRequest;
}

export namespace CreateDisplayGroupRequest {
    export type AsObject = {
        name: string,
        description: string,
        defaultLayoutId: string,
        scheduleId: string,
    }
}

export class UpdateDisplayGroupRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): UpdateDisplayGroupRequest;
    getName(): string;
    setName(value: string): UpdateDisplayGroupRequest;
    getDescription(): string;
    setDescription(value: string): UpdateDisplayGroupRequest;
    getDefaultLayoutId(): string;
    setDefaultLayoutId(value: string): UpdateDisplayGroupRequest;
    getScheduleId(): string;
    setScheduleId(value: string): UpdateDisplayGroupRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateDisplayGroupRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateDisplayGroupRequest): UpdateDisplayGroupRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateDisplayGroupRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateDisplayGroupRequest;
    static deserializeBinaryFromReader(message: UpdateDisplayGroupRequest, reader: jspb.BinaryReader): UpdateDisplayGroupRequest;
}

export namespace UpdateDisplayGroupRequest {
    export type AsObject = {
        id: string,
        name: string,
        description: string,
        defaultLayoutId: string,
        scheduleId: string,
    }
}

export class GetDisplayGroupRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): GetDisplayGroupRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetDisplayGroupRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetDisplayGroupRequest): GetDisplayGroupRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetDisplayGroupRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetDisplayGroupRequest;
    static deserializeBinaryFromReader(message: GetDisplayGroupRequest, reader: jspb.BinaryReader): GetDisplayGroupRequest;
}

export namespace GetDisplayGroupRequest {
    export type AsObject = {
        id: string,
    }
}

export class ListDisplayGroupsRequest extends jspb.Message { 

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationRequest | undefined;
    setPagination(value?: common_v1_types_pb.PaginationRequest): ListDisplayGroupsRequest;
    getSearch(): string;
    setSearch(value: string): ListDisplayGroupsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListDisplayGroupsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListDisplayGroupsRequest): ListDisplayGroupsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListDisplayGroupsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListDisplayGroupsRequest;
    static deserializeBinaryFromReader(message: ListDisplayGroupsRequest, reader: jspb.BinaryReader): ListDisplayGroupsRequest;
}

export namespace ListDisplayGroupsRequest {
    export type AsObject = {
        pagination?: common_v1_types_pb.PaginationRequest.AsObject,
        search: string,
    }
}

export class ListDisplayGroupsResponse extends jspb.Message { 
    clearItemsList(): void;
    getItemsList(): Array<DisplayGroup>;
    setItemsList(value: Array<DisplayGroup>): ListDisplayGroupsResponse;
    addItems(value?: DisplayGroup, index?: number): DisplayGroup;

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationResponse | undefined;
    setPagination(value?: common_v1_types_pb.PaginationResponse): ListDisplayGroupsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListDisplayGroupsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListDisplayGroupsResponse): ListDisplayGroupsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListDisplayGroupsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListDisplayGroupsResponse;
    static deserializeBinaryFromReader(message: ListDisplayGroupsResponse, reader: jspb.BinaryReader): ListDisplayGroupsResponse;
}

export namespace ListDisplayGroupsResponse {
    export type AsObject = {
        itemsList: Array<DisplayGroup.AsObject>,
        pagination?: common_v1_types_pb.PaginationResponse.AsObject,
    }
}

export class DeleteDisplayGroupRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): DeleteDisplayGroupRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteDisplayGroupRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteDisplayGroupRequest): DeleteDisplayGroupRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteDisplayGroupRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteDisplayGroupRequest;
    static deserializeBinaryFromReader(message: DeleteDisplayGroupRequest, reader: jspb.BinaryReader): DeleteDisplayGroupRequest;
}

export namespace DeleteDisplayGroupRequest {
    export type AsObject = {
        id: string,
    }
}

export class DeleteDisplayGroupResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): DeleteDisplayGroupResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteDisplayGroupResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteDisplayGroupResponse): DeleteDisplayGroupResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteDisplayGroupResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteDisplayGroupResponse;
    static deserializeBinaryFromReader(message: DeleteDisplayGroupResponse, reader: jspb.BinaryReader): DeleteDisplayGroupResponse;
}

export namespace DeleteDisplayGroupResponse {
    export type AsObject = {
        success: boolean,
    }
}
