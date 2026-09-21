// package: signage.iam.v1.role
// file: iam/v1/role/role.common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as common_v1_types_pb from "../../../common/v1/types_pb";
import * as iam_v1_permission_permission_common_pb from "../../../iam/v1/permission/permission.common_pb";

export class Role extends jspb.Message { 
    getId(): string;
    setId(value: string): Role;
    getName(): string;
    setName(value: string): Role;
    getSlug(): string;
    setSlug(value: string): Role;
    getDescription(): string;
    setDescription(value: string): Role;
    getIsSystem(): boolean;
    setIsSystem(value: boolean): Role;
    clearPermissionsList(): void;
    getPermissionsList(): Array<iam_v1_permission_permission_common_pb.Permission>;
    setPermissionsList(value: Array<iam_v1_permission_permission_common_pb.Permission>): Role;
    addPermissions(value?: iam_v1_permission_permission_common_pb.Permission, index?: number): iam_v1_permission_permission_common_pb.Permission;
    getCreatedAt(): string;
    setCreatedAt(value: string): Role;
    getUpdatedAt(): string;
    setUpdatedAt(value: string): Role;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Role.AsObject;
    static toObject(includeInstance: boolean, msg: Role): Role.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Role, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Role;
    static deserializeBinaryFromReader(message: Role, reader: jspb.BinaryReader): Role;
}

export namespace Role {
    export type AsObject = {
        id: string,
        name: string,
        slug: string,
        description: string,
        isSystem: boolean,
        permissionsList: Array<iam_v1_permission_permission_common_pb.Permission.AsObject>,
        createdAt: string,
        updatedAt: string,
    }
}

export class CreateRoleRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateRoleRequest;
    getSlug(): string;
    setSlug(value: string): CreateRoleRequest;
    getDescription(): string;
    setDescription(value: string): CreateRoleRequest;
    clearPermissionIdsList(): void;
    getPermissionIdsList(): Array<string>;
    setPermissionIdsList(value: Array<string>): CreateRoleRequest;
    addPermissionIds(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateRoleRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateRoleRequest): CreateRoleRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateRoleRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateRoleRequest;
    static deserializeBinaryFromReader(message: CreateRoleRequest, reader: jspb.BinaryReader): CreateRoleRequest;
}

export namespace CreateRoleRequest {
    export type AsObject = {
        name: string,
        slug: string,
        description: string,
        permissionIdsList: Array<string>,
    }
}

export class GetRoleRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): GetRoleRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetRoleRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetRoleRequest): GetRoleRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetRoleRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetRoleRequest;
    static deserializeBinaryFromReader(message: GetRoleRequest, reader: jspb.BinaryReader): GetRoleRequest;
}

export namespace GetRoleRequest {
    export type AsObject = {
        id: string,
    }
}

export class GetRoleBySlugRequest extends jspb.Message { 
    getSlug(): string;
    setSlug(value: string): GetRoleBySlugRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetRoleBySlugRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetRoleBySlugRequest): GetRoleBySlugRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetRoleBySlugRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetRoleBySlugRequest;
    static deserializeBinaryFromReader(message: GetRoleBySlugRequest, reader: jspb.BinaryReader): GetRoleBySlugRequest;
}

export namespace GetRoleBySlugRequest {
    export type AsObject = {
        slug: string,
    }
}

export class ListRolesRequest extends jspb.Message { 

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationRequest | undefined;
    setPagination(value?: common_v1_types_pb.PaginationRequest): ListRolesRequest;
    getSearch(): string;
    setSearch(value: string): ListRolesRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListRolesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListRolesRequest): ListRolesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListRolesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListRolesRequest;
    static deserializeBinaryFromReader(message: ListRolesRequest, reader: jspb.BinaryReader): ListRolesRequest;
}

export namespace ListRolesRequest {
    export type AsObject = {
        pagination?: common_v1_types_pb.PaginationRequest.AsObject,
        search: string,
    }
}

