// package: signage.distribution.v1.manifest
// file: distribution/v1/manifest/manifest.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as distribution_v1_manifest_manifest_pb from "../../../distribution/v1/manifest/manifest_pb";
import * as distribution_v1_manifest_manifest_common_pb from "../../../distribution/v1/manifest/manifest.common_pb";

interface IManifestServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getActiveManifest: IManifestServiceService_IGetActiveManifest;
    assignLayoutToDevice: IManifestServiceService_IAssignLayoutToDevice;
}

interface IManifestServiceService_IGetActiveManifest extends grpc.MethodDefinition<distribution_v1_manifest_manifest_common_pb.GetActiveManifestRequest, distribution_v1_manifest_manifest_common_pb.GetActiveManifestResponse> {
    path: "/signage.distribution.v1.manifest.ManifestService/GetActiveManifest";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<distribution_v1_manifest_manifest_common_pb.GetActiveManifestRequest>;
    requestDeserialize: grpc.deserialize<distribution_v1_manifest_manifest_common_pb.GetActiveManifestRequest>;
    responseSerialize: grpc.serialize<distribution_v1_manifest_manifest_common_pb.GetActiveManifestResponse>;
    responseDeserialize: grpc.deserialize<distribution_v1_manifest_manifest_common_pb.GetActiveManifestResponse>;
}
interface IManifestServiceService_IAssignLayoutToDevice extends grpc.MethodDefinition<distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceRequest, distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceResponse> {
    path: "/signage.distribution.v1.manifest.ManifestService/AssignLayoutToDevice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceRequest>;
    requestDeserialize: grpc.deserialize<distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceRequest>;
    responseSerialize: grpc.serialize<distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceResponse>;
    responseDeserialize: grpc.deserialize<distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceResponse>;
}

export const ManifestServiceService: IManifestServiceService;

export interface IManifestServiceServer extends grpc.UntypedServiceImplementation {
    getActiveManifest: grpc.handleUnaryCall<distribution_v1_manifest_manifest_common_pb.GetActiveManifestRequest, distribution_v1_manifest_manifest_common_pb.GetActiveManifestResponse>;
    assignLayoutToDevice: grpc.handleUnaryCall<distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceRequest, distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceResponse>;
}

export interface IManifestServiceClient {
    getActiveManifest(request: distribution_v1_manifest_manifest_common_pb.GetActiveManifestRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_manifest_manifest_common_pb.GetActiveManifestResponse) => void): grpc.ClientUnaryCall;
    getActiveManifest(request: distribution_v1_manifest_manifest_common_pb.GetActiveManifestRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_manifest_manifest_common_pb.GetActiveManifestResponse) => void): grpc.ClientUnaryCall;
    getActiveManifest(request: distribution_v1_manifest_manifest_common_pb.GetActiveManifestRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_manifest_manifest_common_pb.GetActiveManifestResponse) => void): grpc.ClientUnaryCall;
    assignLayoutToDevice(request: distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceResponse) => void): grpc.ClientUnaryCall;
    assignLayoutToDevice(request: distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceResponse) => void): grpc.ClientUnaryCall;
    assignLayoutToDevice(request: distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceResponse) => void): grpc.ClientUnaryCall;
}

export class ManifestServiceClient extends grpc.Client implements IManifestServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public getActiveManifest(request: distribution_v1_manifest_manifest_common_pb.GetActiveManifestRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_manifest_manifest_common_pb.GetActiveManifestResponse) => void): grpc.ClientUnaryCall;
    public getActiveManifest(request: distribution_v1_manifest_manifest_common_pb.GetActiveManifestRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_manifest_manifest_common_pb.GetActiveManifestResponse) => void): grpc.ClientUnaryCall;
    public getActiveManifest(request: distribution_v1_manifest_manifest_common_pb.GetActiveManifestRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_manifest_manifest_common_pb.GetActiveManifestResponse) => void): grpc.ClientUnaryCall;
    public assignLayoutToDevice(request: distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceResponse) => void): grpc.ClientUnaryCall;
    public assignLayoutToDevice(request: distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceResponse) => void): grpc.ClientUnaryCall;
    public assignLayoutToDevice(request: distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceResponse) => void): grpc.ClientUnaryCall;
}
