// package: signage.studio.v1.schedule
// file: studio/v1/schedule/schedule.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as studio_v1_schedule_schedule_pb from "../../../studio/v1/schedule/schedule_pb";
import * as studio_v1_schedule_schedule_common_pb from "../../../studio/v1/schedule/schedule.common_pb";

interface IScheduleServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createSchedule: IScheduleServiceService_ICreateSchedule;
    getSchedule: IScheduleServiceService_IGetSchedule;
    listSchedules: IScheduleServiceService_IListSchedules;
    updateSchedule: IScheduleServiceService_IUpdateSchedule;
    deleteSchedule: IScheduleServiceService_IDeleteSchedule;
    addScheduleEvent: IScheduleServiceService_IAddScheduleEvent;
    removeScheduleEvent: IScheduleServiceService_IRemoveScheduleEvent;
}

interface IScheduleServiceService_ICreateSchedule extends grpc.MethodDefinition<studio_v1_schedule_schedule_common_pb.CreateScheduleRequest, studio_v1_schedule_schedule_common_pb.Schedule> {
    path: "/signage.studio.v1.schedule.ScheduleService/CreateSchedule";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_schedule_schedule_common_pb.CreateScheduleRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_schedule_schedule_common_pb.CreateScheduleRequest>;
    responseSerialize: grpc.serialize<studio_v1_schedule_schedule_common_pb.Schedule>;
    responseDeserialize: grpc.deserialize<studio_v1_schedule_schedule_common_pb.Schedule>;
}
interface IScheduleServiceService_IGetSchedule extends grpc.MethodDefinition<studio_v1_schedule_schedule_common_pb.GetScheduleRequest, studio_v1_schedule_schedule_common_pb.Schedule> {
    path: "/signage.studio.v1.schedule.ScheduleService/GetSchedule";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_schedule_schedule_common_pb.GetScheduleRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_schedule_schedule_common_pb.GetScheduleRequest>;
    responseSerialize: grpc.serialize<studio_v1_schedule_schedule_common_pb.Schedule>;
    responseDeserialize: grpc.deserialize<studio_v1_schedule_schedule_common_pb.Schedule>;
}
interface IScheduleServiceService_IListSchedules extends grpc.MethodDefinition<studio_v1_schedule_schedule_common_pb.ListSchedulesRequest, studio_v1_schedule_schedule_common_pb.ListSchedulesResponse> {
    path: "/signage.studio.v1.schedule.ScheduleService/ListSchedules";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_schedule_schedule_common_pb.ListSchedulesRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_schedule_schedule_common_pb.ListSchedulesRequest>;
    responseSerialize: grpc.serialize<studio_v1_schedule_schedule_common_pb.ListSchedulesResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_schedule_schedule_common_pb.ListSchedulesResponse>;
}
interface IScheduleServiceService_IUpdateSchedule extends grpc.MethodDefinition<studio_v1_schedule_schedule_common_pb.UpdateScheduleRequest, studio_v1_schedule_schedule_common_pb.Schedule> {
    path: "/signage.studio.v1.schedule.ScheduleService/UpdateSchedule";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_schedule_schedule_common_pb.UpdateScheduleRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_schedule_schedule_common_pb.UpdateScheduleRequest>;
    responseSerialize: grpc.serialize<studio_v1_schedule_schedule_common_pb.Schedule>;
    responseDeserialize: grpc.deserialize<studio_v1_schedule_schedule_common_pb.Schedule>;
}
interface IScheduleServiceService_IDeleteSchedule extends grpc.MethodDefinition<studio_v1_schedule_schedule_common_pb.DeleteScheduleRequest, studio_v1_schedule_schedule_common_pb.DeleteScheduleResponse> {
    path: "/signage.studio.v1.schedule.ScheduleService/DeleteSchedule";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_schedule_schedule_common_pb.DeleteScheduleRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_schedule_schedule_common_pb.DeleteScheduleRequest>;
    responseSerialize: grpc.serialize<studio_v1_schedule_schedule_common_pb.DeleteScheduleResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_schedule_schedule_common_pb.DeleteScheduleResponse>;
}
interface IScheduleServiceService_IAddScheduleEvent extends grpc.MethodDefinition<studio_v1_schedule_schedule_common_pb.AddScheduleEventRequest, studio_v1_schedule_schedule_common_pb.ScheduleEvent> {
    path: "/signage.studio.v1.schedule.ScheduleService/AddScheduleEvent";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_schedule_schedule_common_pb.AddScheduleEventRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_schedule_schedule_common_pb.AddScheduleEventRequest>;
    responseSerialize: grpc.serialize<studio_v1_schedule_schedule_common_pb.ScheduleEvent>;
    responseDeserialize: grpc.deserialize<studio_v1_schedule_schedule_common_pb.ScheduleEvent>;
}
interface IScheduleServiceService_IRemoveScheduleEvent extends grpc.MethodDefinition<studio_v1_schedule_schedule_common_pb.RemoveScheduleEventRequest, studio_v1_schedule_schedule_common_pb.RemoveScheduleEventResponse> {
    path: "/signage.studio.v1.schedule.ScheduleService/RemoveScheduleEvent";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<studio_v1_schedule_schedule_common_pb.RemoveScheduleEventRequest>;
    requestDeserialize: grpc.deserialize<studio_v1_schedule_schedule_common_pb.RemoveScheduleEventRequest>;
    responseSerialize: grpc.serialize<studio_v1_schedule_schedule_common_pb.RemoveScheduleEventResponse>;
    responseDeserialize: grpc.deserialize<studio_v1_schedule_schedule_common_pb.RemoveScheduleEventResponse>;
}

