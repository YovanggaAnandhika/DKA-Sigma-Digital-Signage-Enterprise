// package: signage.distribution.v1.canary
// file: distribution/v1/canary/canary.common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as common_v1_types_pb from "../../../common/v1/types_pb";

export class CanaryGroup extends jspb.Message { 
    getId(): string;
    setId(value: string): CanaryGroup;
    getName(): string;
    setName(value: string): CanaryGroup;
    getDescription(): string;
    setDescription(value: string): CanaryGroup;
    getRolloutPercentage(): number;
    setRolloutPercentage(value: number): CanaryGroup;
    getIsActive(): boolean;
    setIsActive(value: boolean): CanaryGroup;
    getTargetLayoutId(): string;
    setTargetLayoutId(value: string): CanaryGroup;
    getCreatedAt(): string;
    setCreatedAt(value: string): CanaryGroup;
    getUpdatedAt(): string;
    setUpdatedAt(value: string): CanaryGroup;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CanaryGroup.AsObject;
    static toObject(includeInstance: boolean, msg: CanaryGroup): CanaryGroup.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CanaryGroup, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CanaryGroup;
    static deserializeBinaryFromReader(message: CanaryGroup, reader: jspb.BinaryReader): CanaryGroup;
}

export namespace CanaryGroup {
    export type AsObject = {
        id: string,
        name: string,
        description: string,
        rolloutPercentage: number,
        isActive: boolean,
        targetLayoutId: string,
        createdAt: string,
        updatedAt: string,
    }
}

export class CreateCanaryGroupRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateCanaryGroupRequest;
    getDescription(): string;
    setDescription(value: string): CreateCanaryGroupRequest;
    getRolloutPercentage(): number;
    setRolloutPercentage(value: number): CreateCanaryGroupRequest;
    getIsActive(): boolean;
    setIsActive(value: boolean): CreateCanaryGroupRequest;
    getTargetLayoutId(): string;
    setTargetLayoutId(value: string): CreateCanaryGroupRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateCanaryGroupRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateCanaryGroupRequest): CreateCanaryGroupRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateCanaryGroupRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateCanaryGroupRequest;
    static deserializeBinaryFromReader(message: CreateCanaryGroupRequest, reader: jspb.BinaryReader): CreateCanaryGroupRequest;
}

export namespace CreateCanaryGroupRequest {
    export type AsObject = {
        name: string,
        description: string,
        rolloutPercentage: number,
        isActive: boolean,
        targetLayoutId: string,
    }
}

export class GetCanaryGroupRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): GetCanaryGroupRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetCanaryGroupRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetCanaryGroupRequest): GetCanaryGroupRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetCanaryGroupRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetCanaryGroupRequest;
    static deserializeBinaryFromReader(message: GetCanaryGroupRequest, reader: jspb.BinaryReader): GetCanaryGroupRequest;
}

export namespace GetCanaryGroupRequest {
    export type AsObject = {
        id: string,
    }
}

export class ListCanaryGroupsRequest extends jspb.Message { 

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationRequest | undefined;
    setPagination(value?: common_v1_types_pb.PaginationRequest): ListCanaryGroupsRequest;
    getSearch(): string;
    setSearch(value: string): ListCanaryGroupsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListCanaryGroupsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListCanaryGroupsRequest): ListCanaryGroupsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListCanaryGroupsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListCanaryGroupsRequest;
    static deserializeBinaryFromReader(message: ListCanaryGroupsRequest, reader: jspb.BinaryReader): ListCanaryGroupsRequest;
}

export namespace ListCanaryGroupsRequest {
    export type AsObject = {
        pagination?: common_v1_types_pb.PaginationRequest.AsObject,
        search: string,
    }
}

export class ListCanaryGroupsResponse extends jspb.Message { 
    clearItemsList(): void;
    getItemsList(): Array<CanaryGroup>;
    setItemsList(value: Array<CanaryGroup>): ListCanaryGroupsResponse;
    addItems(value?: CanaryGroup, index?: number): CanaryGroup;

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationResponse | undefined;
    setPagination(value?: common_v1_types_pb.PaginationResponse): ListCanaryGroupsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListCanaryGroupsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListCanaryGroupsResponse): ListCanaryGroupsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListCanaryGroupsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListCanaryGroupsResponse;
    static deserializeBinaryFromReader(message: ListCanaryGroupsResponse, reader: jspb.BinaryReader): ListCanaryGroupsResponse;
}

