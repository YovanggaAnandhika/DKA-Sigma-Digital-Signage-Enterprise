// package: signage.distribution.v1.canary
// file: distribution/v1/canary/canary.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as distribution_v1_canary_canary_pb from "../../../distribution/v1/canary/canary_pb";
import * as distribution_v1_canary_canary_common_pb from "../../../distribution/v1/canary/canary.common_pb";

interface ICanaryServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createCanaryGroup: ICanaryServiceService_ICreateCanaryGroup;
    getCanaryGroup: ICanaryServiceService_IGetCanaryGroup;
    listCanaryGroups: ICanaryServiceService_IListCanaryGroups;
    updateCanaryGroup: ICanaryServiceService_IUpdateCanaryGroup;
    deleteCanaryGroup: ICanaryServiceService_IDeleteCanaryGroup;
    evaluateCanary: ICanaryServiceService_IEvaluateCanary;
}

interface ICanaryServiceService_ICreateCanaryGroup extends grpc.MethodDefinition<distribution_v1_canary_canary_common_pb.CreateCanaryGroupRequest, distribution_v1_canary_canary_common_pb.CanaryGroup> {
    path: "/signage.distribution.v1.canary.CanaryService/CreateCanaryGroup";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<distribution_v1_canary_canary_common_pb.CreateCanaryGroupRequest>;
    requestDeserialize: grpc.deserialize<distribution_v1_canary_canary_common_pb.CreateCanaryGroupRequest>;
    responseSerialize: grpc.serialize<distribution_v1_canary_canary_common_pb.CanaryGroup>;
    responseDeserialize: grpc.deserialize<distribution_v1_canary_canary_common_pb.CanaryGroup>;
}
interface ICanaryServiceService_IGetCanaryGroup extends grpc.MethodDefinition<distribution_v1_canary_canary_common_pb.GetCanaryGroupRequest, distribution_v1_canary_canary_common_pb.CanaryGroup> {
    path: "/signage.distribution.v1.canary.CanaryService/GetCanaryGroup";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<distribution_v1_canary_canary_common_pb.GetCanaryGroupRequest>;
    requestDeserialize: grpc.deserialize<distribution_v1_canary_canary_common_pb.GetCanaryGroupRequest>;
    responseSerialize: grpc.serialize<distribution_v1_canary_canary_common_pb.CanaryGroup>;
    responseDeserialize: grpc.deserialize<distribution_v1_canary_canary_common_pb.CanaryGroup>;
}
interface ICanaryServiceService_IListCanaryGroups extends grpc.MethodDefinition<distribution_v1_canary_canary_common_pb.ListCanaryGroupsRequest, distribution_v1_canary_canary_common_pb.ListCanaryGroupsResponse> {
    path: "/signage.distribution.v1.canary.CanaryService/ListCanaryGroups";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<distribution_v1_canary_canary_common_pb.ListCanaryGroupsRequest>;
    requestDeserialize: grpc.deserialize<distribution_v1_canary_canary_common_pb.ListCanaryGroupsRequest>;
    responseSerialize: grpc.serialize<distribution_v1_canary_canary_common_pb.ListCanaryGroupsResponse>;
    responseDeserialize: grpc.deserialize<distribution_v1_canary_canary_common_pb.ListCanaryGroupsResponse>;
}
interface ICanaryServiceService_IUpdateCanaryGroup extends grpc.MethodDefinition<distribution_v1_canary_canary_common_pb.UpdateCanaryGroupRequest, distribution_v1_canary_canary_common_pb.CanaryGroup> {
    path: "/signage.distribution.v1.canary.CanaryService/UpdateCanaryGroup";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<distribution_v1_canary_canary_common_pb.UpdateCanaryGroupRequest>;
    requestDeserialize: grpc.deserialize<distribution_v1_canary_canary_common_pb.UpdateCanaryGroupRequest>;
    responseSerialize: grpc.serialize<distribution_v1_canary_canary_common_pb.CanaryGroup>;
    responseDeserialize: grpc.deserialize<distribution_v1_canary_canary_common_pb.CanaryGroup>;
}
interface ICanaryServiceService_IDeleteCanaryGroup extends grpc.MethodDefinition<distribution_v1_canary_canary_common_pb.DeleteCanaryGroupRequest, distribution_v1_canary_canary_common_pb.DeleteCanaryGroupResponse> {
    path: "/signage.distribution.v1.canary.CanaryService/DeleteCanaryGroup";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<distribution_v1_canary_canary_common_pb.DeleteCanaryGroupRequest>;
    requestDeserialize: grpc.deserialize<distribution_v1_canary_canary_common_pb.DeleteCanaryGroupRequest>;
    responseSerialize: grpc.serialize<distribution_v1_canary_canary_common_pb.DeleteCanaryGroupResponse>;
    responseDeserialize: grpc.deserialize<distribution_v1_canary_canary_common_pb.DeleteCanaryGroupResponse>;
}
interface ICanaryServiceService_IEvaluateCanary extends grpc.MethodDefinition<distribution_v1_canary_canary_common_pb.EvaluateCanaryRequest, distribution_v1_canary_canary_common_pb.EvaluateCanaryResponse> {
    path: "/signage.distribution.v1.canary.CanaryService/EvaluateCanary";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<distribution_v1_canary_canary_common_pb.EvaluateCanaryRequest>;
    requestDeserialize: grpc.deserialize<distribution_v1_canary_canary_common_pb.EvaluateCanaryRequest>;
    responseSerialize: grpc.serialize<distribution_v1_canary_canary_common_pb.EvaluateCanaryResponse>;
    responseDeserialize: grpc.deserialize<distribution_v1_canary_canary_common_pb.EvaluateCanaryResponse>;
}

