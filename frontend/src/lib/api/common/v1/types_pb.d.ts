// package: signage.common.v1
// file: common/v1/types.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class PaginationRequest extends jspb.Message { 
    getPage(): number;
    setPage(value: number): PaginationRequest;
    getLimit(): number;
    setLimit(value: number): PaginationRequest;
    getSortBy(): string;
    setSortBy(value: string): PaginationRequest;
    getIsDesc(): boolean;
    setIsDesc(value: boolean): PaginationRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PaginationRequest.AsObject;
    static toObject(includeInstance: boolean, msg: PaginationRequest): PaginationRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PaginationRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PaginationRequest;
    static deserializeBinaryFromReader(message: PaginationRequest, reader: jspb.BinaryReader): PaginationRequest;
}

export namespace PaginationRequest {
    export type AsObject = {
        page: number,
        limit: number,
        sortBy: string,
        isDesc: boolean,
    }
}

export class PaginationResponse extends jspb.Message { 
    getCurrentPage(): number;
    setCurrentPage(value: number): PaginationResponse;
    getTotalPages(): number;
    setTotalPages(value: number): PaginationResponse;
    getTotalItems(): number;
    setTotalItems(value: number): PaginationResponse;
    getLimit(): number;
    setLimit(value: number): PaginationResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PaginationResponse.AsObject;
    static toObject(includeInstance: boolean, msg: PaginationResponse): PaginationResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PaginationResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PaginationResponse;
    static deserializeBinaryFromReader(message: PaginationResponse, reader: jspb.BinaryReader): PaginationResponse;
}

export namespace PaginationResponse {
    export type AsObject = {
        currentPage: number,
        totalPages: number,
        totalItems: number,
        limit: number,
    }
}

export class Empty extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Empty.AsObject;
    static toObject(includeInstance: boolean, msg: Empty): Empty.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Empty, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Empty;
    static deserializeBinaryFromReader(message: Empty, reader: jspb.BinaryReader): Empty;
}

export namespace Empty {
    export type AsObject = {
    }
}

export class GenericResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): GenericResponse;
    getMessage(): string;
    setMessage(value: string): GenericResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GenericResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GenericResponse): GenericResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GenericResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GenericResponse;
    static deserializeBinaryFromReader(message: GenericResponse, reader: jspb.BinaryReader): GenericResponse;
}

export namespace GenericResponse {
    export type AsObject = {
        success: boolean,
        message: string,
    }
}

export enum Status {
    STATUS_UNSPECIFIED = 0,
    STATUS_ACTIVE = 1,
    STATUS_INACTIVE = 2,
    STATUS_PENDING = 3,
    STATUS_ARCHIVED = 4,
}
