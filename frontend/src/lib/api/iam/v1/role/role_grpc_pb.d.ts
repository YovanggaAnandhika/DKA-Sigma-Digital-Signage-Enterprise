// package: signage.iam.v1.role
// file: iam/v1/role/role.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as iam_v1_role_role_pb from "../../../iam/v1/role/role_pb";
import * as iam_v1_role_role_common_pb from "../../../iam/v1/role/role.common_pb";

interface IRoleServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createRole: IRoleServiceService_ICreateRole;
    getRole: IRoleServiceService_IGetRole;
    getRoleBySlug: IRoleServiceService_IGetRoleBySlug;
    listRoles: IRoleServiceService_IListRoles;
    updateRole: IRoleServiceService_IUpdateRole;
    deleteRole: IRoleServiceService_IDeleteRole;
    assignPermissionsToRole: IRoleServiceService_IAssignPermissionsToRole;
}

interface IRoleServiceService_ICreateRole extends grpc.MethodDefinition<iam_v1_role_role_common_pb.CreateRoleRequest, iam_v1_role_role_common_pb.Role> {
    path: "/signage.iam.v1.role.RoleService/CreateRole";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_role_role_common_pb.CreateRoleRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_role_role_common_pb.CreateRoleRequest>;
    responseSerialize: grpc.serialize<iam_v1_role_role_common_pb.Role>;
    responseDeserialize: grpc.deserialize<iam_v1_role_role_common_pb.Role>;
}
interface IRoleServiceService_IGetRole extends grpc.MethodDefinition<iam_v1_role_role_common_pb.GetRoleRequest, iam_v1_role_role_common_pb.Role> {
    path: "/signage.iam.v1.role.RoleService/GetRole";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_role_role_common_pb.GetRoleRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_role_role_common_pb.GetRoleRequest>;
    responseSerialize: grpc.serialize<iam_v1_role_role_common_pb.Role>;
    responseDeserialize: grpc.deserialize<iam_v1_role_role_common_pb.Role>;
}
interface IRoleServiceService_IGetRoleBySlug extends grpc.MethodDefinition<iam_v1_role_role_common_pb.GetRoleBySlugRequest, iam_v1_role_role_common_pb.Role> {
    path: "/signage.iam.v1.role.RoleService/GetRoleBySlug";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_role_role_common_pb.GetRoleBySlugRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_role_role_common_pb.GetRoleBySlugRequest>;
    responseSerialize: grpc.serialize<iam_v1_role_role_common_pb.Role>;
    responseDeserialize: grpc.deserialize<iam_v1_role_role_common_pb.Role>;
}
interface IRoleServiceService_IListRoles extends grpc.MethodDefinition<iam_v1_role_role_common_pb.ListRolesRequest, iam_v1_role_role_common_pb.ListRolesResponse> {
    path: "/signage.iam.v1.role.RoleService/ListRoles";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_role_role_common_pb.ListRolesRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_role_role_common_pb.ListRolesRequest>;
    responseSerialize: grpc.serialize<iam_v1_role_role_common_pb.ListRolesResponse>;
    responseDeserialize: grpc.deserialize<iam_v1_role_role_common_pb.ListRolesResponse>;
}
interface IRoleServiceService_IUpdateRole extends grpc.MethodDefinition<iam_v1_role_role_common_pb.UpdateRoleRequest, iam_v1_role_role_common_pb.Role> {
    path: "/signage.iam.v1.role.RoleService/UpdateRole";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_role_role_common_pb.UpdateRoleRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_role_role_common_pb.UpdateRoleRequest>;
    responseSerialize: grpc.serialize<iam_v1_role_role_common_pb.Role>;
    responseDeserialize: grpc.deserialize<iam_v1_role_role_common_pb.Role>;
}
interface IRoleServiceService_IDeleteRole extends grpc.MethodDefinition<iam_v1_role_role_common_pb.DeleteRoleRequest, iam_v1_role_role_common_pb.DeleteRoleResponse> {
    path: "/signage.iam.v1.role.RoleService/DeleteRole";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_role_role_common_pb.DeleteRoleRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_role_role_common_pb.DeleteRoleRequest>;
    responseSerialize: grpc.serialize<iam_v1_role_role_common_pb.DeleteRoleResponse>;
    responseDeserialize: grpc.deserialize<iam_v1_role_role_common_pb.DeleteRoleResponse>;
}
interface IRoleServiceService_IAssignPermissionsToRole extends grpc.MethodDefinition<iam_v1_role_role_common_pb.AssignPermissionsToRoleRequest, iam_v1_role_role_common_pb.AssignPermissionsToRoleResponse> {
    path: "/signage.iam.v1.role.RoleService/AssignPermissionsToRole";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_role_role_common_pb.AssignPermissionsToRoleRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_role_role_common_pb.AssignPermissionsToRoleRequest>;
    responseSerialize: grpc.serialize<iam_v1_role_role_common_pb.AssignPermissionsToRoleResponse>;
    responseDeserialize: grpc.deserialize<iam_v1_role_role_common_pb.AssignPermissionsToRoleResponse>;
}

