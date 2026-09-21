// package: signage.iam.v1.user
// file: iam/v1/user/user.common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as common_v1_types_pb from "../../../common/v1/types_pb";
import * as iam_v1_role_role_common_pb from "../../../iam/v1/role/role.common_pb";
import * as iam_v1_role_group_role_group_common_pb from "../../../iam/v1/role_group/role_group.common_pb";

export class User extends jspb.Message { 
    getId(): string;
    setId(value: string): User;
    getEmail(): string;
    setEmail(value: string): User;
    getFullName(): string;
    setFullName(value: string): User;
    getIsActive(): boolean;
    setIsActive(value: boolean): User;
    clearRolesList(): void;
    getRolesList(): Array<iam_v1_role_role_common_pb.Role>;
    setRolesList(value: Array<iam_v1_role_role_common_pb.Role>): User;
    addRoles(value?: iam_v1_role_role_common_pb.Role, index?: number): iam_v1_role_role_common_pb.Role;
    clearRoleGroupsList(): void;
    getRoleGroupsList(): Array<iam_v1_role_group_role_group_common_pb.RoleGroup>;
    setRoleGroupsList(value: Array<iam_v1_role_group_role_group_common_pb.RoleGroup>): User;
    addRoleGroups(value?: iam_v1_role_group_role_group_common_pb.RoleGroup, index?: number): iam_v1_role_group_role_group_common_pb.RoleGroup;
    clearEffectivePermissionsList(): void;
    getEffectivePermissionsList(): Array<string>;
    setEffectivePermissionsList(value: Array<string>): User;
    addEffectivePermissions(value: string, index?: number): string;
    getCreatedAt(): string;
    setCreatedAt(value: string): User;
    getUpdatedAt(): string;
    setUpdatedAt(value: string): User;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): User.AsObject;
    static toObject(includeInstance: boolean, msg: User): User.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: User, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): User;
    static deserializeBinaryFromReader(message: User, reader: jspb.BinaryReader): User;
}

export namespace User {
    export type AsObject = {
        id: string,
        email: string,
        fullName: string,
        isActive: boolean,
        rolesList: Array<iam_v1_role_role_common_pb.Role.AsObject>,
        roleGroupsList: Array<iam_v1_role_group_role_group_common_pb.RoleGroup.AsObject>,
        effectivePermissionsList: Array<string>,
        createdAt: string,
        updatedAt: string,
    }
}

export class CreateUserRequest extends jspb.Message { 
    getEmail(): string;
    setEmail(value: string): CreateUserRequest;
    getPassword(): string;
    setPassword(value: string): CreateUserRequest;
    getFullName(): string;
    setFullName(value: string): CreateUserRequest;
    clearRoleIdsList(): void;
    getRoleIdsList(): Array<string>;
    setRoleIdsList(value: Array<string>): CreateUserRequest;
    addRoleIds(value: string, index?: number): string;
    clearRoleGroupIdsList(): void;
    getRoleGroupIdsList(): Array<string>;
    setRoleGroupIdsList(value: Array<string>): CreateUserRequest;
    addRoleGroupIds(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateUserRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateUserRequest): CreateUserRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateUserRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateUserRequest;
    static deserializeBinaryFromReader(message: CreateUserRequest, reader: jspb.BinaryReader): CreateUserRequest;
}

export namespace CreateUserRequest {
    export type AsObject = {
        email: string,
        password: string,
        fullName: string,
        roleIdsList: Array<string>,
        roleGroupIdsList: Array<string>,
    }
}

export class GetUserRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): GetUserRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetUserRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetUserRequest): GetUserRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetUserRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetUserRequest;
    static deserializeBinaryFromReader(message: GetUserRequest, reader: jspb.BinaryReader): GetUserRequest;
}

export namespace GetUserRequest {
    export type AsObject = {
        id: string,
    }
}

export class ListUsersRequest extends jspb.Message { 

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationRequest | undefined;
    setPagination(value?: common_v1_types_pb.PaginationRequest): ListUsersRequest;
    getSearch(): string;
    setSearch(value: string): ListUsersRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListUsersRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListUsersRequest): ListUsersRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListUsersRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListUsersRequest;
    static deserializeBinaryFromReader(message: ListUsersRequest, reader: jspb.BinaryReader): ListUsersRequest;
}

