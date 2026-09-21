// package: signage.iam.v1.role_group
// file: iam/v1/role_group/role_group.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as iam_v1_role_group_role_group_pb from "../../../iam/v1/role_group/role_group_pb";
import * as iam_v1_role_group_role_group_common_pb from "../../../iam/v1/role_group/role_group.common_pb";

interface IRoleGroupServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createRoleGroup: IRoleGroupServiceService_ICreateRoleGroup;
    getRoleGroup: IRoleGroupServiceService_IGetRoleGroup;
    listRoleGroups: IRoleGroupServiceService_IListRoleGroups;
    updateRoleGroup: IRoleGroupServiceService_IUpdateRoleGroup;
    deleteRoleGroup: IRoleGroupServiceService_IDeleteRoleGroup;
    assignRolesToGroup: IRoleGroupServiceService_IAssignRolesToGroup;
}

interface IRoleGroupServiceService_ICreateRoleGroup extends grpc.MethodDefinition<iam_v1_role_group_role_group_common_pb.CreateRoleGroupRequest, iam_v1_role_group_role_group_common_pb.RoleGroup> {
    path: "/signage.iam.v1.role_group.RoleGroupService/CreateRoleGroup";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_role_group_role_group_common_pb.CreateRoleGroupRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_role_group_role_group_common_pb.CreateRoleGroupRequest>;
    responseSerialize: grpc.serialize<iam_v1_role_group_role_group_common_pb.RoleGroup>;
    responseDeserialize: grpc.deserialize<iam_v1_role_group_role_group_common_pb.RoleGroup>;
}
interface IRoleGroupServiceService_IGetRoleGroup extends grpc.MethodDefinition<iam_v1_role_group_role_group_common_pb.GetRoleGroupRequest, iam_v1_role_group_role_group_common_pb.RoleGroup> {
    path: "/signage.iam.v1.role_group.RoleGroupService/GetRoleGroup";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_role_group_role_group_common_pb.GetRoleGroupRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_role_group_role_group_common_pb.GetRoleGroupRequest>;
    responseSerialize: grpc.serialize<iam_v1_role_group_role_group_common_pb.RoleGroup>;
    responseDeserialize: grpc.deserialize<iam_v1_role_group_role_group_common_pb.RoleGroup>;
}
interface IRoleGroupServiceService_IListRoleGroups extends grpc.MethodDefinition<iam_v1_role_group_role_group_common_pb.ListRoleGroupsRequest, iam_v1_role_group_role_group_common_pb.ListRoleGroupsResponse> {
    path: "/signage.iam.v1.role_group.RoleGroupService/ListRoleGroups";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_role_group_role_group_common_pb.ListRoleGroupsRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_role_group_role_group_common_pb.ListRoleGroupsRequest>;
    responseSerialize: grpc.serialize<iam_v1_role_group_role_group_common_pb.ListRoleGroupsResponse>;
    responseDeserialize: grpc.deserialize<iam_v1_role_group_role_group_common_pb.ListRoleGroupsResponse>;
}
interface IRoleGroupServiceService_IUpdateRoleGroup extends grpc.MethodDefinition<iam_v1_role_group_role_group_common_pb.UpdateRoleGroupRequest, iam_v1_role_group_role_group_common_pb.RoleGroup> {
    path: "/signage.iam.v1.role_group.RoleGroupService/UpdateRoleGroup";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_role_group_role_group_common_pb.UpdateRoleGroupRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_role_group_role_group_common_pb.UpdateRoleGroupRequest>;
    responseSerialize: grpc.serialize<iam_v1_role_group_role_group_common_pb.RoleGroup>;
    responseDeserialize: grpc.deserialize<iam_v1_role_group_role_group_common_pb.RoleGroup>;
}
interface IRoleGroupServiceService_IDeleteRoleGroup extends grpc.MethodDefinition<iam_v1_role_group_role_group_common_pb.DeleteRoleGroupRequest, iam_v1_role_group_role_group_common_pb.DeleteRoleGroupResponse> {
    path: "/signage.iam.v1.role_group.RoleGroupService/DeleteRoleGroup";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_role_group_role_group_common_pb.DeleteRoleGroupRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_role_group_role_group_common_pb.DeleteRoleGroupRequest>;
    responseSerialize: grpc.serialize<iam_v1_role_group_role_group_common_pb.DeleteRoleGroupResponse>;
    responseDeserialize: grpc.deserialize<iam_v1_role_group_role_group_common_pb.DeleteRoleGroupResponse>;
}
interface IRoleGroupServiceService_IAssignRolesToGroup extends grpc.MethodDefinition<iam_v1_role_group_role_group_common_pb.AssignRolesToGroupRequest, iam_v1_role_group_role_group_common_pb.AssignRolesToGroupResponse> {
    path: "/signage.iam.v1.role_group.RoleGroupService/AssignRolesToGroup";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_role_group_role_group_common_pb.AssignRolesToGroupRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_role_group_role_group_common_pb.AssignRolesToGroupRequest>;
    responseSerialize: grpc.serialize<iam_v1_role_group_role_group_common_pb.AssignRolesToGroupResponse>;
    responseDeserialize: grpc.deserialize<iam_v1_role_group_role_group_common_pb.AssignRolesToGroupResponse>;
}

