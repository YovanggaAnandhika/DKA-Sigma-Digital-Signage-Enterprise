// package: signage.iam.v1.user
// file: iam/v1/user/user.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as iam_v1_user_user_pb from "../../../iam/v1/user/user_pb";
import * as iam_v1_user_user_common_pb from "../../../iam/v1/user/user.common_pb";

interface IUserServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createUser: IUserServiceService_ICreateUser;
    getUser: IUserServiceService_IGetUser;
    listUsers: IUserServiceService_IListUsers;
    updateUser: IUserServiceService_IUpdateUser;
    deleteUser: IUserServiceService_IDeleteUser;
    login: IUserServiceService_ILogin;
}

interface IUserServiceService_ICreateUser extends grpc.MethodDefinition<iam_v1_user_user_common_pb.CreateUserRequest, iam_v1_user_user_common_pb.User> {
    path: "/signage.iam.v1.user.UserService/CreateUser";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_user_user_common_pb.CreateUserRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_user_user_common_pb.CreateUserRequest>;
    responseSerialize: grpc.serialize<iam_v1_user_user_common_pb.User>;
    responseDeserialize: grpc.deserialize<iam_v1_user_user_common_pb.User>;
}
interface IUserServiceService_IGetUser extends grpc.MethodDefinition<iam_v1_user_user_common_pb.GetUserRequest, iam_v1_user_user_common_pb.User> {
    path: "/signage.iam.v1.user.UserService/GetUser";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_user_user_common_pb.GetUserRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_user_user_common_pb.GetUserRequest>;
    responseSerialize: grpc.serialize<iam_v1_user_user_common_pb.User>;
    responseDeserialize: grpc.deserialize<iam_v1_user_user_common_pb.User>;
}
interface IUserServiceService_IListUsers extends grpc.MethodDefinition<iam_v1_user_user_common_pb.ListUsersRequest, iam_v1_user_user_common_pb.ListUsersResponse> {
    path: "/signage.iam.v1.user.UserService/ListUsers";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_user_user_common_pb.ListUsersRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_user_user_common_pb.ListUsersRequest>;
    responseSerialize: grpc.serialize<iam_v1_user_user_common_pb.ListUsersResponse>;
    responseDeserialize: grpc.deserialize<iam_v1_user_user_common_pb.ListUsersResponse>;
}
interface IUserServiceService_IUpdateUser extends grpc.MethodDefinition<iam_v1_user_user_common_pb.UpdateUserRequest, iam_v1_user_user_common_pb.User> {
    path: "/signage.iam.v1.user.UserService/UpdateUser";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_user_user_common_pb.UpdateUserRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_user_user_common_pb.UpdateUserRequest>;
    responseSerialize: grpc.serialize<iam_v1_user_user_common_pb.User>;
    responseDeserialize: grpc.deserialize<iam_v1_user_user_common_pb.User>;
}
interface IUserServiceService_IDeleteUser extends grpc.MethodDefinition<iam_v1_user_user_common_pb.DeleteUserRequest, iam_v1_user_user_common_pb.DeleteUserResponse> {
    path: "/signage.iam.v1.user.UserService/DeleteUser";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_user_user_common_pb.DeleteUserRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_user_user_common_pb.DeleteUserRequest>;
    responseSerialize: grpc.serialize<iam_v1_user_user_common_pb.DeleteUserResponse>;
    responseDeserialize: grpc.deserialize<iam_v1_user_user_common_pb.DeleteUserResponse>;
}
interface IUserServiceService_ILogin extends grpc.MethodDefinition<iam_v1_user_user_common_pb.LoginRequest, iam_v1_user_user_common_pb.LoginResponse> {
    path: "/signage.iam.v1.user.UserService/Login";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<iam_v1_user_user_common_pb.LoginRequest>;
    requestDeserialize: grpc.deserialize<iam_v1_user_user_common_pb.LoginRequest>;
    responseSerialize: grpc.serialize<iam_v1_user_user_common_pb.LoginResponse>;
    responseDeserialize: grpc.deserialize<iam_v1_user_user_common_pb.LoginResponse>;
}

export const UserServiceService: IUserServiceService;

