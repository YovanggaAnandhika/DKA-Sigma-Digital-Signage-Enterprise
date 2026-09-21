// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var iam_v1_user_user_common_pb = require('../../../iam/v1/user/user.common_pb.js');

function serialize_signage_iam_v1_user_CreateUserRequest(arg) {
  if (!(arg instanceof iam_v1_user_user_common_pb.CreateUserRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.user.CreateUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_user_CreateUserRequest(buffer_arg) {
  return iam_v1_user_user_common_pb.CreateUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_user_DeleteUserRequest(arg) {
  if (!(arg instanceof iam_v1_user_user_common_pb.DeleteUserRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.user.DeleteUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_user_DeleteUserRequest(buffer_arg) {
  return iam_v1_user_user_common_pb.DeleteUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_user_DeleteUserResponse(arg) {
  if (!(arg instanceof iam_v1_user_user_common_pb.DeleteUserResponse)) {
    throw new Error('Expected argument of type signage.iam.v1.user.DeleteUserResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_user_DeleteUserResponse(buffer_arg) {
  return iam_v1_user_user_common_pb.DeleteUserResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_user_GetUserRequest(arg) {
  if (!(arg instanceof iam_v1_user_user_common_pb.GetUserRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.user.GetUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_user_GetUserRequest(buffer_arg) {
  return iam_v1_user_user_common_pb.GetUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_user_ListUsersRequest(arg) {
  if (!(arg instanceof iam_v1_user_user_common_pb.ListUsersRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.user.ListUsersRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_user_ListUsersRequest(buffer_arg) {
  return iam_v1_user_user_common_pb.ListUsersRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_user_ListUsersResponse(arg) {
  if (!(arg instanceof iam_v1_user_user_common_pb.ListUsersResponse)) {
    throw new Error('Expected argument of type signage.iam.v1.user.ListUsersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_user_ListUsersResponse(buffer_arg) {
  return iam_v1_user_user_common_pb.ListUsersResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_user_LoginRequest(arg) {
  if (!(arg instanceof iam_v1_user_user_common_pb.LoginRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.user.LoginRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_user_LoginRequest(buffer_arg) {
  return iam_v1_user_user_common_pb.LoginRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_user_LoginResponse(arg) {
  if (!(arg instanceof iam_v1_user_user_common_pb.LoginResponse)) {
    throw new Error('Expected argument of type signage.iam.v1.user.LoginResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_user_LoginResponse(buffer_arg) {
  return iam_v1_user_user_common_pb.LoginResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_user_UpdateUserRequest(arg) {
  if (!(arg instanceof iam_v1_user_user_common_pb.UpdateUserRequest)) {
    throw new Error('Expected argument of type signage.iam.v1.user.UpdateUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_user_UpdateUserRequest(buffer_arg) {
  return iam_v1_user_user_common_pb.UpdateUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_iam_v1_user_User(arg) {
  if (!(arg instanceof iam_v1_user_user_common_pb.User)) {
    throw new Error('Expected argument of type signage.iam.v1.user.User');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_iam_v1_user_User(buffer_arg) {
  return iam_v1_user_user_common_pb.User.deserializeBinary(new Uint8Array(buffer_arg));
}


var UserServiceService = exports.UserServiceService = {
  createUser: {
    path: '/signage.iam.v1.user.UserService/CreateUser',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_user_user_common_pb.CreateUserRequest,
    responseType: iam_v1_user_user_common_pb.User,
    requestSerialize: serialize_signage_iam_v1_user_CreateUserRequest,
    requestDeserialize: deserialize_signage_iam_v1_user_CreateUserRequest,
    responseSerialize: serialize_signage_iam_v1_user_User,
    responseDeserialize: deserialize_signage_iam_v1_user_User,
  },
  getUser: {
    path: '/signage.iam.v1.user.UserService/GetUser',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_user_user_common_pb.GetUserRequest,
    responseType: iam_v1_user_user_common_pb.User,
    requestSerialize: serialize_signage_iam_v1_user_GetUserRequest,
    requestDeserialize: deserialize_signage_iam_v1_user_GetUserRequest,
    responseSerialize: serialize_signage_iam_v1_user_User,
    responseDeserialize: deserialize_signage_iam_v1_user_User,
  },
  listUsers: {
    path: '/signage.iam.v1.user.UserService/ListUsers',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_user_user_common_pb.ListUsersRequest,
    responseType: iam_v1_user_user_common_pb.ListUsersResponse,
    requestSerialize: serialize_signage_iam_v1_user_ListUsersRequest,
    requestDeserialize: deserialize_signage_iam_v1_user_ListUsersRequest,
    responseSerialize: serialize_signage_iam_v1_user_ListUsersResponse,
    responseDeserialize: deserialize_signage_iam_v1_user_ListUsersResponse,
  },
  updateUser: {
    path: '/signage.iam.v1.user.UserService/UpdateUser',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_user_user_common_pb.UpdateUserRequest,
    responseType: iam_v1_user_user_common_pb.User,
    requestSerialize: serialize_signage_iam_v1_user_UpdateUserRequest,
    requestDeserialize: deserialize_signage_iam_v1_user_UpdateUserRequest,
    responseSerialize: serialize_signage_iam_v1_user_User,
    responseDeserialize: deserialize_signage_iam_v1_user_User,
  },
  deleteUser: {
    path: '/signage.iam.v1.user.UserService/DeleteUser',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_user_user_common_pb.DeleteUserRequest,
    responseType: iam_v1_user_user_common_pb.DeleteUserResponse,
    requestSerialize: serialize_signage_iam_v1_user_DeleteUserRequest,
    requestDeserialize: deserialize_signage_iam_v1_user_DeleteUserRequest,
    responseSerialize: serialize_signage_iam_v1_user_DeleteUserResponse,
    responseDeserialize: deserialize_signage_iam_v1_user_DeleteUserResponse,
  },
  login: {
    path: '/signage.iam.v1.user.UserService/Login',
    requestStream: false,
    responseStream: false,
    requestType: iam_v1_user_user_common_pb.LoginRequest,
    responseType: iam_v1_user_user_common_pb.LoginResponse,
    requestSerialize: serialize_signage_iam_v1_user_LoginRequest,
    requestDeserialize: deserialize_signage_iam_v1_user_LoginRequest,
    responseSerialize: serialize_signage_iam_v1_user_LoginResponse,
    responseDeserialize: deserialize_signage_iam_v1_user_LoginResponse,
  },
};

exports.UserServiceClient = grpc.makeGenericClientConstructor(UserServiceService, 'UserService');