export const RoleServiceService: IRoleServiceService;

export interface IRoleServiceServer extends grpc.UntypedServiceImplementation {
    createRole: grpc.handleUnaryCall<iam_v1_role_role_common_pb.CreateRoleRequest, iam_v1_role_role_common_pb.Role>;
    getRole: grpc.handleUnaryCall<iam_v1_role_role_common_pb.GetRoleRequest, iam_v1_role_role_common_pb.Role>;
    getRoleBySlug: grpc.handleUnaryCall<iam_v1_role_role_common_pb.GetRoleBySlugRequest, iam_v1_role_role_common_pb.Role>;
    listRoles: grpc.handleUnaryCall<iam_v1_role_role_common_pb.ListRolesRequest, iam_v1_role_role_common_pb.ListRolesResponse>;
    updateRole: grpc.handleUnaryCall<iam_v1_role_role_common_pb.UpdateRoleRequest, iam_v1_role_role_common_pb.Role>;
    deleteRole: grpc.handleUnaryCall<iam_v1_role_role_common_pb.DeleteRoleRequest, iam_v1_role_role_common_pb.DeleteRoleResponse>;
    assignPermissionsToRole: grpc.handleUnaryCall<iam_v1_role_role_common_pb.AssignPermissionsToRoleRequest, iam_v1_role_role_common_pb.AssignPermissionsToRoleResponse>;
}

