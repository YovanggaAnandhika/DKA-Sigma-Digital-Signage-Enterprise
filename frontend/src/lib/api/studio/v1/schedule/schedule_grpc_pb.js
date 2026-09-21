// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var studio_v1_schedule_schedule_common_pb = require('../../../studio/v1/schedule/schedule.common_pb.js');

function serialize_signage_studio_v1_schedule_AddScheduleEventRequest(arg) {
  if (!(arg instanceof studio_v1_schedule_schedule_common_pb.AddScheduleEventRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.schedule.AddScheduleEventRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_schedule_AddScheduleEventRequest(buffer_arg) {
  return studio_v1_schedule_schedule_common_pb.AddScheduleEventRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_schedule_CreateScheduleRequest(arg) {
  if (!(arg instanceof studio_v1_schedule_schedule_common_pb.CreateScheduleRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.schedule.CreateScheduleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_schedule_CreateScheduleRequest(buffer_arg) {
  return studio_v1_schedule_schedule_common_pb.CreateScheduleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_schedule_DeleteScheduleRequest(arg) {
  if (!(arg instanceof studio_v1_schedule_schedule_common_pb.DeleteScheduleRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.schedule.DeleteScheduleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_schedule_DeleteScheduleRequest(buffer_arg) {
  return studio_v1_schedule_schedule_common_pb.DeleteScheduleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_schedule_DeleteScheduleResponse(arg) {
  if (!(arg instanceof studio_v1_schedule_schedule_common_pb.DeleteScheduleResponse)) {
    throw new Error('Expected argument of type signage.studio.v1.schedule.DeleteScheduleResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_schedule_DeleteScheduleResponse(buffer_arg) {
  return studio_v1_schedule_schedule_common_pb.DeleteScheduleResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_schedule_GetScheduleRequest(arg) {
  if (!(arg instanceof studio_v1_schedule_schedule_common_pb.GetScheduleRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.schedule.GetScheduleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_schedule_GetScheduleRequest(buffer_arg) {
  return studio_v1_schedule_schedule_common_pb.GetScheduleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_schedule_ListSchedulesRequest(arg) {
  if (!(arg instanceof studio_v1_schedule_schedule_common_pb.ListSchedulesRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.schedule.ListSchedulesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_schedule_ListSchedulesRequest(buffer_arg) {
  return studio_v1_schedule_schedule_common_pb.ListSchedulesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_schedule_ListSchedulesResponse(arg) {
  if (!(arg instanceof studio_v1_schedule_schedule_common_pb.ListSchedulesResponse)) {
    throw new Error('Expected argument of type signage.studio.v1.schedule.ListSchedulesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_schedule_ListSchedulesResponse(buffer_arg) {
  return studio_v1_schedule_schedule_common_pb.ListSchedulesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_schedule_RemoveScheduleEventRequest(arg) {
  if (!(arg instanceof studio_v1_schedule_schedule_common_pb.RemoveScheduleEventRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.schedule.RemoveScheduleEventRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_schedule_RemoveScheduleEventRequest(buffer_arg) {
  return studio_v1_schedule_schedule_common_pb.RemoveScheduleEventRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_schedule_RemoveScheduleEventResponse(arg) {
  if (!(arg instanceof studio_v1_schedule_schedule_common_pb.RemoveScheduleEventResponse)) {
    throw new Error('Expected argument of type signage.studio.v1.schedule.RemoveScheduleEventResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_schedule_RemoveScheduleEventResponse(buffer_arg) {
  return studio_v1_schedule_schedule_common_pb.RemoveScheduleEventResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_schedule_Schedule(arg) {
  if (!(arg instanceof studio_v1_schedule_schedule_common_pb.Schedule)) {
    throw new Error('Expected argument of type signage.studio.v1.schedule.Schedule');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_schedule_Schedule(buffer_arg) {
  return studio_v1_schedule_schedule_common_pb.Schedule.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_schedule_ScheduleEvent(arg) {
  if (!(arg instanceof studio_v1_schedule_schedule_common_pb.ScheduleEvent)) {
    throw new Error('Expected argument of type signage.studio.v1.schedule.ScheduleEvent');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_schedule_ScheduleEvent(buffer_arg) {
  return studio_v1_schedule_schedule_common_pb.ScheduleEvent.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_schedule_UpdateScheduleRequest(arg) {
  if (!(arg instanceof studio_v1_schedule_schedule_common_pb.UpdateScheduleRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.schedule.UpdateScheduleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_schedule_UpdateScheduleRequest(buffer_arg) {
  return studio_v1_schedule_schedule_common_pb.UpdateScheduleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


var ScheduleServiceService = exports.ScheduleServiceService = {
  createSchedule: {
    path: '/signage.studio.v1.schedule.ScheduleService/CreateSchedule',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_schedule_schedule_common_pb.CreateScheduleRequest,
    responseType: studio_v1_schedule_schedule_common_pb.Schedule,
    requestSerialize: serialize_signage_studio_v1_schedule_CreateScheduleRequest,
    requestDeserialize: deserialize_signage_studio_v1_schedule_CreateScheduleRequest,
    responseSerialize: serialize_signage_studio_v1_schedule_Schedule,
    responseDeserialize: deserialize_signage_studio_v1_schedule_Schedule,
  },
  getSchedule: {
    path: '/signage.studio.v1.schedule.ScheduleService/GetSchedule',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_schedule_schedule_common_pb.GetScheduleRequest,
    responseType: studio_v1_schedule_schedule_common_pb.Schedule,
    requestSerialize: serialize_signage_studio_v1_schedule_GetScheduleRequest,
    requestDeserialize: deserialize_signage_studio_v1_schedule_GetScheduleRequest,
    responseSerialize: serialize_signage_studio_v1_schedule_Schedule,
    responseDeserialize: deserialize_signage_studio_v1_schedule_Schedule,
  },
  listSchedules: {
    path: '/signage.studio.v1.schedule.ScheduleService/ListSchedules',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_schedule_schedule_common_pb.ListSchedulesRequest,
    responseType: studio_v1_schedule_schedule_common_pb.ListSchedulesResponse,
    requestSerialize: serialize_signage_studio_v1_schedule_ListSchedulesRequest,
    requestDeserialize: deserialize_signage_studio_v1_schedule_ListSchedulesRequest,
    responseSerialize: serialize_signage_studio_v1_schedule_ListSchedulesResponse,
    responseDeserialize: deserialize_signage_studio_v1_schedule_ListSchedulesResponse,
  },
  updateSchedule: {
    path: '/signage.studio.v1.schedule.ScheduleService/UpdateSchedule',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_schedule_schedule_common_pb.UpdateScheduleRequest,
    responseType: studio_v1_schedule_schedule_common_pb.Schedule,
    requestSerialize: serialize_signage_studio_v1_schedule_UpdateScheduleRequest,
    requestDeserialize: deserialize_signage_studio_v1_schedule_UpdateScheduleRequest,
    responseSerialize: serialize_signage_studio_v1_schedule_Schedule,
    responseDeserialize: deserialize_signage_studio_v1_schedule_Schedule,
  },
  deleteSchedule: {
    path: '/signage.studio.v1.schedule.ScheduleService/DeleteSchedule',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_schedule_schedule_common_pb.DeleteScheduleRequest,
    responseType: studio_v1_schedule_schedule_common_pb.DeleteScheduleResponse,
    requestSerialize: serialize_signage_studio_v1_schedule_DeleteScheduleRequest,
    requestDeserialize: deserialize_signage_studio_v1_schedule_DeleteScheduleRequest,
    responseSerialize: serialize_signage_studio_v1_schedule_DeleteScheduleResponse,
    responseDeserialize: deserialize_signage_studio_v1_schedule_DeleteScheduleResponse,
  },
  addScheduleEvent: {
    path: '/signage.studio.v1.schedule.ScheduleService/AddScheduleEvent',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_schedule_schedule_common_pb.AddScheduleEventRequest,
    responseType: studio_v1_schedule_schedule_common_pb.ScheduleEvent,
    requestSerialize: serialize_signage_studio_v1_schedule_AddScheduleEventRequest,
    requestDeserialize: deserialize_signage_studio_v1_schedule_AddScheduleEventRequest,
    responseSerialize: serialize_signage_studio_v1_schedule_ScheduleEvent,
    responseDeserialize: deserialize_signage_studio_v1_schedule_ScheduleEvent,
  },
  removeScheduleEvent: {
    path: '/signage.studio.v1.schedule.ScheduleService/RemoveScheduleEvent',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_schedule_schedule_common_pb.RemoveScheduleEventRequest,
    responseType: studio_v1_schedule_schedule_common_pb.RemoveScheduleEventResponse,
    requestSerialize: serialize_signage_studio_v1_schedule_RemoveScheduleEventRequest,
    requestDeserialize: deserialize_signage_studio_v1_schedule_RemoveScheduleEventRequest,
    responseSerialize: serialize_signage_studio_v1_schedule_RemoveScheduleEventResponse,
    responseDeserialize: deserialize_signage_studio_v1_schedule_RemoveScheduleEventResponse,
  },
};

exports.ScheduleServiceClient = grpc.makeGenericClientConstructor(ScheduleServiceService, 'ScheduleService');
