// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var studio_v1_media_media_common_pb = require('../../../studio/v1/media/media.common_pb.js');

function serialize_signage_studio_v1_media_CreateMediaRequest(arg) {
  if (!(arg instanceof studio_v1_media_media_common_pb.CreateMediaRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.media.CreateMediaRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_media_CreateMediaRequest(buffer_arg) {
  return studio_v1_media_media_common_pb.CreateMediaRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_media_DeleteMediaRequest(arg) {
  if (!(arg instanceof studio_v1_media_media_common_pb.DeleteMediaRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.media.DeleteMediaRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_media_DeleteMediaRequest(buffer_arg) {
  return studio_v1_media_media_common_pb.DeleteMediaRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_media_DeleteMediaResponse(arg) {
  if (!(arg instanceof studio_v1_media_media_common_pb.DeleteMediaResponse)) {
    throw new Error('Expected argument of type signage.studio.v1.media.DeleteMediaResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_media_DeleteMediaResponse(buffer_arg) {
  return studio_v1_media_media_common_pb.DeleteMediaResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_media_GetMediaFileRequest(arg) {
  if (!(arg instanceof studio_v1_media_media_common_pb.GetMediaFileRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.media.GetMediaFileRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_media_GetMediaFileRequest(buffer_arg) {
  return studio_v1_media_media_common_pb.GetMediaFileRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_media_GetMediaFileResponse(arg) {
  if (!(arg instanceof studio_v1_media_media_common_pb.GetMediaFileResponse)) {
    throw new Error('Expected argument of type signage.studio.v1.media.GetMediaFileResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_media_GetMediaFileResponse(buffer_arg) {
  return studio_v1_media_media_common_pb.GetMediaFileResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_media_GetMediaRequest(arg) {
  if (!(arg instanceof studio_v1_media_media_common_pb.GetMediaRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.media.GetMediaRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_media_GetMediaRequest(buffer_arg) {
  return studio_v1_media_media_common_pb.GetMediaRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_media_ListMediaRequest(arg) {
  if (!(arg instanceof studio_v1_media_media_common_pb.ListMediaRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.media.ListMediaRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_media_ListMediaRequest(buffer_arg) {
  return studio_v1_media_media_common_pb.ListMediaRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_media_ListMediaResponse(arg) {
  if (!(arg instanceof studio_v1_media_media_common_pb.ListMediaResponse)) {
    throw new Error('Expected argument of type signage.studio.v1.media.ListMediaResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_media_ListMediaResponse(buffer_arg) {
  return studio_v1_media_media_common_pb.ListMediaResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_media_MediaItem(arg) {
  if (!(arg instanceof studio_v1_media_media_common_pb.MediaItem)) {
    throw new Error('Expected argument of type signage.studio.v1.media.MediaItem');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_media_MediaItem(buffer_arg) {
  return studio_v1_media_media_common_pb.MediaItem.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_media_StreamMediaFileRequest(arg) {
  if (!(arg instanceof studio_v1_media_media_common_pb.StreamMediaFileRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.media.StreamMediaFileRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_media_StreamMediaFileRequest(buffer_arg) {
  return studio_v1_media_media_common_pb.StreamMediaFileRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_media_StreamMediaFileResponse(arg) {
  if (!(arg instanceof studio_v1_media_media_common_pb.StreamMediaFileResponse)) {
    throw new Error('Expected argument of type signage.studio.v1.media.StreamMediaFileResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_media_StreamMediaFileResponse(buffer_arg) {
  return studio_v1_media_media_common_pb.StreamMediaFileResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_media_UpdateMediaRequest(arg) {
  if (!(arg instanceof studio_v1_media_media_common_pb.UpdateMediaRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.media.UpdateMediaRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_media_UpdateMediaRequest(buffer_arg) {
  return studio_v1_media_media_common_pb.UpdateMediaRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_media_UploadMediaChunkRequest(arg) {
  if (!(arg instanceof studio_v1_media_media_common_pb.UploadMediaChunkRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.media.UploadMediaChunkRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_media_UploadMediaChunkRequest(buffer_arg) {
  return studio_v1_media_media_common_pb.UploadMediaChunkRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_media_UploadMediaChunkResponse(arg) {
  if (!(arg instanceof studio_v1_media_media_common_pb.UploadMediaChunkResponse)) {
    throw new Error('Expected argument of type signage.studio.v1.media.UploadMediaChunkResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_media_UploadMediaChunkResponse(buffer_arg) {
  return studio_v1_media_media_common_pb.UploadMediaChunkResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var MediaServiceService = exports.MediaServiceService = {
  createMedia: {
    path: '/signage.studio.v1.media.MediaService/CreateMedia',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_media_media_common_pb.CreateMediaRequest,
    responseType: studio_v1_media_media_common_pb.MediaItem,
    requestSerialize: serialize_signage_studio_v1_media_CreateMediaRequest,
    requestDeserialize: deserialize_signage_studio_v1_media_CreateMediaRequest,
    responseSerialize: serialize_signage_studio_v1_media_MediaItem,
    responseDeserialize: deserialize_signage_studio_v1_media_MediaItem,
  },
  getMedia: {
    path: '/signage.studio.v1.media.MediaService/GetMedia',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_media_media_common_pb.GetMediaRequest,
    responseType: studio_v1_media_media_common_pb.MediaItem,
    requestSerialize: serialize_signage_studio_v1_media_GetMediaRequest,
    requestDeserialize: deserialize_signage_studio_v1_media_GetMediaRequest,
    responseSerialize: serialize_signage_studio_v1_media_MediaItem,
    responseDeserialize: deserialize_signage_studio_v1_media_MediaItem,
  },
  listMedia: {
    path: '/signage.studio.v1.media.MediaService/ListMedia',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_media_media_common_pb.ListMediaRequest,
    responseType: studio_v1_media_media_common_pb.ListMediaResponse,
    requestSerialize: serialize_signage_studio_v1_media_ListMediaRequest,
    requestDeserialize: deserialize_signage_studio_v1_media_ListMediaRequest,
    responseSerialize: serialize_signage_studio_v1_media_ListMediaResponse,
    responseDeserialize: deserialize_signage_studio_v1_media_ListMediaResponse,
  },
  updateMedia: {
    path: '/signage.studio.v1.media.MediaService/UpdateMedia',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_media_media_common_pb.UpdateMediaRequest,
    responseType: studio_v1_media_media_common_pb.MediaItem,
    requestSerialize: serialize_signage_studio_v1_media_UpdateMediaRequest,
    requestDeserialize: deserialize_signage_studio_v1_media_UpdateMediaRequest,
    responseSerialize: serialize_signage_studio_v1_media_MediaItem,
    responseDeserialize: deserialize_signage_studio_v1_media_MediaItem,
  },
  deleteMedia: {
    path: '/signage.studio.v1.media.MediaService/DeleteMedia',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_media_media_common_pb.DeleteMediaRequest,
    responseType: studio_v1_media_media_common_pb.DeleteMediaResponse,
    requestSerialize: serialize_signage_studio_v1_media_DeleteMediaRequest,
    requestDeserialize: deserialize_signage_studio_v1_media_DeleteMediaRequest,
    responseSerialize: serialize_signage_studio_v1_media_DeleteMediaResponse,
    responseDeserialize: deserialize_signage_studio_v1_media_DeleteMediaResponse,
  },
  uploadMediaChunk: {
    path: '/signage.studio.v1.media.MediaService/UploadMediaChunk',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_media_media_common_pb.UploadMediaChunkRequest,
    responseType: studio_v1_media_media_common_pb.UploadMediaChunkResponse,
    requestSerialize: serialize_signage_studio_v1_media_UploadMediaChunkRequest,
    requestDeserialize: deserialize_signage_studio_v1_media_UploadMediaChunkRequest,
    responseSerialize: serialize_signage_studio_v1_media_UploadMediaChunkResponse,
    responseDeserialize: deserialize_signage_studio_v1_media_UploadMediaChunkResponse,
  },
  getMediaFile: {
    path: '/signage.studio.v1.media.MediaService/GetMediaFile',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_media_media_common_pb.GetMediaFileRequest,
    responseType: studio_v1_media_media_common_pb.GetMediaFileResponse,
    requestSerialize: serialize_signage_studio_v1_media_GetMediaFileRequest,
    requestDeserialize: deserialize_signage_studio_v1_media_GetMediaFileRequest,
    responseSerialize: serialize_signage_studio_v1_media_GetMediaFileResponse,
    responseDeserialize: deserialize_signage_studio_v1_media_GetMediaFileResponse,
  },
  streamMediaFile: {
    path: '/signage.studio.v1.media.MediaService/StreamMediaFile',
    requestStream: false,
    responseStream: true,
    requestType: studio_v1_media_media_common_pb.StreamMediaFileRequest,
    responseType: studio_v1_media_media_common_pb.StreamMediaFileResponse,
    requestSerialize: serialize_signage_studio_v1_media_StreamMediaFileRequest,
    requestDeserialize: deserialize_signage_studio_v1_media_StreamMediaFileRequest,
    responseSerialize: serialize_signage_studio_v1_media_StreamMediaFileResponse,
    responseDeserialize: deserialize_signage_studio_v1_media_StreamMediaFileResponse,
  },
};

exports.MediaServiceClient = grpc.makeGenericClientConstructor(MediaServiceService, 'MediaService');