export interface IUserServiceServer extends grpc.UntypedServiceImplementation {
    createUser: grpc.handleUnaryCall<iam_v1_user_user_common_pb.CreateUserRequest, iam_v1_user_user_common_pb.User>;
    getUser: grpc.handleUnaryCall<iam_v1_user_user_common_pb.GetUserRequest, iam_v1_user_user_common_pb.User>;
    listUsers: grpc.handleUnaryCall<iam_v1_user_user_common_pb.ListUsersRequest, iam_v1_user_user_common_pb.ListUsersResponse>;
    updateUser: grpc.handleUnaryCall<iam_v1_user_user_common_pb.UpdateUserRequest, iam_v1_user_user_common_pb.User>;
    deleteUser: grpc.handleUnaryCall<iam_v1_user_user_common_pb.DeleteUserRequest, iam_v1_user_user_common_pb.DeleteUserResponse>;
    login: grpc.handleUnaryCall<iam_v1_user_user_common_pb.LoginRequest, iam_v1_user_user_common_pb.LoginResponse>;
}

export interface IUserServiceClient {
    createUser(request: iam_v1_user_user_common_pb.CreateUserRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    createUser(request: iam_v1_user_user_common_pb.CreateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    createUser(request: iam_v1_user_user_common_pb.CreateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    getUser(request: iam_v1_user_user_common_pb.GetUserRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    getUser(request: iam_v1_user_user_common_pb.GetUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    getUser(request: iam_v1_user_user_common_pb.GetUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    listUsers(request: iam_v1_user_user_common_pb.ListUsersRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.ListUsersResponse) => void): grpc.ClientUnaryCall;
    listUsers(request: iam_v1_user_user_common_pb.ListUsersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.ListUsersResponse) => void): grpc.ClientUnaryCall;
    listUsers(request: iam_v1_user_user_common_pb.ListUsersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.ListUsersResponse) => void): grpc.ClientUnaryCall;
    updateUser(request: iam_v1_user_user_common_pb.UpdateUserRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    updateUser(request: iam_v1_user_user_common_pb.UpdateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    updateUser(request: iam_v1_user_user_common_pb.UpdateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    deleteUser(request: iam_v1_user_user_common_pb.DeleteUserRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.DeleteUserResponse) => void): grpc.ClientUnaryCall;
    deleteUser(request: iam_v1_user_user_common_pb.DeleteUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.DeleteUserResponse) => void): grpc.ClientUnaryCall;
    deleteUser(request: iam_v1_user_user_common_pb.DeleteUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.DeleteUserResponse) => void): grpc.ClientUnaryCall;
    login(request: iam_v1_user_user_common_pb.LoginRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    login(request: iam_v1_user_user_common_pb.LoginRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    login(request: iam_v1_user_user_common_pb.LoginRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.LoginResponse) => void): grpc.ClientUnaryCall;
}

export class UserServiceClient extends grpc.Client implements IUserServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createUser(request: iam_v1_user_user_common_pb.CreateUserRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    public createUser(request: iam_v1_user_user_common_pb.CreateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    public createUser(request: iam_v1_user_user_common_pb.CreateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    public getUser(request: iam_v1_user_user_common_pb.GetUserRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    public getUser(request: iam_v1_user_user_common_pb.GetUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    public getUser(request: iam_v1_user_user_common_pb.GetUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    public listUsers(request: iam_v1_user_user_common_pb.ListUsersRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.ListUsersResponse) => void): grpc.ClientUnaryCall;
    public listUsers(request: iam_v1_user_user_common_pb.ListUsersRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.ListUsersResponse) => void): grpc.ClientUnaryCall;
    public listUsers(request: iam_v1_user_user_common_pb.ListUsersRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.ListUsersResponse) => void): grpc.ClientUnaryCall;
    public updateUser(request: iam_v1_user_user_common_pb.UpdateUserRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    public updateUser(request: iam_v1_user_user_common_pb.UpdateUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    public updateUser(request: iam_v1_user_user_common_pb.UpdateUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.User) => void): grpc.ClientUnaryCall;
    public deleteUser(request: iam_v1_user_user_common_pb.DeleteUserRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.DeleteUserResponse) => void): grpc.ClientUnaryCall;
    public deleteUser(request: iam_v1_user_user_common_pb.DeleteUserRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.DeleteUserResponse) => void): grpc.ClientUnaryCall;
    public deleteUser(request: iam_v1_user_user_common_pb.DeleteUserRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.DeleteUserResponse) => void): grpc.ClientUnaryCall;
    public login(request: iam_v1_user_user_common_pb.LoginRequest, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    public login(request: iam_v1_user_user_common_pb.LoginRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.LoginResponse) => void): grpc.ClientUnaryCall;
    public login(request: iam_v1_user_user_common_pb.LoginRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: iam_v1_user_user_common_pb.LoginResponse) => void): grpc.ClientUnaryCall;
}
