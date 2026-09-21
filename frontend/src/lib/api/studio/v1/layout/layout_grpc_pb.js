// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var studio_v1_layout_layout_common_pb = require('../../../studio/v1/layout/layout.common_pb.js');

function serialize_signage_studio_v1_layout_AddMediaBlockRequest(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.AddMediaBlockRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.AddMediaBlockRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_AddMediaBlockRequest(buffer_arg) {
  return studio_v1_layout_layout_common_pb.AddMediaBlockRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_AddPlaylistBlockRequest(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.AddPlaylistBlockRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.AddPlaylistBlockRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_AddPlaylistBlockRequest(buffer_arg) {
  return studio_v1_layout_layout_common_pb.AddPlaylistBlockRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_CreateLayoutRequest(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.CreateLayoutRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.CreateLayoutRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_CreateLayoutRequest(buffer_arg) {
  return studio_v1_layout_layout_common_pb.CreateLayoutRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_CreateZoneRequest(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.CreateZoneRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.CreateZoneRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_CreateZoneRequest(buffer_arg) {
  return studio_v1_layout_layout_common_pb.CreateZoneRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_DeleteLayoutRequest(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.DeleteLayoutRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.DeleteLayoutRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_DeleteLayoutRequest(buffer_arg) {
  return studio_v1_layout_layout_common_pb.DeleteLayoutRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_DeleteLayoutResponse(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.DeleteLayoutResponse)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.DeleteLayoutResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_DeleteLayoutResponse(buffer_arg) {
  return studio_v1_layout_layout_common_pb.DeleteLayoutResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_DeleteZoneRequest(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.DeleteZoneRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.DeleteZoneRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_DeleteZoneRequest(buffer_arg) {
  return studio_v1_layout_layout_common_pb.DeleteZoneRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_DeleteZoneResponse(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.DeleteZoneResponse)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.DeleteZoneResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_DeleteZoneResponse(buffer_arg) {
  return studio_v1_layout_layout_common_pb.DeleteZoneResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_GetLayoutRequest(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.GetLayoutRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.GetLayoutRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_GetLayoutRequest(buffer_arg) {
  return studio_v1_layout_layout_common_pb.GetLayoutRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_GetZoneRequest(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.GetZoneRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.GetZoneRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_GetZoneRequest(buffer_arg) {
  return studio_v1_layout_layout_common_pb.GetZoneRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_Layout(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.Layout)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.Layout');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_Layout(buffer_arg) {
  return studio_v1_layout_layout_common_pb.Layout.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_ListLayoutsRequest(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.ListLayoutsRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.ListLayoutsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_ListLayoutsRequest(buffer_arg) {
  return studio_v1_layout_layout_common_pb.ListLayoutsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_ListLayoutsResponse(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.ListLayoutsResponse)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.ListLayoutsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_ListLayoutsResponse(buffer_arg) {
  return studio_v1_layout_layout_common_pb.ListLayoutsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_PlaylistBlockResponse(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.PlaylistBlockResponse)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.PlaylistBlockResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_PlaylistBlockResponse(buffer_arg) {
  return studio_v1_layout_layout_common_pb.PlaylistBlockResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_RemovePlaylistBlockRequest(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.RemovePlaylistBlockRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.RemovePlaylistBlockRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_RemovePlaylistBlockRequest(buffer_arg) {
  return studio_v1_layout_layout_common_pb.RemovePlaylistBlockRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_SetPlaylistItemOverrideRequest(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.SetPlaylistItemOverrideRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_SetPlaylistItemOverrideRequest(buffer_arg) {
  return studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_SetPlaylistItemOverrideResponse(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideResponse)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.SetPlaylistItemOverrideResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_SetPlaylistItemOverrideResponse(buffer_arg) {
  return studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_UpdateLayoutRequest(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.UpdateLayoutRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.UpdateLayoutRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_UpdateLayoutRequest(buffer_arg) {
  return studio_v1_layout_layout_common_pb.UpdateLayoutRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_UpdatePlaylistBlockRequest(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.UpdatePlaylistBlockRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.UpdatePlaylistBlockRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_UpdatePlaylistBlockRequest(buffer_arg) {
  return studio_v1_layout_layout_common_pb.UpdatePlaylistBlockRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_UpdateZoneRequest(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.UpdateZoneRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.UpdateZoneRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_UpdateZoneRequest(buffer_arg) {
  return studio_v1_layout_layout_common_pb.UpdateZoneRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_layout_Zone(arg) {
  if (!(arg instanceof studio_v1_layout_layout_common_pb.Zone)) {
    throw new Error('Expected argument of type signage.studio.v1.layout.Zone');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_layout_Zone(buffer_arg) {
  return studio_v1_layout_layout_common_pb.Zone.deserializeBinary(new Uint8Array(buffer_arg));
}


var LayoutServiceService = exports.LayoutServiceService = {
  // Layout CRUD
createLayout: {
    path: '/signage.studio.v1.layout.LayoutService/CreateLayout',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_layout_layout_common_pb.CreateLayoutRequest,
    responseType: studio_v1_layout_layout_common_pb.Layout,
    requestSerialize: serialize_signage_studio_v1_layout_CreateLayoutRequest,
    requestDeserialize: deserialize_signage_studio_v1_layout_CreateLayoutRequest,
    responseSerialize: serialize_signage_studio_v1_layout_Layout,
    responseDeserialize: deserialize_signage_studio_v1_layout_Layout,
  },
  getLayout: {
    path: '/signage.studio.v1.layout.LayoutService/GetLayout',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_layout_layout_common_pb.GetLayoutRequest,
    responseType: studio_v1_layout_layout_common_pb.Layout,
    requestSerialize: serialize_signage_studio_v1_layout_GetLayoutRequest,
    requestDeserialize: deserialize_signage_studio_v1_layout_GetLayoutRequest,
    responseSerialize: serialize_signage_studio_v1_layout_Layout,
    responseDeserialize: deserialize_signage_studio_v1_layout_Layout,
  },
  listLayouts: {
    path: '/signage.studio.v1.layout.LayoutService/ListLayouts',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_layout_layout_common_pb.ListLayoutsRequest,
    responseType: studio_v1_layout_layout_common_pb.ListLayoutsResponse,
    requestSerialize: serialize_signage_studio_v1_layout_ListLayoutsRequest,
    requestDeserialize: deserialize_signage_studio_v1_layout_ListLayoutsRequest,
    responseSerialize: serialize_signage_studio_v1_layout_ListLayoutsResponse,
    responseDeserialize: deserialize_signage_studio_v1_layout_ListLayoutsResponse,
  },
  updateLayout: {
    path: '/signage.studio.v1.layout.LayoutService/UpdateLayout',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_layout_layout_common_pb.UpdateLayoutRequest,
    responseType: studio_v1_layout_layout_common_pb.Layout,
    requestSerialize: serialize_signage_studio_v1_layout_UpdateLayoutRequest,
    requestDeserialize: deserialize_signage_studio_v1_layout_UpdateLayoutRequest,
    responseSerialize: serialize_signage_studio_v1_layout_Layout,
    responseDeserialize: deserialize_signage_studio_v1_layout_Layout,
  },
  deleteLayout: {
    path: '/signage.studio.v1.layout.LayoutService/DeleteLayout',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_layout_layout_common_pb.DeleteLayoutRequest,
    responseType: studio_v1_layout_layout_common_pb.DeleteLayoutResponse,
    requestSerialize: serialize_signage_studio_v1_layout_DeleteLayoutRequest,
    requestDeserialize: deserialize_signage_studio_v1_layout_DeleteLayoutRequest,
    responseSerialize: serialize_signage_studio_v1_layout_DeleteLayoutResponse,
    responseDeserialize: deserialize_signage_studio_v1_layout_DeleteLayoutResponse,
  },
  // Zone CRUD
createZone: {
    path: '/signage.studio.v1.layout.LayoutService/CreateZone',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_layout_layout_common_pb.CreateZoneRequest,
    responseType: studio_v1_layout_layout_common_pb.Zone,
    requestSerialize: serialize_signage_studio_v1_layout_CreateZoneRequest,
    requestDeserialize: deserialize_signage_studio_v1_layout_CreateZoneRequest,
    responseSerialize: serialize_signage_studio_v1_layout_Zone,
    responseDeserialize: deserialize_signage_studio_v1_layout_Zone,
  },
  getZone: {
    path: '/signage.studio.v1.layout.LayoutService/GetZone',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_layout_layout_common_pb.GetZoneRequest,
    responseType: studio_v1_layout_layout_common_pb.Zone,
    requestSerialize: serialize_signage_studio_v1_layout_GetZoneRequest,
    requestDeserialize: deserialize_signage_studio_v1_layout_GetZoneRequest,
    responseSerialize: serialize_signage_studio_v1_layout_Zone,
    responseDeserialize: deserialize_signage_studio_v1_layout_Zone,
  },
  updateZone: {
    path: '/signage.studio.v1.layout.LayoutService/UpdateZone',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_layout_layout_common_pb.UpdateZoneRequest,
    responseType: studio_v1_layout_layout_common_pb.Zone,
    requestSerialize: serialize_signage_studio_v1_layout_UpdateZoneRequest,
    requestDeserialize: deserialize_signage_studio_v1_layout_UpdateZoneRequest,
    responseSerialize: serialize_signage_studio_v1_layout_Zone,
    responseDeserialize: deserialize_signage_studio_v1_layout_Zone,
  },
  deleteZone: {
    path: '/signage.studio.v1.layout.LayoutService/DeleteZone',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_layout_layout_common_pb.DeleteZoneRequest,
    responseType: studio_v1_layout_layout_common_pb.DeleteZoneResponse,
    requestSerialize: serialize_signage_studio_v1_layout_DeleteZoneRequest,
    requestDeserialize: deserialize_signage_studio_v1_layout_DeleteZoneRequest,
    responseSerialize: serialize_signage_studio_v1_layout_DeleteZoneResponse,
    responseDeserialize: deserialize_signage_studio_v1_layout_DeleteZoneResponse,
  },
  addPlaylistBlock: {
    path: '/signage.studio.v1.layout.LayoutService/AddPlaylistBlock',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_layout_layout_common_pb.AddPlaylistBlockRequest,
    responseType: studio_v1_layout_layout_common_pb.PlaylistBlockResponse,
    requestSerialize: serialize_signage_studio_v1_layout_AddPlaylistBlockRequest,
    requestDeserialize: deserialize_signage_studio_v1_layout_AddPlaylistBlockRequest,
    responseSerialize: serialize_signage_studio_v1_layout_PlaylistBlockResponse,
    responseDeserialize: deserialize_signage_studio_v1_layout_PlaylistBlockResponse,
  },
  addMediaBlock: {
    path: '/signage.studio.v1.layout.LayoutService/AddMediaBlock',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_layout_layout_common_pb.AddMediaBlockRequest,
    responseType: studio_v1_layout_layout_common_pb.PlaylistBlockResponse,
    requestSerialize: serialize_signage_studio_v1_layout_AddMediaBlockRequest,
    requestDeserialize: deserialize_signage_studio_v1_layout_AddMediaBlockRequest,
    responseSerialize: serialize_signage_studio_v1_layout_PlaylistBlockResponse,
    responseDeserialize: deserialize_signage_studio_v1_layout_PlaylistBlockResponse,
  },
  updatePlaylistBlock: {
    path: '/signage.studio.v1.layout.LayoutService/UpdatePlaylistBlock',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_layout_layout_common_pb.UpdatePlaylistBlockRequest,
    responseType: studio_v1_layout_layout_common_pb.PlaylistBlockResponse,
    requestSerialize: serialize_signage_studio_v1_layout_UpdatePlaylistBlockRequest,
    requestDeserialize: deserialize_signage_studio_v1_layout_UpdatePlaylistBlockRequest,
    responseSerialize: serialize_signage_studio_v1_layout_PlaylistBlockResponse,
    responseDeserialize: deserialize_signage_studio_v1_layout_PlaylistBlockResponse,
  },
  removePlaylistBlock: {
    path: '/signage.studio.v1.layout.LayoutService/RemovePlaylistBlock',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_layout_layout_common_pb.RemovePlaylistBlockRequest,
    responseType: studio_v1_layout_layout_common_pb.PlaylistBlockResponse,
    requestSerialize: serialize_signage_studio_v1_layout_RemovePlaylistBlockRequest,
    requestDeserialize: deserialize_signage_studio_v1_layout_RemovePlaylistBlockRequest,
    responseSerialize: serialize_signage_studio_v1_layout_PlaylistBlockResponse,
    responseDeserialize: deserialize_signage_studio_v1_layout_PlaylistBlockResponse,
  },
  setPlaylistItemOverride: {
    path: '/signage.studio.v1.layout.LayoutService/SetPlaylistItemOverride',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideRequest,
    responseType: studio_v1_layout_layout_common_pb.SetPlaylistItemOverrideResponse,
    requestSerialize: serialize_signage_studio_v1_layout_SetPlaylistItemOverrideRequest,
    requestDeserialize: deserialize_signage_studio_v1_layout_SetPlaylistItemOverrideRequest,
    responseSerialize: serialize_signage_studio_v1_layout_SetPlaylistItemOverrideResponse,
    responseDeserialize: deserialize_signage_studio_v1_layout_SetPlaylistItemOverrideResponse,
  },
};

exports.LayoutServiceClient = grpc.makeGenericClientConstructor(LayoutServiceService, 'LayoutService');