export namespace ListCanaryGroupsResponse {
    export type AsObject = {
        itemsList: Array<CanaryGroup.AsObject>,
        pagination?: common_v1_types_pb.PaginationResponse.AsObject,
    }
}

export class UpdateCanaryGroupRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): UpdateCanaryGroupRequest;
    getName(): string;
    setName(value: string): UpdateCanaryGroupRequest;
    getDescription(): string;
    setDescription(value: string): UpdateCanaryGroupRequest;
    getRolloutPercentage(): number;
    setRolloutPercentage(value: number): UpdateCanaryGroupRequest;
    getIsActive(): boolean;
    setIsActive(value: boolean): UpdateCanaryGroupRequest;
    getTargetLayoutId(): string;
    setTargetLayoutId(value: string): UpdateCanaryGroupRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateCanaryGroupRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateCanaryGroupRequest): UpdateCanaryGroupRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateCanaryGroupRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateCanaryGroupRequest;
    static deserializeBinaryFromReader(message: UpdateCanaryGroupRequest, reader: jspb.BinaryReader): UpdateCanaryGroupRequest;
}

export namespace UpdateCanaryGroupRequest {
    export type AsObject = {
        id: string,
        name: string,
        description: string,
        rolloutPercentage: number,
        isActive: boolean,
        targetLayoutId: string,
    }
}

export class DeleteCanaryGroupRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): DeleteCanaryGroupRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteCanaryGroupRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteCanaryGroupRequest): DeleteCanaryGroupRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteCanaryGroupRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteCanaryGroupRequest;
    static deserializeBinaryFromReader(message: DeleteCanaryGroupRequest, reader: jspb.BinaryReader): DeleteCanaryGroupRequest;
}

export namespace DeleteCanaryGroupRequest {
    export type AsObject = {
        id: string,
    }
}

export class DeleteCanaryGroupResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): DeleteCanaryGroupResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteCanaryGroupResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteCanaryGroupResponse): DeleteCanaryGroupResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteCanaryGroupResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteCanaryGroupResponse;
    static deserializeBinaryFromReader(message: DeleteCanaryGroupResponse, reader: jspb.BinaryReader): DeleteCanaryGroupResponse;
}

export namespace DeleteCanaryGroupResponse {
    export type AsObject = {
        success: boolean,
    }
}

export class EvaluateCanaryRequest extends jspb.Message { 
    getDeviceId(): string;
    setDeviceId(value: string): EvaluateCanaryRequest;
    getRequestedLayoutId(): string;
    setRequestedLayoutId(value: string): EvaluateCanaryRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EvaluateCanaryRequest.AsObject;
    static toObject(includeInstance: boolean, msg: EvaluateCanaryRequest): EvaluateCanaryRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EvaluateCanaryRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EvaluateCanaryRequest;
    static deserializeBinaryFromReader(message: EvaluateCanaryRequest, reader: jspb.BinaryReader): EvaluateCanaryRequest;
}

export namespace EvaluateCanaryRequest {
    export type AsObject = {
        deviceId: string,
        requestedLayoutId: string,
    }
}

export class EvaluateCanaryResponse extends jspb.Message { 
    getIsInCanary(): boolean;
    setIsInCanary(value: boolean): EvaluateCanaryResponse;
    getEffectiveLayoutId(): string;
    setEffectiveLayoutId(value: string): EvaluateCanaryResponse;
    getCanaryGroupId(): string;
    setCanaryGroupId(value: string): EvaluateCanaryResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EvaluateCanaryResponse.AsObject;
    static toObject(includeInstance: boolean, msg: EvaluateCanaryResponse): EvaluateCanaryResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EvaluateCanaryResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EvaluateCanaryResponse;
    static deserializeBinaryFromReader(message: EvaluateCanaryResponse, reader: jspb.BinaryReader): EvaluateCanaryResponse;
}

export namespace EvaluateCanaryResponse {
    export type AsObject = {
        isInCanary: boolean,
        effectiveLayoutId: string,
        canaryGroupId: string,
    }
}
