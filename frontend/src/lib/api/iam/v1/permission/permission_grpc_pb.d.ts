// package: signage.iam.v1.permission
// file: iam/v1/permission/permission.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as iam_v1_permission_permission_pb from "../../../iam/v1/permission/permission_pb";
import * as iam_v1_permission_permission_common_pb from "../../../iam/v1/permission/permission.common_pb";

interface IPermissionServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createPermission: IPermissionServiceService_ICreatePermission;
    getPermission: IPermissionServiceService_IGetPermission;
    getPermissionByCode: IPermissionServiceService_IGetPermissionByCode;
    listPermissions: IPermissionServiceService_IListPermissions;
    updatePermission: IPermissionServiceService_IUpdatePermission;
    deletePermission: IPermissionServiceService_IDeletePermission;
    checkUserPermission: IPermissionServiceService_ICheckUserPermission;
}

interface IPermissionServiceService_ICreatePermission extends grpc.MethodDefinition<iam_v1_permission_permission_common_pb.CreatePermissionRequest, iam_v1_permission_permission_common_pb.Permission> {
    path: "/signage.iam.v1.permission.PermissionService/CreatePermission";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_permission_permission_common_pb.CreatePermissionRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_permission_permission_common_pb.CreatePermissionRequest>;
    responseSerialize: grpc.serialize<iam_v1_permission_permission_common_pb.Permission>;
    responseDeserialize: grpc.deserialize<iam_v1_permission_permission_common_pb.Permission>;
}
interface IPermissionServiceService_IGetPermission extends grpc.MethodDefinition<iam_v1_permission_permission_common_pb.GetPermissionRequest, iam_v1_permission_permission_common_pb.Permission> {
    path: "/signage.iam.v1.permission.PermissionService/GetPermission";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_permission_permission_common_pb.GetPermissionRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_permission_permission_common_pb.GetPermissionRequest>;
    responseSerialize: grpc.serialize<iam_v1_permission_permission_common_pb.Permission>;
    responseDeserialize: grpc.deserialize<iam_v1_permission_permission_common_pb.Permission>;
}
interface IPermissionServiceService_IGetPermissionByCode extends grpc.MethodDefinition<iam_v1_permission_permission_common_pb.GetPermissionByCodeRequest, iam_v1_permission_permission_common_pb.Permission> {
    path: "/signage.iam.v1.permission.PermissionService/GetPermissionByCode";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_permission_permission_common_pb.GetPermissionByCodeRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_permission_permission_common_pb.GetPermissionByCodeRequest>;
    responseSerialize: grpc.serialize<iam_v1_permission_permission_common_pb.Permission>;
    responseDeserialize: grpc.deserialize<iam_v1_permission_permission_common_pb.Permission>;
}
interface IPermissionServiceService_IListPermissions extends grpc.MethodDefinition<iam_v1_permission_permission_common_pb.ListPermissionsRequest, iam_v1_permission_permission_common_pb.ListPermissionsResponse> {
    path: "/signage.iam.v1.permission.PermissionService/ListPermissions";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_permission_permission_common_pb.ListPermissionsRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_permission_permission_common_pb.ListPermissionsRequest>;
    responseSerialize: grpc.serialize<iam_v1_permission_permission_common_pb.ListPermissionsResponse>;
    responseDeserialize: grpc.deserialize<iam_v1_permission_permission_common_pb.ListPermissionsResponse>;
}
interface IPermissionServiceService_IUpdatePermission extends grpc.MethodDefinition<iam_v1_permission_permission_common_pb.UpdatePermissionRequest, iam_v1_permission_permission_common_pb.Permission> {
    path: "/signage.iam.v1.permission.PermissionService/UpdatePermission";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_permission_permission_common_pb.UpdatePermissionRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_permission_permission_common_pb.UpdatePermissionRequest>;
    responseSerialize: grpc.serialize<iam_v1_permission_permission_common_pb.Permission>;
    responseDeserialize: grpc.deserialize<iam_v1_permission_permission_common_pb.Permission>;
}
interface IPermissionServiceService_IDeletePermission extends grpc.MethodDefinition<iam_v1_permission_permission_common_pb.DeletePermissionRequest, iam_v1_permission_permission_common_pb.DeletePermissionResponse> {
    path: "/signage.iam.v1.permission.PermissionService/DeletePermission";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_permission_permission_common_pb.DeletePermissionRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_permission_permission_common_pb.DeletePermissionRequest>;
    responseSerialize: grpc.serialize<iam_v1_permission_permission_common_pb.DeletePermissionResponse>;
    responseDeserialize: grpc.deserialize<iam_v1_permission_permission_common_pb.DeletePermissionResponse>;
}
interface IPermissionServiceService_ICheckUserPermission extends grpc.MethodDefinition<iam_v1_permission_permission_common_pb.CheckUserPermissionRequest, iam_v1_permission_permission_common_pb.CheckUserPermissionResponse> {
    path: "/signage.iam.v1.permission.PermissionService/CheckUserPermission";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_permission_permission_common_pb.CheckUserPermissionRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_permission_permission_common_pb.CheckUserPermissionRequest>;
    responseSerialize: grpc.serialize<iam_v1_permission_permission_common_pb.CheckUserPermissionResponse>;
    responseDeserialize: grpc.deserialize<iam_v1_permission_permission_common_pb.CheckUserPermissionResponse>;
}

