// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var iam_v1_permission_permission_common_pb = require('../../../iam/v1/permission/permission.common_pb.js');

function serialize_signage_iam_v1_permission_CheckUserPermissionRequest(arg) {
  if (!(arg instanceof iam_v1_permission_permission_common_pb.CheckUserPermissionRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.permission.CheckUserPermissionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_permission_CheckUserPermissionRequest(buffer_arg) {
  return iam_v1_permission_permission_common_pb.CheckUserPermissionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_permission_CheckUserPermissionResponse(arg) {
  if (!(arg instanceof iam_v1_permission_permission_common_pb.CheckUserPermissionResponse)) {
    throw new Error('Expected argument of type signage.iam.v1.permission.CheckUserPermissionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_permission_CheckUserPermissionResponse(buffer_arg) {
  return iam_v1_permission_permission_common_pb.CheckUserPermissionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_permission_CreatePermissionRequest(arg) {
  if (!(arg instanceof iam_v1_permission_permission_common_pb.CreatePermissionRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.permission.CreatePermissionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_permission_CreatePermissionRequest(buffer_arg) {
  return iam_v1_permission_permission_common_pb.CreatePermissionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_permission_DeletePermissionRequest(arg) {
  if (!(arg instanceof iam_v1_permission_permission_common_pb.DeletePermissionRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.permission.DeletePermissionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_permission_DeletePermissionRequest(buffer_arg) {
  return iam_v1_permission_permission_common_pb.DeletePermissionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_permission_DeletePermissionResponse(arg) {
  if (!(arg instanceof iam_v1_permission_permission_common_pb.DeletePermissionResponse)) {
    throw new Error('Expected argument of type signage.iam.v1.permission.DeletePermissionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_permission_DeletePermissionResponse(buffer_arg) {
  return iam_v1_permission_permission_common_pb.DeletePermissionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_permission_GetPermissionByCodeRequest(arg) {
  if (!(arg instanceof iam_v1_permission_permission_common_pb.GetPermissionByCodeRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.permission.GetPermissionByCodeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_permission_GetPermissionByCodeRequest(buffer_arg) {
  return iam_v1_permission_permission_common_pb.GetPermissionByCodeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_permission_GetPermissionRequest(arg) {
  if (!(arg instanceof iam_v1_permission_permission_common_pb.GetPermissionRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.permission.GetPermissionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_permission_GetPermissionRequest(buffer_arg) {
  return iam_v1_permission_permission_common_pb.GetPermissionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_permission_ListPermissionsRequest(arg) {
  if (!(arg instanceof iam_v1_permission_permission_common_pb.ListPermissionsRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.permission.ListPermissionsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_permission_ListPermissionsRequest(buffer_arg) {
  return iam_v1_permission_permission_common_pb.ListPermissionsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_permission_ListPermissionsResponse(arg) {
  if (!(arg instanceof iam_v1_permission_permission_common_pb.ListPermissionsResponse)) {
    throw new Error('Expected argument of type signage.iam.v1.permission.ListPermissionsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_permission_ListPermissionsResponse(buffer_arg) {
  return iam_v1_permission_permission_common_pb.ListPermissionsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_permission_Permission(arg) {
  if (!(arg instanceof iam_v1_permission_permission_common_pb.Permission)) {
    throw new Error('Expected argument of type signage.iam.v1.permission.Permission');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_permission_Permission(buffer_arg) {
  return iam_v1_permission_permission_common_pb.Permission.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_permission_UpdatePermissionRequest(arg) {
  if (!(arg instanceof iam_v1_permission_permission_common_pb.UpdatePermissionRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.permission.UpdatePermissionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_permission_UpdatePermissionRequest(buffer_arg) {
  return iam_v1_permission_permission_common_pb.UpdatePermissionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


var PermissionServiceService = exports.PermissionServiceService = {
  createPermission: {
    path: '/signage.iam.v1.permission.PermissionService/CreatePermission',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_permission_permission_common_pb.CreatePermissionRequest,
    responseType: iam_v1_permission_permission_common_pb.Permission,
    requestSerialize: serialize_signage_iam_v1_permission_CreatePermissionRequest,
    requestDeserialize: deserialize_signage_iam_v1_permission_CreatePermissionRequest,
    responseSerialize: serialize_signage_iam_v1_permission_Permission,
    responseDeserialize: deserialize_signage_iam_v1_permission_Permission,
  },
  getPermission: {
    path: '/signage.iam.v1.permission.PermissionService/GetPermission',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_permission_permission_common_pb.GetPermissionRequest,
    responseType: iam_v1_permission_permission_common_pb.Permission,
    requestSerialize: serialize_signage_iam_v1_permission_GetPermissionRequest,
    requestDeserialize: deserialize_signage_iam_v1_permission_GetPermissionRequest,
    responseSerialize: serialize_signage_iam_v1_permission_Permission,
    responseDeserialize: deserialize_signage_iam_v1_permission_Permission,
  },
  getPermissionByCode: {
    path: '/signage.iam.v1.permission.PermissionService/GetPermissionByCode',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_permission_permission_common_pb.GetPermissionByCodeRequest,
    responseType: iam_v1_permission_permission_common_pb.Permission,
    requestSerialize: serialize_signage_iam_v1_permission_GetPermissionByCodeRequest,
    requestDeserialize: deserialize_signage_iam_v1_permission_GetPermissionByCodeRequest,
    responseSerialize: serialize_signage_iam_v1_permission_Permission,
    responseDeserialize: deserialize_signage_iam_v1_permission_Permission,
  },
  listPermissions: {
    path: '/signage.iam.v1.permission.PermissionService/ListPermissions',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_permission_permission_common_pb.ListPermissionsRequest,
    responseType: iam_v1_permission_permission_common_pb.ListPermissionsResponse,
    requestSerialize: serialize_signage_iam_v1_permission_ListPermissionsRequest,
    requestDeserialize: deserialize_signage_iam_v1_permission_ListPermissionsRequest,
    responseSerialize: serialize_signage_iam_v1_permission_ListPermissionsResponse,
    responseDeserialize: deserialize_signage_iam_v1_permission_ListPermissionsResponse,
  },
  updatePermission: {
    path: '/signage.iam.v1.permission.PermissionService/UpdatePermission',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_permission_permission_common_pb.UpdatePermissionRequest,
    responseType: iam_v1_permission_permission_common_pb.Permission,
    requestSerialize: serialize_signage_iam_v1_permission_UpdatePermissionRequest,
    requestDeserialize: deserialize_signage_iam_v1_permission_UpdatePermissionRequest,
    responseSerialize: serialize_signage_iam_v1_permission_Permission,
    responseDeserialize: deserialize_signage_iam_v1_permission_Permission,
  },
  deletePermission: {
    path: '/signage.iam.v1.permission.PermissionService/DeletePermission',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_permission_permission_common_pb.DeletePermissionRequest,
    responseType: iam_v1_permission_permission_common_pb.DeletePermissionResponse,
    requestSerialize: serialize_signage_iam_v1_permission_DeletePermissionRequest,
    requestDeserialize: deserialize_signage_iam_v1_permission_DeletePermissionRequest,
    responseSerialize: serialize_signage_iam_v1_permission_DeletePermissionResponse,
    responseDeserialize: deserialize_signage_iam_v1_permission_DeletePermissionResponse,
  },
  checkUserPermission: {
    path: '/signage.iam.v1.permission.PermissionService/CheckUserPermission',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_permission_permission_common_pb.CheckUserPermissionRequest,
    responseType: iam_v1_permission_permission_common_pb.CheckUserPermissionResponse,
    requestSerialize: serialize_signage_iam_v1_permission_CheckUserPermissionRequest,
    requestDeserialize: deserialize_signage_iam_v1_permission_CheckUserPermissionRequest,
    responseSerialize: serialize_signage_iam_v1_permission_CheckUserPermissionResponse,
    responseDeserialize: deserialize_signage_iam_v1_permission_CheckUserPermissionResponse,
  },
};

exports.PermissionServiceClient = grpc.makeGenericClientConstructor(PermissionServiceService, 'PermissionService');