export namespace ListUsersRequest {
    export type AsObject = {
        pagination?: common_v1_types_pb.PaginationRequest.AsObject,
        search: string,
    }
}

export class ListUsersResponse extends jspb.Message { 
    clearItemsList(): void;
    getItemsList(): Array<User>;
    setItemsList(value: Array<User>): ListUsersResponse;
    addItems(value?: User, index?: number): User;

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationResponse | undefined;
    setPagination(value?: common_v1_types_pb.PaginationResponse): ListUsersResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListUsersResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListUsersResponse): ListUsersResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListUsersResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListUsersResponse;
    static deserializeBinaryFromReader(message: ListUsersResponse, reader: jspb.BinaryReader): ListUsersResponse;
}

export namespace ListUsersResponse {
    export type AsObject = {
        itemsList: Array<User.AsObject>,
        pagination?: common_v1_types_pb.PaginationResponse.AsObject,
    }
}

export class UpdateUserRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): UpdateUserRequest;
    getFullName(): string;
    setFullName(value: string): UpdateUserRequest;
    getIsActive(): boolean;
    setIsActive(value: boolean): UpdateUserRequest;
    clearRoleIdsList(): void;
    getRoleIdsList(): Array<string>;
    setRoleIdsList(value: Array<string>): UpdateUserRequest;
    addRoleIds(value: string, index?: number): string;
    clearRoleGroupIdsList(): void;
    getRoleGroupIdsList(): Array<string>;
    setRoleGroupIdsList(value: Array<string>): UpdateUserRequest;
    addRoleGroupIds(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateUserRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateUserRequest): UpdateUserRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateUserRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateUserRequest;
    static deserializeBinaryFromReader(message: UpdateUserRequest, reader: jspb.BinaryReader): UpdateUserRequest;
}

export namespace UpdateUserRequest {
    export type AsObject = {
        id: string,
        fullName: string,
        isActive: boolean,
        roleIdsList: Array<string>,
        roleGroupIdsList: Array<string>,
    }
}

export class DeleteUserRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): DeleteUserRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteUserRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteUserRequest): DeleteUserRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteUserRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteUserRequest;
    static deserializeBinaryFromReader(message: DeleteUserRequest, reader: jspb.BinaryReader): DeleteUserRequest;
}

export namespace DeleteUserRequest {
    export type AsObject = {
        id: string,
    }
}

export class DeleteUserResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): DeleteUserResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteUserResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteUserResponse): DeleteUserResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteUserResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteUserResponse;
    static deserializeBinaryFromReader(message: DeleteUserResponse, reader: jspb.BinaryReader): DeleteUserResponse;
}

export namespace DeleteUserResponse {
    export type AsObject = {
        success: boolean,
    }
}

export class LoginRequest extends jspb.Message { 
    getEmail(): string;
    setEmail(value: string): LoginRequest;
    getPassword(): string;
    setPassword(value: string): LoginRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LoginRequest.AsObject;
    static toObject(includeInstance: boolean, msg: LoginRequest): LoginRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LoginRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LoginRequest;
    static deserializeBinaryFromReader(message: LoginRequest, reader: jspb.BinaryReader): LoginRequest;
}

export namespace LoginRequest {
    export type AsObject = {
        email: string,
        password: string,
    }
}

export class LoginResponse extends jspb.Message { 
    getToken(): string;
    setToken(value: string): LoginResponse;

    hasUser(): boolean;
    clearUser(): void;
    getUser(): User | undefined;
    setUser(value?: User): LoginResponse;
    getExpiresAt(): number;
    setExpiresAt(value: number): LoginResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LoginResponse.AsObject;
    static toObject(includeInstance: boolean, msg: LoginResponse): LoginResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LoginResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LoginResponse;
    static deserializeBinaryFromReader(message: LoginResponse, reader: jspb.BinaryReader): LoginResponse;
}

export namespace LoginResponse {
    export type AsObject = {
        token: string,
        user?: User.AsObject,
        expiresAt: number,
    }
}