export const PermissionServiceService: IPermissionServiceService;

export interface IPermissionServiceServer extends grpc.UntypedServiceImplementation {
    createPermission: grpc.handleUnaryCall<iam_v1_permission_permission_common_pb.CreatePermissionRequest, iam_v1_permission_permission_common_pb.Permission>;
    getPermission: grpc.handleUnaryCall<iam_v1_permission_permission_common_pb.GetPermissionRequest, iam_v1_permission_permission_common_pb.Permission>;
    getPermissionByCode: grpc.handleUnaryCall<iam_v1_permission_permission_common_pb.GetPermissionByCodeRequest, iam_v1_permission_permission_common_pb.Permission>;
    listPermissions: grpc.handleUnaryCall<iam_v1_permission_permission_common_pb.ListPermissionsRequest, iam_v1_permission_permission_common_pb.ListPermissionsResponse>;
    updatePermission: grpc.handleUnaryCall<iam_v1_permission_permission_common_pb.UpdatePermissionRequest, iam_v1_permission_permission_common_pb.Permission>;
    deletePermission: grpc.handleUnaryCall<iam_v1_permission_permission_common_pb.DeletePermissionRequest, iam_v1_permission_permission_common_pb.DeletePermissionResponse>;
    checkUserPermission: grpc.handleUnaryCall<iam_v1_permission_permission_common_pb.CheckUserPermissionRequest, iam_v1_permission_permission_common_pb.CheckUserPermissionResponse>;
}