export const ScheduleServiceService: IScheduleServiceService;

export interface IScheduleServiceServer extends grpc.UntypedServiceImplementation {
    createSchedule: grpc.handleUnaryCall<studio_v1_schedule_schedule_common_pb.CreateScheduleRequest, studio_v1_schedule_schedule_common_pb.Schedule>;
    getSchedule: grpc.handleUnaryCall<studio_v1_schedule_schedule_common_pb.GetScheduleRequest, studio_v1_schedule_schedule_common_pb.Schedule>;
    listSchedules: grpc.handleUnaryCall<studio_v1_schedule_schedule_common_pb.ListSchedulesRequest, studio_v1_schedule_schedule_common_pb.ListSchedulesResponse>;
    updateSchedule: grpc.handleUnaryCall<studio_v1_schedule_schedule_common_pb.UpdateScheduleRequest, studio_v1_schedule_schedule_common_pb.Schedule>;
    deleteSchedule: grpc.handleUnaryCall<studio_v1_schedule_schedule_common_pb.DeleteScheduleRequest, studio_v1_schedule_schedule_common_pb.DeleteScheduleResponse>;
    addScheduleEvent: grpc.handleUnaryCall<studio_v1_schedule_schedule_common_pb.AddScheduleEventRequest, studio_v1_schedule_schedule_common_pb.ScheduleEvent>;
    removeScheduleEvent: grpc.handleUnaryCall<studio_v1_schedule_schedule_common_pb.RemoveScheduleEventRequest, studio_v1_schedule_schedule_common_pb.RemoveScheduleEventResponse>;
}

export interface IScheduleServiceClient {
    createSchedule(request: studio_v1_schedule_schedule_common_pb.CreateScheduleRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    createSchedule(request: studio_v1_schedule_schedule_common_pb.CreateScheduleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    createSchedule(request: studio_v1_schedule_schedule_common_pb.CreateScheduleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    getSchedule(request: studio_v1_schedule_schedule_common_pb.GetScheduleRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    getSchedule(request: studio_v1_schedule_schedule_common_pb.GetScheduleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    getSchedule(request: studio_v1_schedule_schedule_common_pb.GetScheduleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    listSchedules(request: studio_v1_schedule_schedule_common_pb.ListSchedulesRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.ListSchedulesResponse) => void): grpc.ClientUnaryCall;
    listSchedules(request: studio_v1_schedule_schedule_common_pb.ListSchedulesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.ListSchedulesResponse) => void): grpc.ClientUnaryCall;
    listSchedules(request: studio_v1_schedule_schedule_common_pb.ListSchedulesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.ListSchedulesResponse) => void): grpc.ClientUnaryCall;
    updateSchedule(request: studio_v1_schedule_schedule_common_pb.UpdateScheduleRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    updateSchedule(request: studio_v1_schedule_schedule_common_pb.UpdateScheduleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    updateSchedule(request: studio_v1_schedule_schedule_common_pb.UpdateScheduleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    deleteSchedule(request: studio_v1_schedule_schedule_common_pb.DeleteScheduleRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.DeleteScheduleResponse) => void): grpc.ClientUnaryCall;
    deleteSchedule(request: studio_v1_schedule_schedule_common_pb.DeleteScheduleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.DeleteScheduleResponse) => void): grpc.ClientUnaryCall;
    deleteSchedule(request: studio_v1_schedule_schedule_common_pb.DeleteScheduleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.DeleteScheduleResponse) => void): grpc.ClientUnaryCall;
    addScheduleEvent(request: studio_v1_schedule_schedule_common_pb.AddScheduleEventRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.ScheduleEvent) => void): grpc.ClientUnaryCall;
    addScheduleEvent(request: studio_v1_schedule_schedule_common_pb.AddScheduleEventRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.ScheduleEvent) => void): grpc.ClientUnaryCall;
    addScheduleEvent(request: studio_v1_schedule_schedule_common_pb.AddScheduleEventRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.ScheduleEvent) => void): grpc.ClientUnaryCall;
    removeScheduleEvent(request: studio_v1_schedule_schedule_common_pb.RemoveScheduleEventRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.RemoveScheduleEventResponse) => void): grpc.ClientUnaryCall;
    removeScheduleEvent(request: studio_v1_schedule_schedule_common_pb.RemoveScheduleEventRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.RemoveScheduleEventResponse) => void): grpc.ClientUnaryCall;
    removeScheduleEvent(request: studio_v1_schedule_schedule_common_pb.RemoveScheduleEventRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.RemoveScheduleEventResponse) => void): grpc.ClientUnaryCall;
}