export const RoleGroupServiceService: IRoleGroupServiceService;

export interface IRoleGroupServiceServer extends grpc.UntypedServiceImplementation {
    createRoleGroup: grpc.handleUnaryCall<iam_v1_role_group_role_group_common_pb.CreateRoleGroupRequest, iam_v1_role_group_role_group_common_pb.RoleGroup>;
    getRoleGroup: grpc.handleUnaryCall<iam_v1_role_group_role_group_common_pb.GetRoleGroupRequest, iam_v1_role_group_role_group_common_pb.RoleGroup>;
    listRoleGroups: grpc.handleUnaryCall<iam_v1_role_group_role_group_common_pb.ListRoleGroupsRequest, iam_v1_role_group_role_group_common_pb.ListRoleGroupsResponse>;
    updateRoleGroup: grpc.handleUnaryCall<iam_v1_role_group_role_group_common_pb.UpdateRoleGroupRequest, iam_v1_role_group_role_group_common_pb.RoleGroup>;
    deleteRoleGroup: grpc.handleUnaryCall<iam_v1_role_group_role_group_common_pb.DeleteRoleGroupRequest, iam_v1_role_group_role_group_common_pb.DeleteRoleGroupResponse>;
    assignRolesToGroup: grpc.handleUnaryCall<iam_v1_role_group_role_group_common_pb.AssignRolesToGroupRequest, iam_v1_role_group_role_group_common_pb.AssignRolesToGroupResponse>;
}

export interface IRoleGroupServiceClient {
    createRoleGroup(request: iam_v1_role_group_role_group_common_pb.CreateRoleGroupRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    createRoleGroup(request: iam_v1_role_group_role_group_common_pb.CreateRoleGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    createRoleGroup(request: iam_v1_role_group_role_group_common_pb.CreateRoleGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    getRoleGroup(request: iam_v1_role_group_role_group_common_pb.GetRoleGroupRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    getRoleGroup(request: iam_v1_role_group_role_group_common_pb.GetRoleGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    getRoleGroup(request: iam_v1_role_group_role_group_common_pb.GetRoleGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    listRoleGroups(request: iam_v1_role_group_role_group_common_pb.ListRoleGroupsRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.ListRoleGroupsResponse) => void): grpc.ClientUnaryCall;
    listRoleGroups(request: iam_v1_role_group_role_group_common_pb.ListRoleGroupsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.ListRoleGroupsResponse) => void): grpc.ClientUnaryCall;
    listRoleGroups(request: iam_v1_role_group_role_group_common_pb.ListRoleGroupsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.ListRoleGroupsResponse) => void): grpc.ClientUnaryCall;
    updateRoleGroup(request: iam_v1_role_group_role_group_common_pb.UpdateRoleGroupRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    updateRoleGroup(request: iam_v1_role_group_role_group_common_pb.UpdateRoleGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    updateRoleGroup(request: iam_v1_role_group_role_group_common_pb.UpdateRoleGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    deleteRoleGroup(request: iam_v1_role_group_role_group_common_pb.DeleteRoleGroupRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.DeleteRoleGroupResponse) => void): grpc.ClientUnaryCall;
    deleteRoleGroup(request: iam_v1_role_group_role_group_common_pb.DeleteRoleGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.DeleteRoleGroupResponse) => void): grpc.ClientUnaryCall;
    deleteRoleGroup(request: iam_v1_role_group_role_group_common_pb.DeleteRoleGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.DeleteRoleGroupResponse) => void): grpc.ClientUnaryCall;
    assignRolesToGroup(request: iam_v1_role_group_role_group_common_pb.AssignRolesToGroupRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.AssignRolesToGroupResponse) => void): grpc.ClientUnaryCall;
    assignRolesToGroup(request: iam_v1_role_group_role_group_common_pb.AssignRolesToGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.AssignRolesToGroupResponse) => void): grpc.ClientUnaryCall;
    assignRolesToGroup(request: iam_v1_role_group_role_group_common_pb.AssignRolesToGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.AssignRolesToGroupResponse) => void): grpc.ClientUnaryCall;
}

