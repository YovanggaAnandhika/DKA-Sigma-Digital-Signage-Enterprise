// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var hardware_v1_device_device_common_pb = require('../../../hardware/v1/device/device.common_pb.js');

function serialize_signage_hardware_v1_device_DeleteDeviceRequest(arg) {
  if (!(arg instanceof hardware_v1_device_device_common_pb.DeleteDeviceRequest)) {
    throw new Error('Expected argument of type signage.hardware.v1.device.DeleteDeviceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_device_DeleteDeviceRequest(buffer_arg) {
  return hardware_v1_device_device_common_pb.DeleteDeviceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_device_DeleteDeviceResponse(arg) {
  if (!(arg instanceof hardware_v1_device_device_common_pb.DeleteDeviceResponse)) {
    throw new Error('Expected argument of type signage.hardware.v1.device.DeleteDeviceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_device_DeleteDeviceResponse(buffer_arg) {
  return hardware_v1_device_device_common_pb.DeleteDeviceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_device_Device(arg) {
  if (!(arg instanceof hardware_v1_device_device_common_pb.Device)) {
    throw new Error('Expected argument of type signage.hardware.v1.device.Device');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_device_Device(buffer_arg) {
  return hardware_v1_device_device_common_pb.Device.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_device_GetDeviceRequest(arg) {
  if (!(arg instanceof hardware_v1_device_device_common_pb.GetDeviceRequest)) {
    throw new Error('Expected argument of type signage.hardware.v1.device.GetDeviceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_device_GetDeviceRequest(buffer_arg) {
  return hardware_v1_device_device_common_pb.GetDeviceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_device_HeartbeatRequest(arg) {
  if (!(arg instanceof hardware_v1_device_device_common_pb.HeartbeatRequest)) {
    throw new Error('Expected argument of type signage.hardware.v1.device.HeartbeatRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_device_HeartbeatRequest(buffer_arg) {
  return hardware_v1_device_device_common_pb.HeartbeatRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_device_HeartbeatResponse(arg) {
  if (!(arg instanceof hardware_v1_device_device_common_pb.HeartbeatResponse)) {
    throw new Error('Expected argument of type signage.hardware.v1.device.HeartbeatResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_device_HeartbeatResponse(buffer_arg) {
  return hardware_v1_device_device_common_pb.HeartbeatResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_device_ListDevicesRequest(arg) {
  if (!(arg instanceof hardware_v1_device_device_common_pb.ListDevicesRequest)) {
    throw new Error('Expected argument of type signage.hardware.v1.device.ListDevicesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_device_ListDevicesRequest(buffer_arg) {
  return hardware_v1_device_device_common_pb.ListDevicesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_device_ListDevicesResponse(arg) {
  if (!(arg instanceof hardware_v1_device_device_common_pb.ListDevicesResponse)) {
    throw new Error('Expected argument of type signage.hardware.v1.device.ListDevicesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_device_ListDevicesResponse(buffer_arg) {
  return hardware_v1_device_device_common_pb.ListDevicesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_device_PairDeviceRequest(arg) {
  if (!(arg instanceof hardware_v1_device_device_common_pb.PairDeviceRequest)) {
    throw new Error('Expected argument of type signage.hardware.v1.device.PairDeviceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_device_PairDeviceRequest(buffer_arg) {
  return hardware_v1_device_device_common_pb.PairDeviceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_device_PairDeviceResponse(arg) {
  if (!(arg instanceof hardware_v1_device_device_common_pb.PairDeviceResponse)) {
    throw new Error('Expected argument of type signage.hardware.v1.device.PairDeviceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_device_PairDeviceResponse(buffer_arg) {
  return hardware_v1_device_device_common_pb.PairDeviceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_device_RegisterDeviceRequest(arg) {
  if (!(arg instanceof hardware_v1_device_device_common_pb.RegisterDeviceRequest)) {
    throw new Error('Expected argument of type signage.hardware.v1.device.RegisterDeviceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_device_RegisterDeviceRequest(buffer_arg) {
  return hardware_v1_device_device_common_pb.RegisterDeviceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_device_RegisterDeviceResponse(arg) {
  if (!(arg instanceof hardware_v1_device_device_common_pb.RegisterDeviceResponse)) {
    throw new Error('Expected argument of type signage.hardware.v1.device.RegisterDeviceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_device_RegisterDeviceResponse(buffer_arg) {
  return hardware_v1_device_device_common_pb.RegisterDeviceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_hardware_v1_device_UpdateDeviceRequest(arg) {
  if (!(arg instanceof hardware_v1_device_device_common_pb.UpdateDeviceRequest)) {
    throw new Error('Expected argument of type signage.hardware.v1.device.UpdateDeviceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_hardware_v1_device_UpdateDeviceRequest(buffer_arg) {
  return hardware_v1_device_device_common_pb.UpdateDeviceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


var DeviceServiceService = exports.DeviceServiceService = {
  // Retail Display Operations
registerDevice: {
    path: '/signage.hardware.v1.device.DeviceService/RegisterDevice',
    requestStream: false,
    responseStream: false,
    requestType: hardware_v1_device_device_common_pb.RegisterDeviceRequest,
    responseType: hardware_v1_device_device_common_pb.RegisterDeviceResponse,
    requestSerialize: serialize_signage_hardware_v1_device_RegisterDeviceRequest,
    requestDeserialize: deserialize_signage_hardware_v1_device_RegisterDeviceRequest,
    responseSerialize: serialize_signage_hardware_v1_device_RegisterDeviceResponse,
    responseDeserialize: deserialize_signage_hardware_v1_device_RegisterDeviceResponse,
  },
  pairDevice: {
    path: '/signage.hardware.v1.device.DeviceService/PairDevice',
    requestStream: false,
    responseStream: false,
    requestType: hardware_v1_device_device_common_pb.PairDeviceRequest,
    responseType: hardware_v1_device_device_common_pb.PairDeviceResponse,
    requestSerialize: serialize_signage_hardware_v1_device_PairDeviceRequest,
    requestDeserialize: deserialize_signage_hardware_v1_device_PairDeviceRequest,
    responseSerialize: serialize_signage_hardware_v1_device_PairDeviceResponse,
    responseDeserialize: deserialize_signage_hardware_v1_device_PairDeviceResponse,
  },
  sendHeartbeat: {
    path: '/signage.hardware.v1.device.DeviceService/SendHeartbeat',
    requestStream: false,
    responseStream: false,
    requestType: hardware_v1_device_device_common_pb.HeartbeatRequest,
    responseType: hardware_v1_device_device_common_pb.HeartbeatResponse,
    requestSerialize: serialize_signage_hardware_v1_device_HeartbeatRequest,
    requestDeserialize: deserialize_signage_hardware_v1_device_HeartbeatRequest,
    responseSerialize: serialize_signage_hardware_v1_device_HeartbeatResponse,
    responseDeserialize: deserialize_signage_hardware_v1_device_HeartbeatResponse,
  },
  // Backoffice Device CRUD
getDevice: {
    path: '/signage.hardware.v1.device.DeviceService/GetDevice',
    requestStream: false,
    responseStream: false,
    requestType: hardware_v1_device_device_common_pb.GetDeviceRequest,
    responseType: hardware_v1_device_device_common_pb.Device,
    requestSerialize: serialize_signage_hardware_v1_device_GetDeviceRequest,
    requestDeserialize: deserialize_signage_hardware_v1_device_GetDeviceRequest,
    responseSerialize: serialize_signage_hardware_v1_device_Device,
    responseDeserialize: deserialize_signage_hardware_v1_device_Device,
  },
  listDevices: {
    path: '/signage.hardware.v1.device.DeviceService/ListDevices',
    requestStream: false,
    responseStream: false,
    requestType: hardware_v1_device_device_common_pb.ListDevicesRequest,
    responseType: hardware_v1_device_device_common_pb.ListDevicesResponse,
    requestSerialize: serialize_signage_hardware_v1_device_ListDevicesRequest,
    requestDeserialize: deserialize_signage_hardware_v1_device_ListDevicesRequest,
    responseSerialize: serialize_signage_hardware_v1_device_ListDevicesResponse,
    responseDeserialize: deserialize_signage_hardware_v1_device_ListDevicesResponse,
  },
  updateDevice: {
    path: '/signage.hardware.v1.device.DeviceService/UpdateDevice',
    requestStream: false,
    responseStream: false,
    requestType: hardware_v1_device_device_common_pb.UpdateDeviceRequest,
    responseType: hardware_v1_device_device_common_pb.Device,
    requestSerialize: serialize_signage_hardware_v1_device_UpdateDeviceRequest,
    requestDeserialize: deserialize_signage_hardware_v1_device_UpdateDeviceRequest,
    responseSerialize: serialize_signage_hardware_v1_device_Device,
    responseDeserialize: deserialize_signage_hardware_v1_device_Device,
  },
  deleteDevice: {
    path: '/signage.hardware.v1.device.DeviceService/DeleteDevice',
    requestStream: false,
    responseStream: false,
    requestType: hardware_v1_device_device_common_pb.DeleteDeviceRequest,
    responseType: hardware_v1_device_device_common_pb.DeleteDeviceResponse,
    requestSerialize: serialize_signage_hardware_v1_device_DeleteDeviceRequest,
    requestDeserialize: deserialize_signage_hardware_v1_device_DeleteDeviceRequest,
    responseSerialize: serialize_signage_hardware_v1_device_DeleteDeviceResponse,
    responseDeserialize: deserialize_signage_hardware_v1_device_DeleteDeviceResponse,
  },
};

exports.DeviceServiceClient = grpc.makeGenericClientConstructor(DeviceServiceService, 'DeviceService');
