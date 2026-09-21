// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var iam_v1_role_role_common_pb = require('../../../iam/v1/role/role.common_pb.js');

function serialize_signage_iam_v1_role_AssignPermissionsToRoleRequest(arg) {
  if (!(arg instanceof iam_v1_role_role_common_pb.AssignPermissionsToRoleRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.role.AssignPermissionsToRoleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_AssignPermissionsToRoleRequest(buffer_arg) {
  return iam_v1_role_role_common_pb.AssignPermissionsToRoleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_AssignPermissionsToRoleResponse(arg) {
  if (!(arg instanceof iam_v1_role_role_common_pb.AssignPermissionsToRoleResponse)) {
    throw new Error('Expected argument of type signage.iam.v1.role.AssignPermissionsToRoleResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_AssignPermissionsToRoleResponse(buffer_arg) {
  return iam_v1_role_role_common_pb.AssignPermissionsToRoleResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_CreateRoleRequest(arg) {
  if (!(arg instanceof iam_v1_role_role_common_pb.CreateRoleRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.role.CreateRoleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_CreateRoleRequest(buffer_arg) {
  return iam_v1_role_role_common_pb.CreateRoleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_DeleteRoleRequest(arg) {
  if (!(arg instanceof iam_v1_role_role_common_pb.DeleteRoleRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.role.DeleteRoleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_DeleteRoleRequest(buffer_arg) {
  return iam_v1_role_role_common_pb.DeleteRoleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_DeleteRoleResponse(arg) {
  if (!(arg instanceof iam_v1_role_role_common_pb.DeleteRoleResponse)) {
    throw new Error('Expected argument of type signage.iam.v1.role.DeleteRoleResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_DeleteRoleResponse(buffer_arg) {
  return iam_v1_role_role_common_pb.DeleteRoleResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_GetRoleBySlugRequest(arg) {
  if (!(arg instanceof iam_v1_role_role_common_pb.GetRoleBySlugRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.role.GetRoleBySlugRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_GetRoleBySlugRequest(buffer_arg) {
  return iam_v1_role_role_common_pb.GetRoleBySlugRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_GetRoleRequest(arg) {
  if (!(arg instanceof iam_v1_role_role_common_pb.GetRoleRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.role.GetRoleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_GetRoleRequest(buffer_arg) {
  return iam_v1_role_role_common_pb.GetRoleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_ListRolesRequest(arg) {
  if (!(arg instanceof iam_v1_role_role_common_pb.ListRolesRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.role.ListRolesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_ListRolesRequest(buffer_arg) {
  return iam_v1_role_role_common_pb.ListRolesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_ListRolesResponse(arg) {
  if (!(arg instanceof iam_v1_role_role_common_pb.ListRolesResponse)) {
    throw new Error('Expected argument of type signage.iam.v1.role.ListRolesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_ListRolesResponse(buffer_arg) {
  return iam_v1_role_role_common_pb.ListRolesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_Role(arg) {
  if (!(arg instanceof iam_v1_role_role_common_pb.Role)) {
    throw new Error('Expected argument of type signage.iam.v1.role.Role');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_Role(buffer_arg) {
  return iam_v1_role_role_common_pb.Role.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_role_UpdateRoleRequest(arg) {
  if (!(arg instanceof iam_v1_role_role_common_pb.UpdateRoleRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.role.UpdateRoleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_role_UpdateRoleRequest(buffer_arg) {
  return iam_v1_role_role_common_pb.UpdateRoleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


var RoleServiceService = exports.RoleServiceService = {
  createRole: {
    path: '/signage.iam.v1.role.RoleService/CreateRole',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_role_role_common_pb.CreateRoleRequest,
    responseType: iam_v1_role_role_common_pb.Role,
    requestSerialize: serialize_signage_iam_v1_role_CreateRoleRequest,
    requestDeserialize: deserialize_signage_iam_v1_role_CreateRoleRequest,
    responseSerialize: serialize_signage_iam_v1_role_Role,
    responseDeserialize: deserialize_signage_iam_v1_role_Role,
  },
  getRole: {
    path: '/signage.iam.v1.role.RoleService/GetRole',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_role_role_common_pb.GetRoleRequest,
    responseType: iam_v1_role_role_common_pb.Role,
    requestSerialize: serialize_signage_iam_v1_role_GetRoleRequest,
    requestDeserialize: deserialize_signage_iam_v1_role_GetRoleRequest,
    responseSerialize: serialize_signage_iam_v1_role_Role,
    responseDeserialize: deserialize_signage_iam_v1_role_Role,
  },
  getRoleBySlug: {
    path: '/signage.iam.v1.role.RoleService/GetRoleBySlug',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_role_role_common_pb.GetRoleBySlugRequest,
    responseType: iam_v1_role_role_common_pb.Role,
    requestSerialize: serialize_signage_iam_v1_role_GetRoleBySlugRequest,
    requestDeserialize: deserialize_signage_iam_v1_role_GetRoleBySlugRequest,
    responseSerialize: serialize_signage_iam_v1_role_Role,
    responseDeserialize: deserialize_signage_iam_v1_role_Role,
  },
  listRoles: {
    path: '/signage.iam.v1.role.RoleService/ListRoles',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_role_role_common_pb.ListRolesRequest,
    responseType: iam_v1_role_role_common_pb.ListRolesResponse,
    requestSerialize: serialize_signage_iam_v1_role_ListRolesRequest,
    requestDeserialize: deserialize_signage_iam_v1_role_ListRolesRequest,
    responseSerialize: serialize_signage_iam_v1_role_ListRolesResponse,
    responseDeserialize: deserialize_signage_iam_v1_role_ListRolesResponse,
  },
  updateRole: {
    path: '/signage.iam.v1.role.RoleService/UpdateRole',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_role_role_common_pb.UpdateRoleRequest,
    responseType: iam_v1_role_role_common_pb.Role,
    requestSerialize: serialize_signage_iam_v1_role_UpdateRoleRequest,
    requestDeserialize: deserialize_signage_iam_v1_role_UpdateRoleRequest,
    responseSerialize: serialize_signage_iam_v1_role_Role,
    responseDeserialize: deserialize_signage_iam_v1_role_Role,
  },
  deleteRole: {
    path: '/signage.iam.v1.role.RoleService/DeleteRole',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_role_role_common_pb.DeleteRoleRequest,
    responseType: iam_v1_role_role_common_pb.DeleteRoleResponse,
    requestSerialize: serialize_signage_iam_v1_role_DeleteRoleRequest,
    requestDeserialize: deserialize_signage_iam_v1_role_DeleteRoleRequest,
    responseSerialize: serialize_signage_iam_v1_role_DeleteRoleResponse,
    responseDeserialize: deserialize_signage_iam_v1_role_DeleteRoleResponse,
  },
  assignPermissionsToRole: {
    path: '/signage.iam.v1.role.RoleService/AssignPermissionsToRole',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_role_role_common_pb.AssignPermissionsToRoleRequest,
    responseType: iam_v1_role_role_common_pb.AssignPermissionsToRoleResponse,
    requestSerialize: serialize_signage_iam_v1_role_AssignPermissionsToRoleRequest,
    requestDeserialize: deserialize_signage_iam_v1_role_AssignPermissionsToRoleRequest,
    responseSerialize: serialize_signage_iam_v1_role_AssignPermissionsToRoleResponse,
    responseDeserialize: deserialize_signage_iam_v1_role_AssignPermissionsToRoleResponse,
  },
};

exports.RoleServiceClient = grpc.makeGenericClientConstructor(RoleServiceService, 'RoleService');
