// package: signage.studio.v1.schedule
// file: studio/v1/schedule/schedule.common.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as common_v1_types_pb from "../../../common/v1/types_pb";

export class ScheduleEvent extends jspb.Message { 
    getId(): string;
    setId(value: string): ScheduleEvent;
    getScheduleId(): string;
    setScheduleId(value: string): ScheduleEvent;
    getLayoutId(): string;
    setLayoutId(value: string): ScheduleEvent;
    getLayoutName(): string;
    setLayoutName(value: string): ScheduleEvent;
    getStartTime(): string;
    setStartTime(value: string): ScheduleEvent;
    getEndTime(): string;
    setEndTime(value: string): ScheduleEvent;
    getDaysOfWeek(): string;
    setDaysOfWeek(value: string): ScheduleEvent;
    getCreatedAt(): string;
    setCreatedAt(value: string): ScheduleEvent;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ScheduleEvent.AsObject;
    static toObject(includeInstance: boolean, msg: ScheduleEvent): ScheduleEvent.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ScheduleEvent, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ScheduleEvent;
    static deserializeBinaryFromReader(message: ScheduleEvent, reader: jspb.BinaryReader): ScheduleEvent;
}

export namespace ScheduleEvent {
    export type AsObject = {
        id: string,
        scheduleId: string,
        layoutId: string,
        layoutName: string,
        startTime: string,
        endTime: string,
        daysOfWeek: string,
        createdAt: string,
    }
}

export class Schedule extends jspb.Message { 
    getId(): string;
    setId(value: string): Schedule;
    getName(): string;
    setName(value: string): Schedule;
    getDescription(): string;
    setDescription(value: string): Schedule;
    getCreatedAt(): string;
    setCreatedAt(value: string): Schedule;
    getUpdatedAt(): string;
    setUpdatedAt(value: string): Schedule;
    clearEventsList(): void;
    getEventsList(): Array<ScheduleEvent>;
    setEventsList(value: Array<ScheduleEvent>): Schedule;
    addEvents(value?: ScheduleEvent, index?: number): ScheduleEvent;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Schedule.AsObject;
    static toObject(includeInstance: boolean, msg: Schedule): Schedule.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Schedule, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Schedule;
    static deserializeBinaryFromReader(message: Schedule, reader: jspb.BinaryReader): Schedule;
}

export namespace Schedule {
    export type AsObject = {
        id: string,
        name: string,
        description: string,
        createdAt: string,
        updatedAt: string,
        eventsList: Array<ScheduleEvent.AsObject>,
    }
}

export class CreateScheduleRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateScheduleRequest;
    getDescription(): string;
    setDescription(value: string): CreateScheduleRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateScheduleRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateScheduleRequest): CreateScheduleRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateScheduleRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateScheduleRequest;
    static deserializeBinaryFromReader(message: CreateScheduleRequest, reader: jspb.BinaryReader): CreateScheduleRequest;
}

export namespace CreateScheduleRequest {
    export type AsObject = {
        name: string,
        description: string,
    }
}

export class UpdateScheduleRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): UpdateScheduleRequest;
    getName(): string;
    setName(value: string): UpdateScheduleRequest;
    getDescription(): string;
    setDescription(value: string): UpdateScheduleRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateScheduleRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateScheduleRequest): UpdateScheduleRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateScheduleRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateScheduleRequest;
    static deserializeBinaryFromReader(message: UpdateScheduleRequest, reader: jspb.BinaryReader): UpdateScheduleRequest;
}

export namespace UpdateScheduleRequest {
    export type AsObject = {
        id: string,
        name: string,
        description: string,
    }
}

export class GetScheduleRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): GetScheduleRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetScheduleRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetScheduleRequest): GetScheduleRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetScheduleRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetScheduleRequest;
    static deserializeBinaryFromReader(message: GetScheduleRequest, reader: jspb.BinaryReader): GetScheduleRequest;
}

export namespace GetScheduleRequest {
    export type AsObject = {
        id: string,
    }
}

export class ListSchedulesRequest extends jspb.Message { 

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationRequest | undefined;
    setPagination(value?: common_v1_types_pb.PaginationRequest): ListSchedulesRequest;
    getSearch(): string;
    setSearch(value: string): ListSchedulesRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListSchedulesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ListSchedulesRequest): ListSchedulesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListSchedulesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListSchedulesRequest;
    static deserializeBinaryFromReader(message: ListSchedulesRequest, reader: jspb.BinaryReader): ListSchedulesRequest;
}