export const CanaryServiceService: ICanaryServiceService;

export interface ICanaryServiceServer extends grpc.UntypedServiceImplementation {
    createCanaryGroup: grpc.handleUnaryCall<distribution_v1_canary_canary_common_pb.CreateCanaryGroupRequest, distribution_v1_canary_canary_common_pb.CanaryGroup>;
    getCanaryGroup: grpc.handleUnaryCall<distribution_v1_canary_canary_common_pb.GetCanaryGroupRequest, distribution_v1_canary_canary_common_pb.CanaryGroup>;
    listCanaryGroups: grpc.handleUnaryCall<distribution_v1_canary_canary_common_pb.ListCanaryGroupsRequest, distribution_v1_canary_canary_common_pb.ListCanaryGroupsResponse>;
    updateCanaryGroup: grpc.handleUnaryCall<distribution_v1_canary_canary_common_pb.UpdateCanaryGroupRequest, distribution_v1_canary_canary_common_pb.CanaryGroup>;
    deleteCanaryGroup: grpc.handleUnaryCall<distribution_v1_canary_canary_common_pb.DeleteCanaryGroupRequest, distribution_v1_canary_canary_common_pb.DeleteCanaryGroupResponse>;
    evaluateCanary: grpc.handleUnaryCall<distribution_v1_canary_canary_common_pb.EvaluateCanaryRequest, distribution_v1_canary_canary_common_pb.EvaluateCanaryResponse>;
}

