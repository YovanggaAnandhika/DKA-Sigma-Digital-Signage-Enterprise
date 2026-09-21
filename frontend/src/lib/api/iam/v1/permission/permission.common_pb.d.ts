// package: signage.iam.v1.permission
// file: iam/v1/permission/permission.common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as common_v1_types_pb from "../../../common/v1/types_pb";

export class Permission extends jspb.Message { 
    getId(): string;
    setId(value: string): Permission;
    getCode(): string;
    setCode(value: string): Permission;
    getName(): string;
    setName(value: string): Permission;
    getDescription(): string;
    setDescription(value: string): Permission;
    getModule(): string;
    setModule(value: string): Permission;
    getCreatedAt(): string;
    setCreatedAt(value: string): Permission;
    getUpdatedAt(): string;
    setUpdatedAt(value: string): Permission;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Permission.AsObject;
    static toObject(includeInstance: boolean, msg: Permission): Permission.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Permission, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Permission;
    static deserializeBinaryFromReader(message: Permission, reader: jspb.BinaryReader): Permission;
}

export namespace Permission {
    export type AsObject = {
        id: string,
        code: string,
        name: string,
        description: string,
        module: string,
        createdAt: string,
        updatedAt: string,
    }
}

export class CreatePermissionRequest extends jspb.Message { 
    getCode(): string;
    setCode(value: string): CreatePermissionRequest;
    getName(): string;
    setName(value: string): CreatePermissionRequest;
    getDescription(): string;
    setDescription(value: string): CreatePermissionRequest;
    getModule(): string;
    setModule(value: string): CreatePermissionRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreatePermissionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreatePermissionRequest): CreatePermissionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreatePermissionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreatePermissionRequest;
    static deserializeBinaryFromReader(message: CreatePermissionRequest, reader: jspb.BinaryReader): CreatePermissionRequest;
}

export namespace CreatePermissionRequest {
    export type AsObject = {
        code: string,
        name: string,
        description: string,
        module: string,
    }
}

export class GetPermissionRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): GetPermissionRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetPermissionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetPermissionRequest): GetPermissionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetPermissionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetPermissionRequest;
    static deserializeBinaryFromReader(message: GetPermissionRequest, reader: jspb.BinaryReader): GetPermissionRequest;
}

export namespace GetPermissionRequest {
    export type AsObject = {
        id: string,
    }
}

export class GetPermissionByCodeRequest extends jspb.Message { 
    getCode(): string;
    setCode(value: string): GetPermissionByCodeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetPermissionByCodeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetPermissionByCodeRequest): GetPermissionByCodeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetPermissionByCodeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetPermissionByCodeRequest;
    static deserializeBinaryFromReader(message: GetPermissionByCodeRequest, reader: jspb.BinaryReader): GetPermissionByCodeRequest;
}

export namespace GetPermissionByCodeRequest {
    export type AsObject = {
        code: string,
    }
}

export class ListPermissionsRequest extends jspb.Message { 

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationRequest | undefined;
    setPagination(value?: common_v1_types_pb.PaginationRequest): ListPermissionsRequest;
    getModule(): string;
    setModule(value: string): ListPermissionsRequest;
    getSearch(): string;
    setSearch(value: string): ListPermissionsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListPermissionsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListPermissionsRequest): ListPermissionsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListPermissionsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListPermissionsRequest;
    static deserializeBinaryFromReader(message: ListPermissionsRequest, reader: jspb.BinaryReader): ListPermissionsRequest;
}

export namespace ListPermissionsRequest {
    export type AsObject = {
        pagination?: common_v1_types_pb.PaginationRequest.AsObject,
        module: string,
        search: string,
    }
}

export class ListPermissionsResponse extends jspb.Message { 
    clearItemsList(): void;
    getItemsList(): Array<Permission>;
    setItemsList(value: Array<Permission>): ListPermissionsResponse;
    addItems(value?: Permission, index?: number): Permission;

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationResponse | undefined;
    setPagination(value?: common_v1_types_pb.PaginationResponse): ListPermissionsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListPermissionsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListPermissionsResponse): ListPermissionsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListPermissionsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListPermissionsResponse;
    static deserializeBinaryFromReader(message: ListPermissionsResponse, reader: jspb.BinaryReader): ListPermissionsResponse;
}

export namespace ListPermissionsResponse {
    export type AsObject = {
        itemsList: Array<Permission.AsObject>,
        pagination?: common_v1_types_pb.PaginationResponse.AsObject,
    }
}

export class UpdatePermissionRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): UpdatePermissionRequest;
    getName(): string;
    setName(value: string): UpdatePermissionRequest;
    getDescription(): string;
    setDescription(value: string): UpdatePermissionRequest;
    getModule(): string;
    setModule(value: string): UpdatePermissionRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdatePermissionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdatePermissionRequest): UpdatePermissionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdatePermissionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdatePermissionRequest;
    static deserializeBinaryFromReader(message: UpdatePermissionRequest, reader: jspb.BinaryReader): UpdatePermissionRequest;
}

export namespace UpdatePermissionRequest {
    export type AsObject = {
        id: string,
        name: string,
        description: string,
        module: string,
    }
}

export class DeletePermissionRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): DeletePermissionRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeletePermissionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeletePermissionRequest): DeletePermissionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeletePermissionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeletePermissionRequest;
    static deserializeBinaryFromReader(message: DeletePermissionRequest, reader: jspb.BinaryReader): DeletePermissionRequest;
}

export namespace DeletePermissionRequest {
    export type AsObject = {
        id: string,
    }
}

export class DeletePermissionResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): DeletePermissionResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeletePermissionResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeletePermissionResponse): DeletePermissionResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeletePermissionResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeletePermissionResponse;
    static deserializeBinaryFromReader(message: DeletePermissionResponse, reader: jspb.BinaryReader): DeletePermissionResponse;
}

export namespace DeletePermissionResponse {
    export type AsObject = {
        success: boolean,
    }
}

export class CheckUserPermissionRequest extends jspb.Message { 
    getUserId(): string;
    setUserId(value: string): CheckUserPermissionRequest;
    getPermissionCode(): string;
    setPermissionCode(value: string): CheckUserPermissionRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CheckUserPermissionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CheckUserPermissionRequest): CheckUserPermissionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CheckUserPermissionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CheckUserPermissionRequest;
    static deserializeBinaryFromReader(message: CheckUserPermissionRequest, reader: jspb.BinaryReader): CheckUserPermissionRequest;
}

export namespace CheckUserPermissionRequest {
    export type AsObject = {
        userId: string,
        permissionCode: string,
    }
}

export class CheckUserPermissionResponse extends jspb.Message { 
    getAllowed(): boolean;
    setAllowed(value: boolean): CheckUserPermissionResponse;
    getReason(): string;
    setReason(value: string): CheckUserPermissionResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CheckUserPermissionResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CheckUserPermissionResponse): CheckUserPermissionResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CheckUserPermissionResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CheckUserPermissionResponse;
    static deserializeBinaryFromReader(message: CheckUserPermissionResponse, reader: jspb.BinaryReader): CheckUserPermissionResponse;
}

export namespace CheckUserPermissionResponse {
    export type AsObject = {
        allowed: boolean,
        reason: string,
    }
}