export class ScheduleServiceClient extends grpc.Client implements IScheduleServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createSchedule(request: studio_v1_schedule_schedule_common_pb.CreateScheduleRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    public createSchedule(request: studio_v1_schedule_schedule_common_pb.CreateScheduleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    public createSchedule(request: studio_v1_schedule_schedule_common_pb.CreateScheduleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    public getSchedule(request: studio_v1_schedule_schedule_common_pb.GetScheduleRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    public getSchedule(request: studio_v1_schedule_schedule_common_pb.GetScheduleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    public getSchedule(request: studio_v1_schedule_schedule_common_pb.GetScheduleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    public listSchedules(request: studio_v1_schedule_schedule_common_pb.ListSchedulesRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.ListSchedulesResponse) => void): grpc.ClientUnaryCall;
    public listSchedules(request: studio_v1_schedule_schedule_common_pb.ListSchedulesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.ListSchedulesResponse) => void): grpc.ClientUnaryCall;
    public listSchedules(request: studio_v1_schedule_schedule_common_pb.ListSchedulesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.ListSchedulesResponse) => void): grpc.ClientUnaryCall;
    public updateSchedule(request: studio_v1_schedule_schedule_common_pb.UpdateScheduleRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    public updateSchedule(request: studio_v1_schedule_schedule_common_pb.UpdateScheduleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    public updateSchedule(request: studio_v1_schedule_schedule_common_pb.UpdateScheduleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.Schedule) => void): grpc.ClientUnaryCall;
    public deleteSchedule(request: studio_v1_schedule_schedule_common_pb.DeleteScheduleRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.DeleteScheduleResponse) => void): grpc.ClientUnaryCall;
    public deleteSchedule(request: studio_v1_schedule_schedule_common_pb.DeleteScheduleRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.DeleteScheduleResponse) => void): grpc.ClientUnaryCall;
    public deleteSchedule(request: studio_v1_schedule_schedule_common_pb.DeleteScheduleRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.DeleteScheduleResponse) => void): grpc.ClientUnaryCall;
    public addScheduleEvent(request: studio_v1_schedule_schedule_common_pb.AddScheduleEventRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.ScheduleEvent) => void): grpc.ClientUnaryCall;
    public addScheduleEvent(request: studio_v1_schedule_schedule_common_pb.AddScheduleEventRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.ScheduleEvent) => void): grpc.ClientUnaryCall;
    public addScheduleEvent(request: studio_v1_schedule_schedule_common_pb.AddScheduleEventRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.ScheduleEvent) => void): grpc.ClientUnaryCall;
    public removeScheduleEvent(request: studio_v1_schedule_schedule_common_pb.RemoveScheduleEventRequest, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.RemoveScheduleEventResponse) => void): grpc.ClientUnaryCall;
    public removeScheduleEvent(request: studio_v1_schedule_schedule_common_pb.RemoveScheduleEventRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.RemoveScheduleEventResponse) => void): grpc.ClientUnaryCall;
    public removeScheduleEvent(request: studio_v1_schedule_schedule_common_pb.RemoveScheduleEventRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: studio_v1_schedule_schedule_common_pb.RemoveScheduleEventResponse) => void): grpc.ClientUnaryCall;
}
