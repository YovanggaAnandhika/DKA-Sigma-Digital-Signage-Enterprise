// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var iam_v1_role_group_role_group_common_pb = require('../../../iam/v1/role_group/role_group.common_pb.js');

function serialize_signage_iam_v1_role_group_AssignRolesToGroupRequest(arg) {
  if (!(arg instanceof iam_v1_role_group_role_group_common_pb.AssignRolesToGroupRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.role_group.AssignRolesToGroupRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_group_AssignRolesToGroupRequest(buffer_arg) {
  return iam_v1_role_group_role_group_common_pb.AssignRolesToGroupRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_group_AssignRolesToGroupResponse(arg) {
  if (!(arg instanceof iam_v1_role_group_role_group_common_pb.AssignRolesToGroupResponse)) {
    throw new Error('Expected argument of type signage.iam.v1.role_group.AssignRolesToGroupResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_group_AssignRolesToGroupResponse(buffer_arg) {
  return iam_v1_role_group_role_group_common_pb.AssignRolesToGroupResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_group_CreateRoleGroupRequest(arg) {
  if (!(arg instanceof iam_v1_role_group_role_group_common_pb.CreateRoleGroupRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.role_group.CreateRoleGroupRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_group_CreateRoleGroupRequest(buffer_arg) {
  return iam_v1_role_group_role_group_common_pb.CreateRoleGroupRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_group_DeleteRoleGroupRequest(arg) {
  if (!(arg instanceof iam_v1_role_group_role_group_common_pb.DeleteRoleGroupRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.role_group.DeleteRoleGroupRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_group_DeleteRoleGroupRequest(buffer_arg) {
  return iam_v1_role_group_role_group_common_pb.DeleteRoleGroupRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_group_DeleteRoleGroupResponse(arg) {
  if (!(arg instanceof iam_v1_role_group_role_group_common_pb.DeleteRoleGroupResponse)) {
    throw new Error('Expected argument of type signage.iam.v1.role_group.DeleteRoleGroupResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_group_DeleteRoleGroupResponse(buffer_arg) {
  return iam_v1_role_group_role_group_common_pb.DeleteRoleGroupResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_group_GetRoleGroupRequest(arg) {
  if (!(arg instanceof iam_v1_role_group_role_group_common_pb.GetRoleGroupRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.role_group.GetRoleGroupRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_group_GetRoleGroupRequest(buffer_arg) {
  return iam_v1_role_group_role_group_common_pb.GetRoleGroupRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_group_ListRoleGroupsRequest(arg) {
  if (!(arg instanceof iam_v1_role_group_role_group_common_pb.ListRoleGroupsRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.role_group.ListRoleGroupsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_group_ListRoleGroupsRequest(buffer_arg) {
  return iam_v1_role_group_role_group_common_pb.ListRoleGroupsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_group_ListRoleGroupsResponse(arg) {
  if (!(arg instanceof iam_v1_role_group_role_group_common_pb.ListRoleGroupsResponse)) {
    throw new Error('Expected argument of type signage.iam.v1.role_group.ListRoleGroupsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_group_ListRoleGroupsResponse(buffer_arg) {
  return iam_v1_role_group_role_group_common_pb.ListRoleGroupsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_group_RoleGroup(arg) {
  if (!(arg instanceof iam_v1_role_group_role_group_common_pb.RoleGroup)) {
    throw new Error('Expected argument of type signage.iam.v1.role_group.RoleGroup');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_group_RoleGroup(buffer_arg) {
  return iam_v1_role_group_role_group_common_pb.RoleGroup.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_group_UpdateRoleGroupRequest(arg) {
  if (!(arg instanceof iam_v1_role_group_role_group_common_pb.UpdateRoleGroupRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.role_group.UpdateRoleGroupRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_group_UpdateRoleGroupRequest(buffer_arg) {
  return iam_v1_role_group_role_group_common_pb.UpdateRoleGroupRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


var RoleGroupServiceService = exports.RoleGroupServiceService = {
  createRoleGroup: {
    path: '/signage.iam.v1.role_group.RoleGroupService/CreateRoleGroup',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_role_group_role_group_common_pb.CreateRoleGroupRequest,
    responseType: iam_v1_role_group_role_group_common_pb.RoleGroup,
    requestSerialize: serialize_signage_iam_v1_role_group_CreateRoleGroupRequest,
    requestDeserialize: deserialize_signage_iam_v1_role_group_CreateRoleGroupRequest,
    responseSerialize: serialize_signage_iam_v1_role_group_RoleGroup,
    responseDeserialize: deserialize_signage_iam_v1_role_group_RoleGroup,
  },
  getRoleGroup: {
    path: '/signage.iam.v1.role_group.RoleGroupService/GetRoleGroup',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_role_group_role_group_common_pb.GetRoleGroupRequest,
    responseType: iam_v1_role_group_role_group_common_pb.RoleGroup,
    requestSerialize: serialize_signage_iam_v1_role_group_GetRoleGroupRequest,
    requestDeserialize: deserialize_signage_iam_v1_role_group_GetRoleGroupRequest,
    responseSerialize: serialize_signage_iam_v1_role_group_RoleGroup,
    responseDeserialize: deserialize_signage_iam_v1_role_group_RoleGroup,
  },
  listRoleGroups: {
    path: '/signage.iam.v1.role_group.RoleGroupService/ListRoleGroups',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_role_group_role_group_common_pb.ListRoleGroupsRequest,
    responseType: iam_v1_role_group_role_group_common_pb.ListRoleGroupsResponse,
    requestSerialize: serialize_signage_iam_v1_role_group_ListRoleGroupsRequest,
    requestDeserialize: deserialize_signage_iam_v1_role_group_ListRoleGroupsRequest,
    responseSerialize: serialize_signage_iam_v1_role_group_ListRoleGroupsResponse,
    responseDeserialize: deserialize_signage_iam_v1_role_group_ListRoleGroupsResponse,
  },
  updateRoleGroup: {
    path: '/signage.iam.v1.role_group.RoleGroupService/UpdateRoleGroup',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_role_group_role_group_common_pb.UpdateRoleGroupRequest,
    responseType: iam_v1_role_group_role_group_common_pb.RoleGroup,
    requestSerialize: serialize_signage_iam_v1_role_group_UpdateRoleGroupRequest,
    requestDeserialize: deserialize_signage_iam_v1_role_group_UpdateRoleGroupRequest,
    responseSerialize: serialize_signage_iam_v1_role_group_RoleGroup,
    responseDeserialize: deserialize_signage_iam_v1_role_group_RoleGroup,
  },
  deleteRoleGroup: {
    path: '/signage.iam.v1.role_group.RoleGroupService/DeleteRoleGroup',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_role_group_role_group_common_pb.DeleteRoleGroupRequest,
    responseType: iam_v1_role_group_role_group_common_pb.DeleteRoleGroupResponse,
    requestSerialize: serialize_signage_iam_v1_role_group_DeleteRoleGroupRequest,
    requestDeserialize: deserialize_signage_iam_v1_role_group_DeleteRoleGroupRequest,
    responseSerialize: serialize_signage_iam_v1_role_group_DeleteRoleGroupResponse,
    responseDeserialize: deserialize_signage_iam_v1_role_group_DeleteRoleGroupResponse,
  },
  assignRolesToGroup: {
    path: '/signage.iam.v1.role_group.RoleGroupService/AssignRolesToGroup',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_role_group_role_group_common_pb.AssignRolesToGroupRequest,
    responseType: iam_v1_role_group_role_group_common_pb.AssignRolesToGroupResponse,
    requestSerialize: serialize_signage_iam_v1_role_group_AssignRolesToGroupRequest,
    requestDeserialize: deserialize_signage_iam_v1_role_group_AssignRolesToGroupRequest,
    responseSerialize: serialize_signage_iam_v1_role_group_AssignRolesToGroupResponse,
    responseDeserialize: deserialize_signage_iam_v1_role_group_AssignRolesToGroupResponse,
  },
};

exports.RoleGroupServiceClient = grpc.makeGenericClientConstructor(RoleGroupServiceService, 'RoleGroupService');