export interface ICanaryServiceClient {
    createCanaryGroup(request: distribution_v1_canary_canary_common_pb.CreateCanaryGroupRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    createCanaryGroup(request: distribution_v1_canary_canary_common_pb.CreateCanaryGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    createCanaryGroup(request: distribution_v1_canary_canary_common_pb.CreateCanaryGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    getCanaryGroup(request: distribution_v1_canary_canary_common_pb.GetCanaryGroupRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    getCanaryGroup(request: distribution_v1_canary_canary_common_pb.GetCanaryGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    getCanaryGroup(request: distribution_v1_canary_canary_common_pb.GetCanaryGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    listCanaryGroups(request: distribution_v1_canary_canary_common_pb.ListCanaryGroupsRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.ListCanaryGroupsResponse) => void): grpc.ClientUnaryCall;
    listCanaryGroups(request: distribution_v1_canary_canary_common_pb.ListCanaryGroupsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.ListCanaryGroupsResponse) => void): grpc.ClientUnaryCall;
    listCanaryGroups(request: distribution_v1_canary_canary_common_pb.ListCanaryGroupsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.ListCanaryGroupsResponse) => void): grpc.ClientUnaryCall;
    updateCanaryGroup(request: distribution_v1_canary_canary_common_pb.UpdateCanaryGroupRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    updateCanaryGroup(request: distribution_v1_canary_canary_common_pb.UpdateCanaryGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    updateCanaryGroup(request: distribution_v1_canary_canary_common_pb.UpdateCanaryGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    deleteCanaryGroup(request: distribution_v1_canary_canary_common_pb.DeleteCanaryGroupRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.DeleteCanaryGroupResponse) => void): grpc.ClientUnaryCall;
    deleteCanaryGroup(request: distribution_v1_canary_canary_common_pb.DeleteCanaryGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.DeleteCanaryGroupResponse) => void): grpc.ClientUnaryCall;
    deleteCanaryGroup(request: distribution_v1_canary_canary_common_pb.DeleteCanaryGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.DeleteCanaryGroupResponse) => void): grpc.ClientUnaryCall;
    evaluateCanary(request: distribution_v1_canary_canary_common_pb.EvaluateCanaryRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.EvaluateCanaryResponse) => void): grpc.ClientUnaryCall;
    evaluateCanary(request: distribution_v1_canary_canary_common_pb.EvaluateCanaryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.EvaluateCanaryResponse) => void): grpc.ClientUnaryCall;
    evaluateCanary(request: distribution_v1_canary_canary_common_pb.EvaluateCanaryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.EvaluateCanaryResponse) => void): grpc.ClientUnaryCall;
}

export class CanaryServiceClient extends grpc.Client implements ICanaryServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createCanaryGroup(request: distribution_v1_canary_canary_common_pb.CreateCanaryGroupRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    public createCanaryGroup(request: distribution_v1_canary_canary_common_pb.CreateCanaryGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    public createCanaryGroup(request: distribution_v1_canary_canary_common_pb.CreateCanaryGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    public getCanaryGroup(request: distribution_v1_canary_canary_common_pb.GetCanaryGroupRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    public getCanaryGroup(request: distribution_v1_canary_canary_common_pb.GetCanaryGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    public getCanaryGroup(request: distribution_v1_canary_canary_common_pb.GetCanaryGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    public listCanaryGroups(request: distribution_v1_canary_canary_common_pb.ListCanaryGroupsRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.ListCanaryGroupsResponse) => void): grpc.ClientUnaryCall;
    public listCanaryGroups(request: distribution_v1_canary_canary_common_pb.ListCanaryGroupsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.ListCanaryGroupsResponse) => void): grpc.ClientUnaryCall;
    public listCanaryGroups(request: distribution_v1_canary_canary_common_pb.ListCanaryGroupsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.ListCanaryGroupsResponse) => void): grpc.ClientUnaryCall;
    public updateCanaryGroup(request: distribution_v1_canary_canary_common_pb.UpdateCanaryGroupRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    public updateCanaryGroup(request: distribution_v1_canary_canary_common_pb.UpdateCanaryGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    public updateCanaryGroup(request: distribution_v1_canary_canary_common_pb.UpdateCanaryGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.CanaryGroup) => void): grpc.ClientUnaryCall;
    public deleteCanaryGroup(request: distribution_v1_canary_canary_common_pb.DeleteCanaryGroupRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.DeleteCanaryGroupResponse) => void): grpc.ClientUnaryCall;
    public deleteCanaryGroup(request: distribution_v1_canary_canary_common_pb.DeleteCanaryGroupRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.DeleteCanaryGroupResponse) => void): grpc.ClientUnaryCall;
    public deleteCanaryGroup(request: distribution_v1_canary_canary_common_pb.DeleteCanaryGroupRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.DeleteCanaryGroupResponse) => void): grpc.ClientUnaryCall;
    public evaluateCanary(request: distribution_v1_canary_canary_common_pb.EvaluateCanaryRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.EvaluateCanaryResponse) => void): grpc.ClientUnaryCall;
    public evaluateCanary(request: distribution_v1_canary_canary_common_pb.EvaluateCanaryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.EvaluateCanaryResponse) => void): grpc.ClientUnaryCall;
    public evaluateCanary(request: distribution_v1_canary_canary_common_pb.EvaluateCanaryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_canary_canary_common_pb.EvaluateCanaryResponse) => void): grpc.ClientUnaryCall;
}
