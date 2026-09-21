// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var hardware_v1_display_group_display_group_common_pb = require('../../../hardware/v1/display_group/display_group.common_pb.js');

function serialize_signage_hardware_v1_display_group_CreateDisplayGroupRequest(arg) {
  if (!(arg instanceof hardware_v1_display_group_display_group_common_pb.CreateDisplayGroupRequest)) {
    throw new Error('Expected argument of type signage.hardware.v1.display_group.CreateDisplayGroupRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_display_group_CreateDisplayGroupRequest(buffer_arg) {
  return hardware_v1_display_group_display_group_common_pb.CreateDisplayGroupRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_display_group_DeleteDisplayGroupRequest(arg) {
  if (!(arg instanceof hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupRequest)) {
    throw new Error('Expected argument of type signage.hardware.v1.display_group.DeleteDisplayGroupRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_display_group_DeleteDisplayGroupRequest(buffer_arg) {
  return hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_display_group_DeleteDisplayGroupResponse(arg) {
  if (!(arg instanceof hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupResponse)) {
    throw new Error('Expected argument of type signage.hardware.v1.display_group.DeleteDisplayGroupResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_display_group_DeleteDisplayGroupResponse(buffer_arg) {
  return hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_display_group_DisplayGroup(arg) {
  if (!(arg instanceof hardware_v1_display_group_display_group_common_pb.DisplayGroup)) {
    throw new Error('Expected argument of type signage.hardware.v1.display_group.DisplayGroup');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_display_group_DisplayGroup(buffer_arg) {
  return hardware_v1_display_group_display_group_common_pb.DisplayGroup.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_display_group_GetDisplayGroupRequest(arg) {
  if (!(arg instanceof hardware_v1_display_group_display_group_common_pb.GetDisplayGroupRequest)) {
    throw new Error('Expected argument of type signage.hardware.v1.display_group.GetDisplayGroupRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_display_group_GetDisplayGroupRequest(buffer_arg) {
  return hardware_v1_display_group_display_group_common_pb.GetDisplayGroupRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_display_group_ListDisplayGroupsRequest(arg) {
  if (!(arg instanceof hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsRequest)) {
    throw new Error('Expected argument of type signage.hardware.v1.display_group.ListDisplayGroupsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_display_group_ListDisplayGroupsRequest(buffer_arg) {
  return hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_display_group_ListDisplayGroupsResponse(arg) {
  if (!(arg instanceof hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsResponse)) {
    throw new Error('Expected argument of type signage.hardware.v1.display_group.ListDisplayGroupsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_display_group_ListDisplayGroupsResponse(buffer_arg) {
  return hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_display_group_UpdateDisplayGroupRequest(arg) {
  if (!(arg instanceof hardware_v1_display_group_display_group_common_pb.UpdateDisplayGroupRequest)) {
    throw new Error('Expected argument of type signage.hardware.v1.display_group.UpdateDisplayGroupRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_display_group_UpdateDisplayGroupRequest(buffer_arg) {
  return hardware_v1_display_group_display_group_common_pb.UpdateDisplayGroupRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


var DisplayGroupServiceService = exports.DisplayGroupServiceService = {
  createDisplayGroup: {
    path: '/signage.hardware.v1.display_group.DisplayGroupService/CreateDisplayGroup',
    requestStream: false,
    responseStream: false,
    requestType: hardware_v1_display_group_display_group_common_pb.CreateDisplayGroupRequest,
    responseType: hardware_v1_display_group_display_group_common_pb.DisplayGroup,
    requestSerialize: serialize_signage_hardware_v1_display_group_CreateDisplayGroupRequest,
    requestDeserialize: deserialize_signage_hardware_v1_display_group_CreateDisplayGroupRequest,
    responseSerialize: serialize_signage_hardware_v1_display_group_DisplayGroup,
    responseDeserialize: deserialize_signage_hardware_v1_display_group_DisplayGroup,
  },
  getDisplayGroup: {
    path: '/signage.hardware.v1.display_group.DisplayGroupService/GetDisplayGroup',
    requestStream: false,
    responseStream: false,
    requestType: hardware_v1_display_group_display_group_common_pb.GetDisplayGroupRequest,
    responseType: hardware_v1_display_group_display_group_common_pb.DisplayGroup,
    requestSerialize: serialize_signage_hardware_v1_display_group_GetDisplayGroupRequest,
    requestDeserialize: deserialize_signage_hardware_v1_display_group_GetDisplayGroupRequest,
    responseSerialize: serialize_signage_hardware_v1_display_group_DisplayGroup,
    responseDeserialize: deserialize_signage_hardware_v1_display_group_DisplayGroup,
  },
  listDisplayGroups: {
    path: '/signage.hardware.v1.display_group.DisplayGroupService/ListDisplayGroups',
    requestStream: false,
    responseStream: false,
    requestType: hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsRequest,
    responseType: hardware_v1_display_group_display_group_common_pb.ListDisplayGroupsResponse,
    requestSerialize: serialize_signage_hardware_v1_display_group_ListDisplayGroupsRequest,
    requestDeserialize: deserialize_signage_hardware_v1_display_group_ListDisplayGroupsRequest,
    responseSerialize: serialize_signage_hardware_v1_display_group_ListDisplayGroupsResponse,
    responseDeserialize: deserialize_signage_hardware_v1_display_group_ListDisplayGroupsResponse,
  },
  updateDisplayGroup: {
    path: '/signage.hardware.v1.display_group.DisplayGroupService/UpdateDisplayGroup',
    requestStream: false,
    responseStream: false,
    requestType: hardware_v1_display_group_display_group_common_pb.UpdateDisplayGroupRequest,
    responseType: hardware_v1_display_group_display_group_common_pb.DisplayGroup,
    requestSerialize: serialize_signage_hardware_v1_display_group_UpdateDisplayGroupRequest,
    requestDeserialize: deserialize_signage_hardware_v1_display_group_UpdateDisplayGroupRequest,
    responseSerialize: serialize_signage_hardware_v1_display_group_DisplayGroup,
    responseDeserialize: deserialize_signage_hardware_v1_display_group_DisplayGroup,
  },
  deleteDisplayGroup: {
    path: '/signage.hardware.v1.display_group.DisplayGroupService/DeleteDisplayGroup',
    requestStream: false,
    responseStream: false,
    requestType: hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupRequest,
    responseType: hardware_v1_display_group_display_group_common_pb.DeleteDisplayGroupResponse,
    requestSerialize: serialize_signage_hardware_v1_display_group_DeleteDisplayGroupRequest,
    requestDeserialize: deserialize_signage_hardware_v1_display_group_DeleteDisplayGroupRequest,
    responseSerialize: serialize_signage_hardware_v1_display_group_DeleteDisplayGroupResponse,
    responseDeserialize: deserialize_signage_hardware_v1_display_group_DeleteDisplayGroupResponse,
  },
};

exports.DisplayGroupServiceClient = grpc.makeGenericClientConstructor(DisplayGroupServiceService, 'DisplayGroupService');
