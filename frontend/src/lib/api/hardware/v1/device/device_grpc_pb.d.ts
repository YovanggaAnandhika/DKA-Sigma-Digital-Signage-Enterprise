// package: signage.hardware.v1.device
// file: hardware/v1/device/device.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as hardware_v1_device_device_pb from "../../../hardware/v1/device/device_pb";
import * as hardware_v1_device_device_common_pb from "../../../hardware/v1/device/device.common_pb";

interface IDeviceServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    registerDevice: IDeviceServiceService_IRegisterDevice;
    pairDevice: IDeviceServiceService_IPairDevice;
    sendHeartbeat: IDeviceServiceService_ISendHeartbeat;
    getDevice: IDeviceServiceService_IGetDevice;
    listDevices: IDeviceServiceService_IListDevices;
    updateDevice: IDeviceServiceService_IUpdateDevice;
    deleteDevice: IDeviceServiceService_IDeleteDevice;
}

interface IDeviceServiceService_IRegisterDevice extends grpc.MethodDefinition<hardware_v1_device_device_common_pb.RegisterDeviceRequest, hardware_v1_device_device_common_pb.RegisterDeviceResponse> {
    path: "/signage.hardware.v1.device.DeviceService/RegisterDevice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<hardware_v1_device_device_common_pb.RegisterDeviceRequest>;
    requestDeserialize: grpc.deserialize<hardware_v1_device_device_common_pb.RegisterDeviceRequest>;
    responseSerialize: grpc.serialize<hardware_v1_device_device_common_pb.RegisterDeviceResponse>;
    responseDeserialize: grpc.deserialize<hardware_v1_device_device_common_pb.RegisterDeviceResponse>;
}
interface IDeviceServiceService_IPairDevice extends grpc.MethodDefinition<hardware_v1_device_device_common_pb.PairDeviceRequest, hardware_v1_device_device_common_pb.PairDeviceResponse> {
    path: "/signage.hardware.v1.device.DeviceService/PairDevice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<hardware_v1_device_device_common_pb.PairDeviceRequest>;
    requestDeserialize: grpc.deserialize<hardware_v1_device_device_common_pb.PairDeviceRequest>;
    responseSerialize: grpc.serialize<hardware_v1_device_device_common_pb.PairDeviceResponse>;
    responseDeserialize: grpc.deserialize<hardware_v1_device_device_common_pb.PairDeviceResponse>;
}
interface IDeviceServiceService_ISendHeartbeat extends grpc.MethodDefinition<hardware_v1_device_device_common_pb.HeartbeatRequest, hardware_v1_device_device_common_pb.HeartbeatResponse> {
    path: "/signage.hardware.v1.device.DeviceService/SendHeartbeat";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<hardware_v1_device_device_common_pb.HeartbeatRequest>;
    requestDeserialize: grpc.deserialize<hardware_v1_device_device_common_pb.HeartbeatRequest>;
    responseSerialize: grpc.serialize<hardware_v1_device_device_common_pb.HeartbeatResponse>;
    responseDeserialize: grpc.deserialize<hardware_v1_device_device_common_pb.HeartbeatResponse>;
}
interface IDeviceServiceService_IGetDevice extends grpc.MethodDefinition<hardware_v1_device_device_common_pb.GetDeviceRequest, hardware_v1_device_device_common_pb.Device> {
    path: "/signage.hardware.v1.device.DeviceService/GetDevice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<hardware_v1_device_device_common_pb.GetDeviceRequest>;
    requestDeserialize: grpc.deserialize<hardware_v1_device_device_common_pb.GetDeviceRequest>;
    responseSerialize: grpc.serialize<hardware_v1_device_device_common_pb.Device>;
    responseDeserialize: grpc.deserialize<hardware_v1_device_device_common_pb.Device>;
}
interface IDeviceServiceService_IListDevices extends grpc.MethodDefinition<hardware_v1_device_device_common_pb.ListDevicesRequest, hardware_v1_device_device_common_pb.ListDevicesResponse> {
    path: "/signage.hardware.v1.device.DeviceService/ListDevices";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<hardware_v1_device_device_common_pb.ListDevicesRequest>;
    requestDeserialize: grpc.deserialize<hardware_v1_device_device_common_pb.ListDevicesRequest>;
    responseSerialize: grpc.serialize<hardware_v1_device_device_common_pb.ListDevicesResponse>;
    responseDeserialize: grpc.deserialize<hardware_v1_device_device_common_pb.ListDevicesResponse>;
}
interface IDeviceServiceService_IUpdateDevice extends grpc.MethodDefinition<hardware_v1_device_device_common_pb.UpdateDeviceRequest, hardware_v1_device_device_common_pb.Device> {
    path: "/signage.hardware.v1.device.DeviceService/UpdateDevice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<hardware_v1_device_device_common_pb.UpdateDeviceRequest>;
    requestDeserialize: grpc.deserialize<hardware_v1_device_device_common_pb.UpdateDeviceRequest>;
    responseSerialize: grpc.serialize<hardware_v1_device_device_common_pb.Device>;
    responseDeserialize: grpc.deserialize<hardware_v1_device_device_common_pb.Device>;
}
interface IDeviceServiceService_IDeleteDevice extends grpc.MethodDefinition<hardware_v1_device_device_common_pb.DeleteDeviceRequest, hardware_v1_device_device_common_pb.DeleteDeviceResponse> {
    path: "/signage.hardware.v1.device.DeviceService/DeleteDevice";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<hardware_v1_device_device_common_pb.DeleteDeviceRequest>;
    requestDeserialize: grpc.deserialize<hardware_v1_device_device_common_pb.DeleteDeviceRequest>;
    responseSerialize: grpc.serialize<hardware_v1_device_device_common_pb.DeleteDeviceResponse>;
    responseDeserialize: grpc.deserialize<hardware_v1_device_device_common_pb.DeleteDeviceResponse>;
}