export class ListRolesResponse extends jspb.Message { 
    clearItemsList(): void;
    getItemsList(): Array<Role>;
    setItemsList(value: Array<Role>): ListRolesResponse;
    addItems(value?: Role, index?: number): Role;

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationResponse | undefined;
    setPagination(value?: common_v1_types_pb.PaginationResponse): ListRolesResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListRolesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListRolesResponse): ListRolesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListRolesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListRolesResponse;
    static deserializeBinaryFromReader(message: ListRolesResponse, reader: jspb.BinaryReader): ListRolesResponse;
}

export namespace ListRolesResponse {
    export type AsObject = {
        itemsList: Array<Role.AsObject>,
        pagination?: common_v1_types_pb.PaginationResponse.AsObject,
    }
}

export class UpdateRoleRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): UpdateRoleRequest;
    getName(): string;
    setName(value: string): UpdateRoleRequest;
    getDescription(): string;
    setDescription(value: string): UpdateRoleRequest;
    clearPermissionIdsList(): void;
    getPermissionIdsList(): Array<string>;
    setPermissionIdsList(value: Array<string>): UpdateRoleRequest;
    addPermissionIds(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateRoleRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateRoleRequest): UpdateRoleRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateRoleRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateRoleRequest;
    static deserializeBinaryFromReader(message: UpdateRoleRequest, reader: jspb.BinaryReader): UpdateRoleRequest;
}

export namespace UpdateRoleRequest {
    export type AsObject = {
        id: string,
        name: string,
        description: string,
        permissionIdsList: Array<string>,
    }
}

export class DeleteRoleRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): DeleteRoleRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteRoleRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteRoleRequest): DeleteRoleRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteRoleRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteRoleRequest;
    static deserializeBinaryFromReader(message: DeleteRoleRequest, reader: jspb.BinaryReader): DeleteRoleRequest;
}

export namespace DeleteRoleRequest {
    export type AsObject = {
        id: string,
    }
}

export class DeleteRoleResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): DeleteRoleResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteRoleResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteRoleResponse): DeleteRoleResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteRoleResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteRoleResponse;
    static deserializeBinaryFromReader(message: DeleteRoleResponse, reader: jspb.BinaryReader): DeleteRoleResponse;
}

export namespace DeleteRoleResponse {
    export type AsObject = {
        success: boolean,
    }
}

export class AssignPermissionsToRoleRequest extends jspb.Message { 
    getRoleId(): string;
    setRoleId(value: string): AssignPermissionsToRoleRequest;
    clearPermissionIdsList(): void;
    getPermissionIdsList(): Array<string>;
    setPermissionIdsList(value: Array<string>): AssignPermissionsToRoleRequest;
    addPermissionIds(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AssignPermissionsToRoleRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AssignPermissionsToRoleRequest): AssignPermissionsToRoleRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AssignPermissionsToRoleRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AssignPermissionsToRoleRequest;
    static deserializeBinaryFromReader(message: AssignPermissionsToRoleRequest, reader: jspb.BinaryReader): AssignPermissionsToRoleRequest;
}

export namespace AssignPermissionsToRoleRequest {
    export type AsObject = {
        roleId: string,
        permissionIdsList: Array<string>,
    }
}

export class AssignPermissionsToRoleResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): AssignPermissionsToRoleResponse;

    hasRole(): boolean;
    clearRole(): void;
    getRole(): Role | undefined;
    setRole(value?: Role): AssignPermissionsToRoleResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AssignPermissionsToRoleResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AssignPermissionsToRoleResponse): AssignPermissionsToRoleResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AssignPermissionsToRoleResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AssignPermissionsToRoleResponse;
    static deserializeBinaryFromReader(message: AssignPermissionsToRoleResponse, reader: jspb.BinaryReader): AssignPermissionsToRoleResponse;
}

export namespace AssignPermissionsToRoleResponse {
    export type AsObject = {
        success: boolean,
        role?: Role.AsObject,
    }
}