export interface IPermissionServiceClient {
    createPermission(request: iam_v1_permission_permission_common_pb.CreatePermissionRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    createPermission(request: iam_v1_permission_permission_common_pb.CreatePermissionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    createPermission(request: iam_v1_permission_permission_common_pb.CreatePermissionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    getPermission(request: iam_v1_permission_permission_common_pb.GetPermissionRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    getPermission(request: iam_v1_permission_permission_common_pb.GetPermissionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    getPermission(request: iam_v1_permission_permission_common_pb.GetPermissionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    getPermissionByCode(request: iam_v1_permission_permission_common_pb.GetPermissionByCodeRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    getPermissionByCode(request: iam_v1_permission_permission_common_pb.GetPermissionByCodeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    getPermissionByCode(request: iam_v1_permission_permission_common_pb.GetPermissionByCodeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    listPermissions(request: iam_v1_permission_permission_common_pb.ListPermissionsRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.ListPermissionsResponse) => void): grpc.ClientUnaryCall;
    listPermissions(request: iam_v1_permission_permission_common_pb.ListPermissionsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.ListPermissionsResponse) => void): grpc.ClientUnaryCall;
    listPermissions(request: iam_v1_permission_permission_common_pb.ListPermissionsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.ListPermissionsResponse) => void): grpc.ClientUnaryCall;
    updatePermission(request: iam_v1_permission_permission_common_pb.UpdatePermissionRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    updatePermission(request: iam_v1_permission_permission_common_pb.UpdatePermissionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    updatePermission(request: iam_v1_permission_permission_common_pb.UpdatePermissionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    deletePermission(request: iam_v1_permission_permission_common_pb.DeletePermissionRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.DeletePermissionResponse) => void): grpc.ClientUnaryCall;
    deletePermission(request: iam_v1_permission_permission_common_pb.DeletePermissionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.DeletePermissionResponse) => void): grpc.ClientUnaryCall;
    deletePermission(request: iam_v1_permission_permission_common_pb.DeletePermissionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.DeletePermissionResponse) => void): grpc.ClientUnaryCall;
    checkUserPermission(request: iam_v1_permission_permission_common_pb.CheckUserPermissionRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.CheckUserPermissionResponse) => void): grpc.ClientUnaryCall;
    checkUserPermission(request: iam_v1_permission_permission_common_pb.CheckUserPermissionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.CheckUserPermissionResponse) => void): grpc.ClientUnaryCall;
    checkUserPermission(request: iam_v1_permission_permission_common_pb.CheckUserPermissionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.CheckUserPermissionResponse) => void): grpc.ClientUnaryCall;
}

export class PermissionServiceClient extends grpc.Client implements IPermissionServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createPermission(request: iam_v1_permission_permission_common_pb.CreatePermissionRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    public createPermission(request: iam_v1_permission_permission_common_pb.CreatePermissionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    public createPermission(request: iam_v1_permission_permission_common_pb.CreatePermissionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    public getPermission(request: iam_v1_permission_permission_common_pb.GetPermissionRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    public getPermission(request: iam_v1_permission_permission_common_pb.GetPermissionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    public getPermission(request: iam_v1_permission_permission_common_pb.GetPermissionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    public getPermissionByCode(request: iam_v1_permission_permission_common_pb.GetPermissionByCodeRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    public getPermissionByCode(request: iam_v1_permission_permission_common_pb.GetPermissionByCodeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    public getPermissionByCode(request: iam_v1_permission_permission_common_pb.GetPermissionByCodeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    public listPermissions(request: iam_v1_permission_permission_common_pb.ListPermissionsRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.ListPermissionsResponse) => void): grpc.ClientUnaryCall;
    public listPermissions(request: iam_v1_permission_permission_common_pb.ListPermissionsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.ListPermissionsResponse) => void): grpc.ClientUnaryCall;
    public listPermissions(request: iam_v1_permission_permission_common_pb.ListPermissionsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.ListPermissionsResponse) => void): grpc.ClientUnaryCall;
    public updatePermission(request: iam_v1_permission_permission_common_pb.UpdatePermissionRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    public updatePermission(request: iam_v1_permission_permission_common_pb.UpdatePermissionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    public updatePermission(request: iam_v1_permission_permission_common_pb.UpdatePermissionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.Permission) => void): grpc.ClientUnaryCall;
    public deletePermission(request: iam_v1_permission_permission_common_pb.DeletePermissionRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.DeletePermissionResponse) => void): grpc.ClientUnaryCall;
    public deletePermission(request: iam_v1_permission_permission_common_pb.DeletePermissionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.DeletePermissionResponse) => void): grpc.ClientUnaryCall;
    public deletePermission(request: iam_v1_permission_permission_common_pb.DeletePermissionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.DeletePermissionResponse) => void): grpc.ClientUnaryCall;
    public checkUserPermission(request: iam_v1_permission_permission_common_pb.CheckUserPermissionRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.CheckUserPermissionResponse) => void): grpc.ClientUnaryCall;
    public checkUserPermission(request: iam_v1_permission_permission_common_pb.CheckUserPermissionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.CheckUserPermissionResponse) => void): grpc.ClientUnaryCall;
    public checkUserPermission(request: iam_v1_permission_permission_common_pb.CheckUserPermissionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_permission_permission_common_pb.CheckUserPermissionResponse) => void): grpc.ClientUnaryCall;
}