export class RoleGroupServiceClient extends grpc.Client implements IRoleGroupServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createRoleGroup(request: iam_v1_role_group_role_group_common_pb.CreateRoleGroupRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    public createRoleGroup(request: iam_v1_role_group_role_group_common_pb.CreateRoleGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    public createRoleGroup(request: iam_v1_role_group_role_group_common_pb.CreateRoleGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    public getRoleGroup(request: iam_v1_role_group_role_group_common_pb.GetRoleGroupRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    public getRoleGroup(request: iam_v1_role_group_role_group_common_pb.GetRoleGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    public getRoleGroup(request: iam_v1_role_group_role_group_common_pb.GetRoleGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    public listRoleGroups(request: iam_v1_role_group_role_group_common_pb.ListRoleGroupsRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.ListRoleGroupsResponse) => void): grpc.ClientUnaryCall;
    public listRoleGroups(request: iam_v1_role_group_role_group_common_pb.ListRoleGroupsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.ListRoleGroupsResponse) => void): grpc.ClientUnaryCall;
    public listRoleGroups(request: iam_v1_role_group_role_group_common_pb.ListRoleGroupsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.ListRoleGroupsResponse) => void): grpc.ClientUnaryCall;
    public updateRoleGroup(request: iam_v1_role_group_role_group_common_pb.UpdateRoleGroupRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    public updateRoleGroup(request: iam_v1_role_group_role_group_common_pb.UpdateRoleGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    public updateRoleGroup(request: iam_v1_role_group_role_group_common_pb.UpdateRoleGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.RoleGroup) => void): grpc.ClientUnaryCall;
    public deleteRoleGroup(request: iam_v1_role_group_role_group_common_pb.DeleteRoleGroupRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.DeleteRoleGroupResponse) => void): grpc.ClientUnaryCall;
    public deleteRoleGroup(request: iam_v1_role_group_role_group_common_pb.DeleteRoleGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.DeleteRoleGroupResponse) => void): grpc.ClientUnaryCall;
    public deleteRoleGroup(request: iam_v1_role_group_role_group_common_pb.DeleteRoleGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.DeleteRoleGroupResponse) => void): grpc.ClientUnaryCall;
    public assignRolesToGroup(request: iam_v1_role_group_role_group_common_pb.AssignRolesToGroupRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.AssignRolesToGroupResponse) => void): grpc.ClientUnaryCall;
    public assignRolesToGroup(request: iam_v1_role_group_role_group_common_pb.AssignRolesToGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.AssignRolesToGroupResponse) => void): grpc.ClientUnaryCall;
    public assignRolesToGroup(request: iam_v1_role_group_role_group_common_pb.AssignRolesToGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_role_group_role_group_common_pb.AssignRolesToGroupResponse) => void): grpc.ClientUnaryCall;
}
