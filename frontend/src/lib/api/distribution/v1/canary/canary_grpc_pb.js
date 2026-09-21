// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var distribution_v1_canary_canary_common_pb = require('../../../distribution/v1/canary/canary.common_pb.js');

function serialize_signage_distribution_v1_canary_CanaryGroup(arg) {
  if (!(arg instanceof distribution_v1_canary_canary_common_pb.CanaryGroup)) {
    throw new Error('Expected argument of type signage.distribution.v1.canary.CanaryGroup');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_canary_CanaryGroup(buffer_arg) {
  return distribution_v1_canary_canary_common_pb.CanaryGroup.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_distribution_v1_canary_CreateCanaryGroupRequest(arg) {
  if (!(arg instanceof distribution_v1_canary_canary_common_pb.CreateCanaryGroupRequest)) {
    throw new Error('Expected argument of type signage.distribution.v1.canary.CreateCanaryGroupRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_canary_CreateCanaryGroupRequest(buffer_arg) {
  return distribution_v1_canary_canary_common_pb.CreateCanaryGroupRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_distribution_v1_canary_DeleteCanaryGroupRequest(arg) {
  if (!(arg instanceof distribution_v1_canary_canary_common_pb.DeleteCanaryGroupRequest)) {
    throw new Error('Expected argument of type signage.distribution.v1.canary.DeleteCanaryGroupRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_canary_DeleteCanaryGroupRequest(buffer_arg) {
  return distribution_v1_canary_canary_common_pb.DeleteCanaryGroupRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_distribution_v1_canary_DeleteCanaryGroupResponse(arg) {
  if (!(arg instanceof distribution_v1_canary_canary_common_pb.DeleteCanaryGroupResponse)) {
    throw new Error('Expected argument of type signage.distribution.v1.canary.DeleteCanaryGroupResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_canary_DeleteCanaryGroupResponse(buffer_arg) {
  return distribution_v1_canary_canary_common_pb.DeleteCanaryGroupResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_distribution_v1_canary_EvaluateCanaryRequest(arg) {
  if (!(arg instanceof distribution_v1_canary_canary_common_pb.EvaluateCanaryRequest)) {
    throw new Error('Expected argument of type signage.distribution.v1.canary.EvaluateCanaryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_canary_EvaluateCanaryRequest(buffer_arg) {
  return distribution_v1_canary_canary_common_pb.EvaluateCanaryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_distribution_v1_canary_EvaluateCanaryResponse(arg) {
  if (!(arg instanceof distribution_v1_canary_canary_common_pb.EvaluateCanaryResponse)) {
    throw new Error('Expected argument of type signage.distribution.v1.canary.EvaluateCanaryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_canary_EvaluateCanaryResponse(buffer_arg) {
  return distribution_v1_canary_canary_common_pb.EvaluateCanaryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_distribution_v1_canary_GetCanaryGroupRequest(arg) {
  if (!(arg instanceof distribution_v1_canary_canary_common_pb.GetCanaryGroupRequest)) {
    throw new Error('Expected argument of type signage.distribution.v1.canary.GetCanaryGroupRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_canary_GetCanaryGroupRequest(buffer_arg) {
  return distribution_v1_canary_canary_common_pb.GetCanaryGroupRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_distribution_v1_canary_ListCanaryGroupsRequest(arg) {
  if (!(arg instanceof distribution_v1_canary_canary_common_pb.ListCanaryGroupsRequest)) {
    throw new Error('Expected argument of type signage.distribution.v1.canary.ListCanaryGroupsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_canary_ListCanaryGroupsRequest(buffer_arg) {
  return distribution_v1_canary_canary_common_pb.ListCanaryGroupsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_distribution_v1_canary_ListCanaryGroupsResponse(arg) {
  if (!(arg instanceof distribution_v1_canary_canary_common_pb.ListCanaryGroupsResponse)) {
    throw new Error('Expected argument of type signage.distribution.v1.canary.ListCanaryGroupsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_canary_ListCanaryGroupsResponse(buffer_arg) {
  return distribution_v1_canary_canary_common_pb.ListCanaryGroupsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_distribution_v1_canary_UpdateCanaryGroupRequest(arg) {
  if (!(arg instanceof distribution_v1_canary_canary_common_pb.UpdateCanaryGroupRequest)) {
    throw new Error('Expected argument of type signage.distribution.v1.canary.UpdateCanaryGroupRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_distribution_v1_canary_UpdateCanaryGroupRequest(buffer_arg) {
  return distribution_v1_canary_canary_common_pb.UpdateCanaryGroupRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


var CanaryServiceService = exports.CanaryServiceService = {
  createCanaryGroup: {
    path: '/signage.distribution.v1.canary.CanaryService/CreateCanaryGroup',
    requestStream: false,
    responseStream: false,
    requestType: distribution_v1_canary_canary_common_pb.CreateCanaryGroupRequest,
    responseType: distribution_v1_canary_canary_common_pb.CanaryGroup,
    requestSerialize: serialize_signage_distribution_v1_canary_CreateCanaryGroupRequest,
    requestDeserialize: deserialize_signage_distribution_v1_canary_CreateCanaryGroupRequest,
    responseSerialize: serialize_signage_distribution_v1_canary_CanaryGroup,
    responseDeserialize: deserialize_signage_distribution_v1_canary_CanaryGroup,
  },
  getCanaryGroup: {
    path: '/signage.distribution.v1.canary.CanaryService/GetCanaryGroup',
    requestStream: false,
    responseStream: false,
    requestType: distribution_v1_canary_canary_common_pb.GetCanaryGroupRequest,
    responseType: distribution_v1_canary_canary_common_pb.CanaryGroup,
    requestSerialize: serialize_signage_distribution_v1_canary_GetCanaryGroupRequest,
    requestDeserialize: deserialize_signage_distribution_v1_canary_GetCanaryGroupRequest,
    responseSerialize: serialize_signage_distribution_v1_canary_CanaryGroup,
    responseDeserialize: deserialize_signage_distribution_v1_canary_CanaryGroup,
  },
  listCanaryGroups: {
    path: '/signage.distribution.v1.canary.CanaryService/ListCanaryGroups',
    requestStream: false,
    responseStream: false,
    requestType: distribution_v1_canary_canary_common_pb.ListCanaryGroupsRequest,
    responseType: distribution_v1_canary_canary_common_pb.ListCanaryGroupsResponse,
    requestSerialize: serialize_signage_distribution_v1_canary_ListCanaryGroupsRequest,
    requestDeserialize: deserialize_signage_distribution_v1_canary_ListCanaryGroupsRequest,
    responseSerialize: serialize_signage_distribution_v1_canary_ListCanaryGroupsResponse,
    responseDeserialize: deserialize_signage_distribution_v1_canary_ListCanaryGroupsResponse,
  },
  updateCanaryGroup: {
    path: '/signage.distribution.v1.canary.CanaryService/UpdateCanaryGroup',
    requestStream: false,
    responseStream: false,
    requestType: distribution_v1_canary_canary_common_pb.UpdateCanaryGroupRequest,
    responseType: distribution_v1_canary_canary_common_pb.CanaryGroup,
    requestSerialize: serialize_signage_distribution_v1_canary_UpdateCanaryGroupRequest,
    requestDeserialize: deserialize_signage_distribution_v1_canary_UpdateCanaryGroupRequest,
    responseSerialize: serialize_signage_distribution_v1_canary_CanaryGroup,
    responseDeserialize: deserialize_signage_distribution_v1_canary_CanaryGroup,
  },
  deleteCanaryGroup: {
    path: '/signage.distribution.v1.canary.CanaryService/DeleteCanaryGroup',
    requestStream: false,
    responseStream: false,
    requestType: distribution_v1_canary_canary_common_pb.DeleteCanaryGroupRequest,
    responseType: distribution_v1_canary_canary_common_pb.DeleteCanaryGroupResponse,
    requestSerialize: serialize_signage_distribution_v1_canary_DeleteCanaryGroupRequest,
    requestDeserialize: deserialize_signage_distribution_v1_canary_DeleteCanaryGroupRequest,
    responseSerialize: serialize_signage_distribution_v1_canary_DeleteCanaryGroupResponse,
    responseDeserialize: deserialize_signage_distribution_v1_canary_DeleteCanaryGroupResponse,
  },
  evaluateCanary: {
    path: '/signage.distribution.v1.canary.CanaryService/EvaluateCanary',
    requestStream: false,
    responseStream: false,
    requestType: distribution_v1_canary_canary_common_pb.EvaluateCanaryRequest,
    responseType: distribution_v1_canary_canary_common_pb.EvaluateCanaryResponse,
    requestSerialize: serialize_signage_distribution_v1_canary_EvaluateCanaryRequest,
    requestDeserialize: deserialize_signage_distribution_v1_canary_EvaluateCanaryRequest,
    responseSerialize: serialize_signage_distribution_v1_canary_EvaluateCanaryResponse,
    responseDeserialize: deserialize_signage_distribution_v1_canary_EvaluateCanaryResponse,
  },
};

exports.CanaryServiceClient = grpc.makeGenericClientConstructor(CanaryServiceService, 'CanaryService');