export const DeviceServiceService: IDeviceServiceService;

export interface IDeviceServiceServer extends grpc.UntypedServiceImplementation {
    registerDevice: grpc.handleUnaryCall<hardware_v1_device_device_common_pb.RegisterDeviceRequest, hardware_v1_device_device_common_pb.RegisterDeviceResponse>;
    pairDevice: grpc.handleUnaryCall<hardware_v1_device_device_common_pb.PairDeviceRequest, hardware_v1_device_device_common_pb.PairDeviceResponse>;
    sendHeartbeat: grpc.handleUnaryCall<hardware_v1_device_device_common_pb.HeartbeatRequest, hardware_v1_device_device_common_pb.HeartbeatResponse>;
    getDevice: grpc.handleUnaryCall<hardware_v1_device_device_common_pb.GetDeviceRequest, hardware_v1_device_device_common_pb.Device>;
    listDevices: grpc.handleUnaryCall<hardware_v1_device_device_common_pb.ListDevicesRequest, hardware_v1_device_device_common_pb.ListDevicesResponse>;
    updateDevice: grpc.handleUnaryCall<hardware_v1_device_device_common_pb.UpdateDeviceRequest, hardware_v1_device_device_common_pb.Device>;
    deleteDevice: grpc.handleUnaryCall<hardware_v1_device_device_common_pb.DeleteDeviceRequest, hardware_v1_device_device_common_pb.DeleteDeviceResponse>;
}

export interface IDeviceServiceClient {
    registerDevice(request: hardware_v1_device_device_common_pb.RegisterDeviceRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.RegisterDeviceResponse) => void): grpc.ClientUnaryCall;
    registerDevice(request: hardware_v1_device_device_common_pb.RegisterDeviceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.RegisterDeviceResponse) => void): grpc.ClientUnaryCall;
    registerDevice(request: hardware_v1_device_device_common_pb.RegisterDeviceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.RegisterDeviceResponse) => void): grpc.ClientUnaryCall;
    pairDevice(request: hardware_v1_device_device_common_pb.PairDeviceRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.PairDeviceResponse) => void): grpc.ClientUnaryCall;
    pairDevice(request: hardware_v1_device_device_common_pb.PairDeviceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.PairDeviceResponse) => void): grpc.ClientUnaryCall;
    pairDevice(request: hardware_v1_device_device_common_pb.PairDeviceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.PairDeviceResponse) => void): grpc.ClientUnaryCall;
    sendHeartbeat(request: hardware_v1_device_device_common_pb.HeartbeatRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.HeartbeatResponse) => void): grpc.ClientUnaryCall;
    sendHeartbeat(request: hardware_v1_device_device_common_pb.HeartbeatRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.HeartbeatResponse) => void): grpc.ClientUnaryCall;
    sendHeartbeat(request: hardware_v1_device_device_common_pb.HeartbeatRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.HeartbeatResponse) => void): grpc.ClientUnaryCall;
    getDevice(request: hardware_v1_device_device_common_pb.GetDeviceRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.Device) => void): grpc.ClientUnaryCall;
    getDevice(request: hardware_v1_device_device_common_pb.GetDeviceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.Device) => void): grpc.ClientUnaryCall;
    getDevice(request: hardware_v1_device_device_common_pb.GetDeviceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.Device) => void): grpc.ClientUnaryCall;
    listDevices(request: hardware_v1_device_device_common_pb.ListDevicesRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.ListDevicesResponse) => void): grpc.ClientUnaryCall;
    listDevices(request: hardware_v1_device_device_common_pb.ListDevicesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.ListDevicesResponse) => void): grpc.ClientUnaryCall;
    listDevices(request: hardware_v1_device_device_common_pb.ListDevicesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.ListDevicesResponse) => void): grpc.ClientUnaryCall;
    updateDevice(request: hardware_v1_device_device_common_pb.UpdateDeviceRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.Device) => void): grpc.ClientUnaryCall;
    updateDevice(request: hardware_v1_device_device_common_pb.UpdateDeviceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.Device) => void): grpc.ClientUnaryCall;
    updateDevice(request: hardware_v1_device_device_common_pb.UpdateDeviceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.Device) => void): grpc.ClientUnaryCall;
    deleteDevice(request: hardware_v1_device_device_common_pb.DeleteDeviceRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.DeleteDeviceResponse) => void): grpc.ClientUnaryCall;
    deleteDevice(request: hardware_v1_device_device_common_pb.DeleteDeviceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.DeleteDeviceResponse) => void): grpc.ClientUnaryCall;
    deleteDevice(request: hardware_v1_device_device_common_pb.DeleteDeviceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.DeleteDeviceResponse) => void): grpc.ClientUnaryCall;
}

