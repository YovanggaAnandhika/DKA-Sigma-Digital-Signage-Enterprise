// package: signage.iam.v1.role_group
// file: iam/v1/role_group/role_group.common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as common_v1_types_pb from "../../../common/v1/types_pb";
import * as iam_v1_role_role_common_pb from "../../../iam/v1/role/role.common_pb";

export class RoleGroup extends jspb.Message { 
    getId(): string;
    setId(value: string): RoleGroup;
    getName(): string;
    setName(value: string): RoleGroup;
    getSlug(): string;
    setSlug(value: string): RoleGroup;
    getDescription(): string;
    setDescription(value: string): RoleGroup;
    clearRolesList(): void;
    getRolesList(): Array<iam_v1_role_role_common_pb.Role>;
    setRolesList(value: Array<iam_v1_role_role_common_pb.Role>): RoleGroup;
    addRoles(value?: iam_v1_role_role_common_pb.Role, index?: number): iam_v1_role_role_common_pb.Role;
    getCreatedAt(): string;
    setCreatedAt(value: string): RoleGroup;
    getUpdatedAt(): string;
    setUpdatedAt(value: string): RoleGroup;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RoleGroup.AsObject;
    static toObject(includeInstance: boolean, msg: RoleGroup): RoleGroup.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RoleGroup, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RoleGroup;
    static deserializeBinaryFromReader(message: RoleGroup, reader: jspb.BinaryReader): RoleGroup;
}

export namespace RoleGroup {
    export type AsObject = {
        id: string,
        name: string,
        slug: string,
        description: string,
        rolesList: Array<iam_v1_role_role_common_pb.Role.AsObject>,
        createdAt: string,
        updatedAt: string,
    }
}

export class CreateRoleGroupRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateRoleGroupRequest;
    getSlug(): string;
    setSlug(value: string): CreateRoleGroupRequest;
    getDescription(): string;
    setDescription(value: string): CreateRoleGroupRequest;
    clearRoleIdsList(): void;
    getRoleIdsList(): Array<string>;
    setRoleIdsList(value: Array<string>): CreateRoleGroupRequest;
    addRoleIds(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateRoleGroupRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateRoleGroupRequest): CreateRoleGroupRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateRoleGroupRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateRoleGroupRequest;
    static deserializeBinaryFromReader(message: CreateRoleGroupRequest, reader: jspb.BinaryReader): CreateRoleGroupRequest;
}

export namespace CreateRoleGroupRequest {
    export type AsObject = {
        name: string,
        slug: string,
        description: string,
        roleIdsList: Array<string>,
    }
}

export class GetRoleGroupRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): GetRoleGroupRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetRoleGroupRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetRoleGroupRequest): GetRoleGroupRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetRoleGroupRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetRoleGroupRequest;
    static deserializeBinaryFromReader(message: GetRoleGroupRequest, reader: jspb.BinaryReader): GetRoleGroupRequest;
}

export namespace GetRoleGroupRequest {
    export type AsObject = {
        id: string,
    }
}

export class ListRoleGroupsRequest extends jspb.Message { 

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationRequest | undefined;
    setPagination(value?: common_v1_types_pb.PaginationRequest): ListRoleGroupsRequest;
    getSearch(): string;
    setSearch(value: string): ListRoleGroupsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListRoleGroupsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListRoleGroupsRequest): ListRoleGroupsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListRoleGroupsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListRoleGroupsRequest;
    static deserializeBinaryFromReader(message: ListRoleGroupsRequest, reader: jspb.BinaryReader): ListRoleGroupsRequest;
}

export namespace ListRoleGroupsRequest {
    export type AsObject = {
        pagination?: common_v1_types_pb.PaginationRequest.AsObject,
        search: string,
    }
}

