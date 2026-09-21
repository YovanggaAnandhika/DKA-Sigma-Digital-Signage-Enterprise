// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var distribution_v1_stream_stream_common_pb = require('../../../distribution/v1/stream/stream.common_pb.js');

function serialize_signage_distribution_v1_stream_PushCommandRequest(arg) {
  if (!(arg instanceof distribution_v1_stream_stream_common_pb.PushCommandRequest)) {
    throw new Error('Expected argument of type signage.distribution.v1.stream.PushCommandRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_stream_PushCommandRequest(buffer_arg) {
  return distribution_v1_stream_stream_common_pb.PushCommandRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_distribution_v1_stream_PushCommandResponse(arg) {
  if (!(arg instanceof distribution_v1_stream_stream_common_pb.PushCommandResponse)) {
    throw new Error('Expected argument of type signage.distribution.v1.stream.PushCommandResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_stream_PushCommandResponse(buffer_arg) {
  return distribution_v1_stream_stream_common_pb.PushCommandResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_distribution_v1_stream_StreamClientMessage(arg) {
  if (!(arg instanceof distribution_v1_stream_stream_common_pb.StreamClientMessage)) {
    throw new Error('Expected argument of type signage.distribution.v1.stream.StreamClientMessage');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_stream_StreamClientMessage(buffer_arg) {
  return distribution_v1_stream_stream_common_pb.StreamClientMessage.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_distribution_v1_stream_StreamServerMessage(arg) {
  if (!(arg instanceof distribution_v1_stream_stream_common_pb.StreamServerMessage)) {
    throw new Error('Expected argument of type signage.distribution.v1.stream.StreamServerMessage');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_stream_StreamServerMessage(buffer_arg) {
  return distribution_v1_stream_stream_common_pb.StreamServerMessage.deserializeBinary(new Uint8Array(buffer_arg));
}


var StreamServiceService = exports.StreamServiceService = {
  // Bi-directional streaming for Android Display
displayStream: {
    path: '/signage.distribution.v1.stream.StreamService/DisplayStream',
    requestStream: true,
    responseStream: true,
    requestType: distribution_v1_stream_stream_common_pb.StreamClientMessage,
    responseType: distribution_v1_stream_stream_common_pb.StreamServerMessage,
    requestSerialize: serialize_signage_distribution_v1_stream_StreamClientMessage,
    requestDeserialize: deserialize_signage_distribution_v1_stream_StreamClientMessage,
    responseSerialize: serialize_signage_distribution_v1_stream_StreamServerMessage,
    responseDeserialize: deserialize_signage_distribution_v1_stream_StreamServerMessage,
  },
  // Admin CMS push immediate commands
pushCommand: {
    path: '/signage.distribution.v1.stream.StreamService/PushCommand',
    requestStream: false,
    responseStream: false,
    requestType: distribution_v1_stream_stream_common_pb.PushCommandRequest,
    responseType: distribution_v1_stream_stream_common_pb.PushCommandResponse,
    requestSerialize: serialize_signage_distribution_v1_stream_PushCommandRequest,
    requestDeserialize: deserialize_signage_distribution_v1_stream_PushCommandRequest,
    responseSerialize: serialize_signage_distribution_v1_stream_PushCommandResponse,
    responseDeserialize: deserialize_signage_distribution_v1_stream_PushCommandResponse,
  },
};

exports.StreamServiceClient = grpc.makeGenericClientConstructor(StreamServiceService, 'StreamService');