export namespace ListSchedulesRequest {
    export type AsObject = {
        pagination?: common_v1_types_pb.PaginationRequest.AsObject,
        search: string,
    }
}

export class ListSchedulesResponse extends jspb.Message { 
    clearItemsList(): void;
    getItemsList(): Array<Schedule>;
    setItemsList(value: Array<Schedule>): ListSchedulesResponse;
    addItems(value?: Schedule, index?: number): Schedule;

    hasPagination(): boolean;
    clearPagination(): void;
    getPagination(): common_v1_types_pb.PaginationResponse | undefined;
    setPagination(value?: common_v1_types_pb.PaginationResponse): ListSchedulesResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListSchedulesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListSchedulesResponse): ListSchedulesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListSchedulesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListSchedulesResponse;
    static deserializeBinaryFromReader(message: ListSchedulesResponse, reader: jspb.BinaryReader): ListSchedulesResponse;
}

export namespace ListSchedulesResponse {
    export type AsObject = {
        itemsList: Array<Schedule.AsObject>,
        pagination?: common_v1_types_pb.PaginationResponse.AsObject,
    }
}

export class DeleteScheduleRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): DeleteScheduleRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteScheduleRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteScheduleRequest): DeleteScheduleRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteScheduleRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteScheduleRequest;
    static deserializeBinaryFromReader(message: DeleteScheduleRequest, reader: jspb.BinaryReader): DeleteScheduleRequest;
}

export namespace DeleteScheduleRequest {
    export type AsObject = {
        id: string,
    }
}

export class DeleteScheduleResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): DeleteScheduleResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteScheduleResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteScheduleResponse): DeleteScheduleResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteScheduleResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteScheduleResponse;
    static deserializeBinaryFromReader(message: DeleteScheduleResponse, reader: jspb.BinaryReader): DeleteScheduleResponse;
}

export namespace DeleteScheduleResponse {
    export type AsObject = {
        success: boolean,
    }
}

export class AddScheduleEventRequest extends jspb.Message { 
    getScheduleId(): string;
    setScheduleId(value: string): AddScheduleEventRequest;
    getLayoutId(): string;
    setLayoutId(value: string): AddScheduleEventRequest;
    getStartTime(): string;
    setStartTime(value: string): AddScheduleEventRequest;
    getEndTime(): string;
    setEndTime(value: string): AddScheduleEventRequest;
    getDaysOfWeek(): string;
    setDaysOfWeek(value: string): AddScheduleEventRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddScheduleEventRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AddScheduleEventRequest): AddScheduleEventRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddScheduleEventRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddScheduleEventRequest;
    static deserializeBinaryFromReader(message: AddScheduleEventRequest, reader: jspb.BinaryReader): AddScheduleEventRequest;
}

export namespace AddScheduleEventRequest {
    export type AsObject = {
        scheduleId: string,
        layoutId: string,
        startTime: string,
        endTime: string,
        daysOfWeek: string,
    }
}

export class RemoveScheduleEventRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): RemoveScheduleEventRequest;
    getScheduleId(): string;
    setScheduleId(value: string): RemoveScheduleEventRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RemoveScheduleEventRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RemoveScheduleEventRequest): RemoveScheduleEventRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RemoveScheduleEventRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RemoveScheduleEventRequest;
    static deserializeBinaryFromReader(message: RemoveScheduleEventRequest, reader: jspb.BinaryReader): RemoveScheduleEventRequest;
}

export namespace RemoveScheduleEventRequest {
    export type AsObject = {
        id: string,
        scheduleId: string,
    }
}

export class RemoveScheduleEventResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): RemoveScheduleEventResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RemoveScheduleEventResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RemoveScheduleEventResponse): RemoveScheduleEventResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RemoveScheduleEventResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RemoveScheduleEventResponse;
    static deserializeBinaryFromReader(message: RemoveScheduleEventResponse, reader: jspb.BinaryReader): RemoveScheduleEventResponse;
}

export namespace RemoveScheduleEventResponse {
    export type AsObject = {
        success: boolean,
    }
}