export class ListRoleGroupsResponse extends jspb.Message { 
    clearItemsList(): void;
    getItemsList(): Array<RoleGroup>;
    setItemsList(value: Array<RoleGroup>): ListRoleGroupsResponse;
    addItems(value?: RoleGroup, index?: number): RoleGroup;

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationResponse | undefined;
    setPagination(value?: common_v1_types_pb.PaginationResponse): ListRoleGroupsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListRoleGroupsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListRoleGroupsResponse): ListRoleGroupsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListRoleGroupsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListRoleGroupsResponse;
    static deserializeBinaryFromReader(message: ListRoleGroupsResponse, reader: jspb.BinaryReader): ListRoleGroupsResponse;
}

export namespace ListRoleGroupsResponse {
    export type AsObject = {
        itemsList: Array<RoleGroup.AsObject>,
        pagination?: common_v1_types_pb.PaginationResponse.AsObject,
    }
}

export class UpdateRoleGroupRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): UpdateRoleGroupRequest;
    getName(): string;
    setName(value: string): UpdateRoleGroupRequest;
    getDescription(): string;
    setDescription(value: string): UpdateRoleGroupRequest;
    clearRoleIdsList(): void;
    getRoleIdsList(): Array<string>;
    setRoleIdsList(value: Array<string>): UpdateRoleGroupRequest;
    addRoleIds(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateRoleGroupRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateRoleGroupRequest): UpdateRoleGroupRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateRoleGroupRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateRoleGroupRequest;
    static deserializeBinaryFromReader(message: UpdateRoleGroupRequest, reader: jspb.BinaryReader): UpdateRoleGroupRequest;
}

export namespace UpdateRoleGroupRequest {
    export type AsObject = {
        id: string,
        name: string,
        description: string,
        roleIdsList: Array<string>,
    }
}

export class DeleteRoleGroupRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): DeleteRoleGroupRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteRoleGroupRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteRoleGroupRequest): DeleteRoleGroupRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteRoleGroupRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteRoleGroupRequest;
    static deserializeBinaryFromReader(message: DeleteRoleGroupRequest, reader: jspb.BinaryReader): DeleteRoleGroupRequest;
}

export namespace DeleteRoleGroupRequest {
    export type AsObject = {
        id: string,
    }
}

export class DeleteRoleGroupResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): DeleteRoleGroupResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteRoleGroupResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteRoleGroupResponse): DeleteRoleGroupResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteRoleGroupResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteRoleGroupResponse;
    static deserializeBinaryFromReader(message: DeleteRoleGroupResponse, reader: jspb.BinaryReader): DeleteRoleGroupResponse;
}

export namespace DeleteRoleGroupResponse {
    export type AsObject = {
        success: boolean,
    }
}

export class AssignRolesToGroupRequest extends jspb.Message { 
    getRoleGroupId(): string;
    setRoleGroupId(value: string): AssignRolesToGroupRequest;
    clearRoleIdsList(): void;
    getRoleIdsList(): Array<string>;
    setRoleIdsList(value: Array<string>): AssignRolesToGroupRequest;
    addRoleIds(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AssignRolesToGroupRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AssignRolesToGroupRequest): AssignRolesToGroupRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AssignRolesToGroupRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AssignRolesToGroupRequest;
    static deserializeBinaryFromReader(message: AssignRolesToGroupRequest, reader: jspb.BinaryReader): AssignRolesToGroupRequest;
}

export namespace AssignRolesToGroupRequest {
    export type AsObject = {
        roleGroupId: string,
        roleIdsList: Array<string>,
    }
}

export class AssignRolesToGroupResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): AssignRolesToGroupResponse;

    hasRoleGroup(): boolean;
    clearRoleGroup(): void;
    getRoleGroup(): RoleGroup | undefined;
    setRoleGroup(value?: RoleGroup): AssignRolesToGroupResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AssignRolesToGroupResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AssignRolesToGroupResponse): AssignRolesToGroupResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AssignRolesToGroupResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AssignRolesToGroupResponse;
    static deserializeBinaryFromReader(message: AssignRolesToGroupResponse, reader: jspb.BinaryReader): AssignRolesToGroupResponse;
}

export namespace AssignRolesToGroupResponse {
    export type AsObject = {
        success: boolean,
        roleGroup?: RoleGroup.AsObject,
    }
}
