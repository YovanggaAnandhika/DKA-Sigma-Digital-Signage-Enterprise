// package: signage.distribution.v1.stream
// file: distribution/v1/stream/stream.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as distribution_v1_stream_stream_pb from "../../../distribution/v1/stream/stream_pb";
import * as distribution_v1_stream_stream_common_pb from "../../../distribution/v1/stream/stream.common_pb";

interface IStreamServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    displayStream: IStreamServiceService_IDisplayStream;
    pushCommand: IStreamServiceService_IPushCommand;
}

interface IStreamServiceService_IDisplayStream extends grpc.MethodDefinition<distribution_v1_stream_stream_common_pb.StreamClientMessage, distribution_v1_stream_stream_common_pb.StreamServerMessage> {
    path: "/signage.distribution.v1.stream.StreamService/DisplayStream";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<distribution_v1_stream_stream_common_pb.StreamClientMessage>;
    requestDeserialize: grpc.deserialize<distribution_v1_stream_stream_common_pb.StreamClientMessage>;
    responseSerialize: grpc.serialize<distribution_v1_stream_stream_common_pb.StreamServerMessage>;
    responseDeserialize: grpc.deserialize<distribution_v1_stream_stream_common_pb.StreamServerMessage>;
}
interface IStreamServiceService_IPushCommand extends grpc.MethodDefinition<distribution_v1_stream_stream_common_pb.PushCommandRequest, distribution_v1_stream_stream_common_pb.PushCommandResponse> {
    path: "/signage.distribution.v1.stream.StreamService/PushCommand";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<distribution_v1_stream_stream_common_pb.PushCommandRequest>;
    requestDeserialize: grpc.deserialize<distribution_v1_stream_stream_common_pb.PushCommandRequest>;
    responseSerialize: grpc.serialize<distribution_v1_stream_stream_common_pb.PushCommandResponse>;
    responseDeserialize: grpc.deserialize<distribution_v1_stream_stream_common_pb.PushCommandResponse>;
}

export const StreamServiceService: IStreamServiceService;

export interface IStreamServiceServer extends grpc.UntypedServiceImplementation {
    displayStream: grpc.handleBidiStreamingCall<distribution_v1_stream_stream_common_pb.StreamClientMessage, distribution_v1_stream_stream_common_pb.StreamServerMessage>;
    pushCommand: grpc.handleUnaryCall<distribution_v1_stream_stream_common_pb.PushCommandRequest, distribution_v1_stream_stream_common_pb.PushCommandResponse>;
}

export interface IStreamServiceClient {
    displayStream(): grpc.ClientDuplexStream<distribution_v1_stream_stream_common_pb.StreamClientMessage, distribution_v1_stream_stream_common_pb.StreamServerMessage>;
    displayStream(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<distribution_v1_stream_stream_common_pb.StreamClientMessage, distribution_v1_stream_stream_common_pb.StreamServerMessage>;
    displayStream(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<distribution_v1_stream_stream_common_pb.StreamClientMessage, distribution_v1_stream_stream_common_pb.StreamServerMessage>;
    pushCommand(request: distribution_v1_stream_stream_common_pb.PushCommandRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_stream_stream_common_pb.PushCommandResponse) => void): grpc.ClientUnaryCall;
    pushCommand(request: distribution_v1_stream_stream_common_pb.PushCommandRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_stream_stream_common_pb.PushCommandResponse) => void): grpc.ClientUnaryCall;
    pushCommand(request: distribution_v1_stream_stream_common_pb.PushCommandRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_stream_stream_common_pb.PushCommandResponse) => void): grpc.ClientUnaryCall;
}

export class StreamServiceClient extends grpc.Client implements IStreamServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public displayStream(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<distribution_v1_stream_stream_common_pb.StreamClientMessage, distribution_v1_stream_stream_common_pb.StreamServerMessage>;
    public displayStream(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<distribution_v1_stream_stream_common_pb.StreamClientMessage, distribution_v1_stream_stream_common_pb.StreamServerMessage>;
    public pushCommand(request: distribution_v1_stream_stream_common_pb.PushCommandRequest, callback: (error: grpc.ServiceError | null, response: distribution_v1_stream_stream_common_pb.PushCommandResponse) => void): grpc.ClientUnaryCall;
    public pushCommand(request: distribution_v1_stream_stream_common_pb.PushCommandRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: distribution_v1_stream_stream_common_pb.PushCommandResponse) => void): grpc.ClientUnaryCall;
    public pushCommand(request: distribution_v1_stream_stream_common_pb.PushCommandRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: distribution_v1_stream_stream_common_pb.PushCommandResponse) => void): grpc.ClientUnaryCall;
}
