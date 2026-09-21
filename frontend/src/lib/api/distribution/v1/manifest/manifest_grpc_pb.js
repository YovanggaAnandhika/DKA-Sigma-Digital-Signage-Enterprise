// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var distribution_v1_manifest_manifest_common_pb = require('../../../distribution/v1/manifest/manifest.common_pb.js');

function serialize_signage_distribution_v1_manifest_AssignLayoutToDeviceRequest(arg) {
  if (!(arg instanceof distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceRequest)) {
    throw new Error('Expected argument of type signage.distribution.v1.manifest.AssignLayoutToDeviceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_manifest_AssignLayoutToDeviceRequest(buffer_arg) {
  return distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_distribution_v1_manifest_AssignLayoutToDeviceResponse(arg) {
  if (!(arg instanceof distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceResponse)) {
    throw new Error('Expected argument of type signage.distribution.v1.manifest.AssignLayoutToDeviceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_manifest_AssignLayoutToDeviceResponse(buffer_arg) {
  return distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_distribution_v1_manifest_GetActiveManifestRequest(arg) {
  if (!(arg instanceof distribution_v1_manifest_manifest_common_pb.GetActiveManifestRequest)) {
    throw new Error('Expected argument of type signage.distribution.v1.manifest.GetActiveManifestRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_manifest_GetActiveManifestRequest(buffer_arg) {
  return distribution_v1_manifest_manifest_common_pb.GetActiveManifestRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_distribution_v1_manifest_GetActiveManifestResponse(arg) {
  if (!(arg instanceof distribution_v1_manifest_manifest_common_pb.GetActiveManifestResponse)) {
    throw new Error('Expected argument of type signage.distribution.v1.manifest.GetActiveManifestResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_manifest_GetActiveManifestResponse(buffer_arg) {
  return distribution_v1_manifest_manifest_common_pb.GetActiveManifestResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var ManifestServiceService = exports.ManifestServiceService = {
  getActiveManifest: {
    path: '/signage.distribution.v1.manifest.ManifestService/GetActiveManifest',
    requestStream: false,
    responseStream: false,
    requestType: distribution_v1_manifest_manifest_common_pb.GetActiveManifestRequest,
    responseType: distribution_v1_manifest_manifest_common_pb.GetActiveManifestResponse,
    requestSerialize: serialize_signage_distribution_v1_manifest_GetActiveManifestRequest,
    requestDeserialize: deserialize_signage_distribution_v1_manifest_GetActiveManifestRequest,
    responseSerialize: serialize_signage_distribution_v1_manifest_GetActiveManifestResponse,
    responseDeserialize: deserialize_signage_distribution_v1_manifest_GetActiveManifestResponse,
  },
  assignLayoutToDevice: {
    path: '/signage.distribution.v1.manifest.ManifestService/AssignLayoutToDevice',
    requestStream: false,
    responseStream: false,
    requestType: distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceRequest,
    responseType: distribution_v1_manifest_manifest_common_pb.AssignLayoutToDeviceResponse,
    requestSerialize: serialize_signage_distribution_v1_manifest_AssignLayoutToDeviceRequest,
    requestDeserialize: deserialize_signage_distribution_v1_manifest_AssignLayoutToDeviceRequest,
    responseSerialize: serialize_signage_distribution_v1_manifest_AssignLayoutToDeviceResponse,
    responseDeserialize: deserialize_signage_distribution_v1_manifest_AssignLayoutToDeviceResponse,
  },
};

exports.ManifestServiceClient = grpc.makeGenericClientConstructor(ManifestServiceService, 'ManifestService');
