// package: signage.hardware.v1.display_group
// file: hardware/v1/display_group/display_group.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as hardware_v1_display_group_display_group_pb from "../../../hardware/v1/display_group/display_group_pb";
import * as hardware_v1_display_group_display_group_common_pb from "../../../hardware/v1/display_group/display_group.common_pb";

interface IDisplayGroupServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createDisplayGroup: IDisplayGroupServiceService_ICreateDisplayGroup;
    getDisplayGroup: IDisplayGroupServiceService_IGetDisplayGroup;
    listDisplayGroups: IDisplayGroupServiceService_IListDisplayGroups;
    updateDisplayGroup: IDisplayGroupServiceService_IUpdateDisplayGroup;
    deleteDisplayGroup: IDisplayGroupServiceService_IDeleteDisplayGroup;
}

interface IDisplayGroupServiceService_ICreateDisplayGroup extends grpc.MethodDefinition<hardware_v1_display_group_display_group_common_pb.CreateDisplayGroupRequest, hardware_v1_display_group_display_group_common_pb.DisplayGroup> {
    path: "/signage.hardware.v1.display_group.DisplayGroupService/CreateDisplayGroup";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<hardware_v1_display_group_display_group_common_pb.CreateDisplayGroupRequest>;
    requestDeserialize: grpc.deserialize<hardware_v1_display_group_display_group_common_pb.CreateDisplayGroupRequest>;
    responseSerialize: grpc.serialize<hardware_v1_display_group_display_group_common_pb.DisplayGroup>;
    responseDeserialize: grpc.deserialize<hardware_v1_display_group_display_group_common_pb.DisplayGroup>;
}
interface IDisplayGroupServiceService_IGetDisplayGroup extends grpc.MethodDefinition<hardware_v1_display_group_display_group_common_pb.GetDisplayGroupRequest, hardware_v1_display_group_display_group_common_pb.DisplayGroup> {
    path: "/signage.hardware.v1.display_group.DisplayGroupService/GetDisplayGroup";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<hardware_v1_display_group_display_group_common_pb.GetDisplayGroupRequest>;
    requestDeserialize: grpc.deserialize<hardware_v1_display_group_display_group_common_pb.GetDisplayGroupRequest>;
    responseSerialize: grpc.serialize<hardware_v1_display_group_display_group_common_pb.DisplayGroup>;
    responseDeserialize: grpc.deserialize<hardware_v1_display_group_display_group_common_pb.DisplayGroup>;
}
interface IDisplayGroupServiceService_IListDisplayGroups extends grpc.MethodDefinition<hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsRequest, hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsResponse> {
    path: "/signage.hardware.v1.display_group.DisplayGroupService/ListDisplayGroups";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsRequest>;
    requestDeserialize: grpc.deserialize<hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsRequest>;
    responseSerialize: grpc.serialize<hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsResponse>;
    responseDeserialize: grpc.deserialize<hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsResponse>;
}
interface IDisplayGroupServiceService_IUpdateDisplayGroup extends grpc.MethodDefinition<hardware_v1_display_group_display_group_common_pb.UpdateDisplayGroupRequest, hardware_v1_display_group_display_group_common_pb.DisplayGroup> {
    path: "/signage.hardware.v1.display_group.DisplayGroupService/UpdateDisplayGroup";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<hardware_v1_display_group_display_group_common_pb.UpdateDisplayGroupRequest>;
    requestDeserialize: grpc.deserialize<hardware_v1_display_group_display_group_common_pb.UpdateDisplayGroupRequest>;
    responseSerialize: grpc.serialize<hardware_v1_display_group_display_group_common_pb.DisplayGroup>;
    responseDeserialize: grpc.deserialize<hardware_v1_display_group_display_group_common_pb.DisplayGroup>;
}
interface IDisplayGroupServiceService_IDeleteDisplayGroup extends grpc.MethodDefinition<hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupRequest, hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupResponse> {
    path: "/signage.hardware.v1.display_group.DisplayGroupService/DeleteDisplayGroup";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupRequest>;
    requestDeserialize: grpc.deserialize<hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupRequest>;
    responseSerialize: grpc.serialize<hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupResponse>;
    responseDeserialize: grpc.deserialize<hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupResponse>;
}

export const DisplayGroupServiceService: IDisplayGroupServiceService;

export interface IDisplayGroupServiceServer extends grpc.UntypedServiceImplementation {
    createDisplayGroup: grpc.handleUnaryCall<hardware_v1_display_group_display_group_common_pb.CreateDisplayGroupRequest, hardware_v1_display_group_display_group_common_pb.DisplayGroup>;
    getDisplayGroup: grpc.handleUnaryCall<hardware_v1_display_group_display_group_common_pb.GetDisplayGroupRequest, hardware_v1_display_group_display_group_common_pb.DisplayGroup>;
    listDisplayGroups: grpc.handleUnaryCall<hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsRequest, hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsResponse>;
    updateDisplayGroup: grpc.handleUnaryCall<hardware_v1_display_group_display_group_common_pb.UpdateDisplayGroupRequest, hardware_v1_display_group_display_group_common_pb.DisplayGroup>;
    deleteDisplayGroup: grpc.handleUnaryCall<hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupRequest, hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupResponse>;
}

export interface IDisplayGroupServiceClient {
    createDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.CreateDisplayGroupRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    createDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.CreateDisplayGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    createDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.CreateDisplayGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    getDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.GetDisplayGroupRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    getDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.GetDisplayGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    getDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.GetDisplayGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    listDisplayGroups(request: hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsResponse) => void): grpc.ClientUnaryCall;
    listDisplayGroups(request: hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsResponse) => void): grpc.ClientUnaryCall;
    listDisplayGroups(request: hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsResponse) => void): grpc.ClientUnaryCall;
    updateDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.UpdateDisplayGroupRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    updateDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.UpdateDisplayGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    updateDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.UpdateDisplayGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    deleteDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupResponse) => void): grpc.ClientUnaryCall;
    deleteDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupResponse) => void): grpc.ClientUnaryCall;
    deleteDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupResponse) => void): grpc.ClientUnaryCall;
}

export class DisplayGroupServiceClient extends grpc.Client implements IDisplayGroupServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.CreateDisplayGroupRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    public createDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.CreateDisplayGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    public createDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.CreateDisplayGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    public getDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.GetDisplayGroupRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    public getDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.GetDisplayGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    public getDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.GetDisplayGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    public listDisplayGroups(request: hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsResponse) => void): grpc.ClientUnaryCall;
    public listDisplayGroups(request: hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsResponse) => void): grpc.ClientUnaryCall;
    public listDisplayGroups(request: hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsResponse) => void): grpc.ClientUnaryCall;
    public updateDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.UpdateDisplayGroupRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    public updateDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.UpdateDisplayGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    public updateDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.UpdateDisplayGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DisplayGroup) => void): grpc.ClientUnaryCall;
    public deleteDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupResponse) => void): grpc.ClientUnaryCall;
    public deleteDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupResponse) => void): grpc.ClientUnaryCall;
    public deleteDisplayGroup(request: hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupResponse) => void): grpc.ClientUnaryCall;
}