export interface IRoleServiceClient {
    createRole(request: iam_v1_role_role_common_pb.CreateRoleRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    createRole(request: iam_v1_role_role_common_pb.CreateRoleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    createRole(request: iam_v1_role_role_common_pb.CreateRoleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    getRole(request: iam_v1_role_role_common_pb.GetRoleRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    getRole(request: iam_v1_role_role_common_pb.GetRoleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    getRole(request: iam_v1_role_role_common_pb.GetRoleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    getRoleBySlug(request: iam_v1_role_role_common_pb.GetRoleBySlugRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    getRoleBySlug(request: iam_v1_role_role_common_pb.GetRoleBySlugRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    getRoleBySlug(request: iam_v1_role_role_common_pb.GetRoleBySlugRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    listRoles(request: iam_v1_role_role_common_pb.ListRolesRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.ListRolesResponse) => void): grpc.ClientUnaryCall;
    listRoles(request: iam_v1_role_role_common_pb.ListRolesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.ListRolesResponse) => void): grpc.ClientUnaryCall;
    listRoles(request: iam_v1_role_role_common_pb.ListRolesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.ListRolesResponse) => void): grpc.ClientUnaryCall;
    updateRole(request: iam_v1_role_role_common_pb.UpdateRoleRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    updateRole(request: iam_v1_role_role_common_pb.UpdateRoleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    updateRole(request: iam_v1_role_role_common_pb.UpdateRoleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    deleteRole(request: iam_v1_role_role_common_pb.DeleteRoleRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.DeleteRoleResponse) => void): grpc.ClientUnaryCall;
    deleteRole(request: iam_v1_role_role_common_pb.DeleteRoleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.DeleteRoleResponse) => void): grpc.ClientUnaryCall;
    deleteRole(request: iam_v1_role_role_common_pb.DeleteRoleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.DeleteRoleResponse) => void): grpc.ClientUnaryCall;
    assignPermissionsToRole(request: iam_v1_role_role_common_pb.AssignPermissionsToRoleRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.AssignPermissionsToRoleResponse) => void): grpc.ClientUnaryCall;
    assignPermissionsToRole(request: iam_v1_role_role_common_pb.AssignPermissionsToRoleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.AssignPermissionsToRoleResponse) => void): grpc.ClientUnaryCall;
    assignPermissionsToRole(request: iam_v1_role_role_common_pb.AssignPermissionsToRoleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.AssignPermissionsToRoleResponse) => void): grpc.ClientUnaryCall;
}

export class RoleServiceClient extends grpc.Client implements IRoleServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createRole(request: iam_v1_role_role_common_pb.CreateRoleRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    public createRole(request: iam_v1_role_role_common_pb.CreateRoleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    public createRole(request: iam_v1_role_role_common_pb.CreateRoleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    public getRole(request: iam_v1_role_role_common_pb.GetRoleRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    public getRole(request: iam_v1_role_role_common_pb.GetRoleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    public getRole(request: iam_v1_role_role_common_pb.GetRoleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    public getRoleBySlug(request: iam_v1_role_role_common_pb.GetRoleBySlugRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    public getRoleBySlug(request: iam_v1_role_role_common_pb.GetRoleBySlugRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    public getRoleBySlug(request: iam_v1_role_role_common_pb.GetRoleBySlugRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    public listRoles(request: iam_v1_role_role_common_pb.ListRolesRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.ListRolesResponse) => void): grpc.ClientUnaryCall;
    public listRoles(request: iam_v1_role_role_common_pb.ListRolesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.ListRolesResponse) => void): grpc.ClientUnaryCall;
    public listRoles(request: iam_v1_role_role_common_pb.ListRolesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.ListRolesResponse) => void): grpc.ClientUnaryCall;
    public updateRole(request: iam_v1_role_role_common_pb.UpdateRoleRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    public updateRole(request: iam_v1_role_role_common_pb.UpdateRoleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    public updateRole(request: iam_v1_role_role_common_pb.UpdateRoleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.Role) => void): grpc.ClientUnaryCall;
    public deleteRole(request: iam_v1_role_role_common_pb.DeleteRoleRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.DeleteRoleResponse) => void): grpc.ClientUnaryCall;
    public deleteRole(request: iam_v1_role_role_common_pb.DeleteRoleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.DeleteRoleResponse) => void): grpc.ClientUnaryCall;
    public deleteRole(request: iam_v1_role_role_common_pb.DeleteRoleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.DeleteRoleResponse) => void): grpc.ClientUnaryCall;
    public assignPermissionsToRole(request: iam_v1_role_role_common_pb.AssignPermissionsToRoleRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.AssignPermissionsToRoleResponse) => void): grpc.ClientUnaryCall;
    public assignPermissionsToRole(request: iam_v1_role_role_common_pb.AssignPermissionsToRoleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.AssignPermissionsToRoleResponse) => void): grpc.ClientUnaryCall;
    public assignPermissionsToRole(request: iam_v1_role_role_common_pb.AssignPermissionsToRoleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_role_common_pb.AssignPermissionsToRoleResponse) => void): grpc.ClientUnaryCall;
}