export class DeviceServiceClient extends grpc.Client implements IDeviceServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public registerDevice(request: hardware_v1_device_device_common_pb.RegisterDeviceRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.RegisterDeviceResponse) => void): grpc.ClientUnaryCall;
    public registerDevice(request: hardware_v1_device_device_common_pb.RegisterDeviceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.RegisterDeviceResponse) => void): grpc.ClientUnaryCall;
    public registerDevice(request: hardware_v1_device_device_common_pb.RegisterDeviceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.RegisterDeviceResponse) => void): grpc.ClientUnaryCall;
    public pairDevice(request: hardware_v1_device_device_common_pb.PairDeviceRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.PairDeviceResponse) => void): grpc.ClientUnaryCall;
    public pairDevice(request: hardware_v1_device_device_common_pb.PairDeviceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.PairDeviceResponse) => void): grpc.ClientUnaryCall;
    public pairDevice(request: hardware_v1_device_device_common_pb.PairDeviceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.PairDeviceResponse) => void): grpc.ClientUnaryCall;
    public sendHeartbeat(request: hardware_v1_device_device_common_pb.HeartbeatRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.HeartbeatResponse) => void): grpc.ClientUnaryCall;
    public sendHeartbeat(request: hardware_v1_device_device_common_pb.HeartbeatRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.HeartbeatResponse) => void): grpc.ClientUnaryCall;
    public sendHeartbeat(request: hardware_v1_device_device_common_pb.HeartbeatRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.HeartbeatResponse) => void): grpc.ClientUnaryCall;
    public getDevice(request: hardware_v1_device_device_common_pb.GetDeviceRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.Device) => void): grpc.ClientUnaryCall;
    public getDevice(request: hardware_v1_device_device_common_pb.GetDeviceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.Device) => void): grpc.ClientUnaryCall;
    public getDevice(request: hardware_v1_device_device_common_pb.GetDeviceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.Device) => void): grpc.ClientUnaryCall;
    public listDevices(request: hardware_v1_device_device_common_pb.ListDevicesRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.ListDevicesResponse) => void): grpc.ClientUnaryCall;
    public listDevices(request: hardware_v1_device_device_common_pb.ListDevicesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.ListDevicesResponse) => void): grpc.ClientUnaryCall;
    public listDevices(request: hardware_v1_device_device_common_pb.ListDevicesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.ListDevicesResponse) => void): grpc.ClientUnaryCall;
    public updateDevice(request: hardware_v1_device_device_common_pb.UpdateDeviceRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.Device) => void): grpc.ClientUnaryCall;
    public updateDevice(request: hardware_v1_device_device_common_pb.UpdateDeviceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.Device) => void): grpc.ClientUnaryCall;
    public updateDevice(request: hardware_v1_device_device_common_pb.UpdateDeviceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.Device) => void): grpc.ClientUnaryCall;
    public deleteDevice(request: hardware_v1_device_device_common_pb.DeleteDeviceRequest, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.DeleteDeviceResponse) => void): grpc.ClientUnaryCall;
    public deleteDevice(request: hardware_v1_device_device_common_pb.DeleteDeviceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.DeleteDeviceResponse) => void): grpc.ClientUnaryCall;
    public deleteDevice(request: hardware_v1_device_device_common_pb.DeleteDeviceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: hardware_v1_device_device_common_pb.DeleteDeviceResponse) => void): grpc.ClientUnaryCall;
}
