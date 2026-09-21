// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var studio_v1_playlist_playlist_common_pb = require('../../../studio/v1/playlist/playlist.common_pb.js');

function serialize_signage_studio_v1_playlist_AddPlaylistItemRequest(arg) {
  if (!(arg instanceof studio_v1_playlist_playlist_common_pb.AddPlaylistItemRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.playlist.AddPlaylistItemRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_playlist_AddPlaylistItemRequest(buffer_arg) {
  return studio_v1_playlist_playlist_common_pb.AddPlaylistItemRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_playlist_CreatePlaylistRequest(arg) {
  if (!(arg instanceof studio_v1_playlist_playlist_common_pb.CreatePlaylistRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.playlist.CreatePlaylistRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_playlist_CreatePlaylistRequest(buffer_arg) {
  return studio_v1_playlist_playlist_common_pb.CreatePlaylistRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_playlist_DeletePlaylistRequest(arg) {
  if (!(arg instanceof studio_v1_playlist_playlist_common_pb.DeletePlaylistRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.playlist.DeletePlaylistRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_playlist_DeletePlaylistRequest(buffer_arg) {
  return studio_v1_playlist_playlist_common_pb.DeletePlaylistRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_playlist_DeletePlaylistResponse(arg) {
  if (!(arg instanceof studio_v1_playlist_playlist_common_pb.DeletePlaylistResponse)) {
    throw new Error('Expected argument of type signage.studio.v1.playlist.DeletePlaylistResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_playlist_DeletePlaylistResponse(buffer_arg) {
  return studio_v1_playlist_playlist_common_pb.DeletePlaylistResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_playlist_GetPlaylistRequest(arg) {
  if (!(arg instanceof studio_v1_playlist_playlist_common_pb.GetPlaylistRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.playlist.GetPlaylistRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_playlist_GetPlaylistRequest(buffer_arg) {
  return studio_v1_playlist_playlist_common_pb.GetPlaylistRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_playlist_ListPlaylistsRequest(arg) {
  if (!(arg instanceof studio_v1_playlist_playlist_common_pb.ListPlaylistsRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.playlist.ListPlaylistsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_playlist_ListPlaylistsRequest(buffer_arg) {
  return studio_v1_playlist_playlist_common_pb.ListPlaylistsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_playlist_ListPlaylistsResponse(arg) {
  if (!(arg instanceof studio_v1_playlist_playlist_common_pb.ListPlaylistsResponse)) {
    throw new Error('Expected argument of type signage.studio.v1.playlist.ListPlaylistsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_playlist_ListPlaylistsResponse(buffer_arg) {
  return studio_v1_playlist_playlist_common_pb.ListPlaylistsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_playlist_Playlist(arg) {
  if (!(arg instanceof studio_v1_playlist_playlist_common_pb.Playlist)) {
    throw new Error('Expected argument of type signage.studio.v1.playlist.Playlist');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_playlist_Playlist(buffer_arg) {
  return studio_v1_playlist_playlist_common_pb.Playlist.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_playlist_PlaylistItem(arg) {
  if (!(arg instanceof studio_v1_playlist_playlist_common_pb.PlaylistItem)) {
    throw new Error('Expected argument of type signage.studio.v1.playlist.PlaylistItem');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_playlist_PlaylistItem(buffer_arg) {
  return studio_v1_playlist_playlist_common_pb.PlaylistItem.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_playlist_RemovePlaylistItemRequest(arg) {
  if (!(arg instanceof studio_v1_playlist_playlist_common_pb.RemovePlaylistItemRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.playlist.RemovePlaylistItemRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_playlist_RemovePlaylistItemRequest(buffer_arg) {
  return studio_v1_playlist_playlist_common_pb.RemovePlaylistItemRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_playlist_RemovePlaylistItemResponse(arg) {
  if (!(arg instanceof studio_v1_playlist_playlist_common_pb.RemovePlaylistItemResponse)) {
    throw new Error('Expected argument of type signage.studio.v1.playlist.RemovePlaylistItemResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_playlist_RemovePlaylistItemResponse(buffer_arg) {
  return studio_v1_playlist_playlist_common_pb.RemovePlaylistItemResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_playlist_ReorderPlaylistItemsRequest(arg) {
  if (!(arg instanceof studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.playlist.ReorderPlaylistItemsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_playlist_ReorderPlaylistItemsRequest(buffer_arg) {
  return studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_playlist_ReorderPlaylistItemsResponse(arg) {
  if (!(arg instanceof studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsResponse)) {
    throw new Error('Expected argument of type signage.studio.v1.playlist.ReorderPlaylistItemsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_playlist_ReorderPlaylistItemsResponse(buffer_arg) {
  return studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_playlist_UpdatePlaylistItemRequest(arg) {
  if (!(arg instanceof studio_v1_playlist_playlist_common_pb.UpdatePlaylistItemRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.playlist.UpdatePlaylistItemRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_playlist_UpdatePlaylistItemRequest(buffer_arg) {
  return studio_v1_playlist_playlist_common_pb.UpdatePlaylistItemRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_signage_studio_v1_playlist_UpdatePlaylistRequest(arg) {
  if (!(arg instanceof studio_v1_playlist_playlist_common_pb.UpdatePlaylistRequest)) {
    throw new Error('Expected argument of type signage.studio.v1.playlist.UpdatePlaylistRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_signage_studio_v1_playlist_UpdatePlaylistRequest(buffer_arg) {
  return studio_v1_playlist_playlist_common_pb.UpdatePlaylistRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


var PlaylistServiceService = exports.PlaylistServiceService = {
  // Playlist CRUD
createPlaylist: {
    path: '/signage.studio.v1.playlist.PlaylistService/CreatePlaylist',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_playlist_playlist_common_pb.CreatePlaylistRequest,
    responseType: studio_v1_playlist_playlist_common_pb.Playlist,
    requestSerialize: serialize_signage_studio_v1_playlist_CreatePlaylistRequest,
    requestDeserialize: deserialize_signage_studio_v1_playlist_CreatePlaylistRequest,
    responseSerialize: serialize_signage_studio_v1_playlist_Playlist,
    responseDeserialize: deserialize_signage_studio_v1_playlist_Playlist,
  },
  getPlaylist: {
    path: '/signage.studio.v1.playlist.PlaylistService/GetPlaylist',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_playlist_playlist_common_pb.GetPlaylistRequest,
    responseType: studio_v1_playlist_playlist_common_pb.Playlist,
    requestSerialize: serialize_signage_studio_v1_playlist_GetPlaylistRequest,
    requestDeserialize: deserialize_signage_studio_v1_playlist_GetPlaylistRequest,
    responseSerialize: serialize_signage_studio_v1_playlist_Playlist,
    responseDeserialize: deserialize_signage_studio_v1_playlist_Playlist,
  },
  listPlaylists: {
    path: '/signage.studio.v1.playlist.PlaylistService/ListPlaylists',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_playlist_playlist_common_pb.ListPlaylistsRequest,
    responseType: studio_v1_playlist_playlist_common_pb.ListPlaylistsResponse,
    requestSerialize: serialize_signage_studio_v1_playlist_ListPlaylistsRequest,
    requestDeserialize: deserialize_signage_studio_v1_playlist_ListPlaylistsRequest,
    responseSerialize: serialize_signage_studio_v1_playlist_ListPlaylistsResponse,
    responseDeserialize: deserialize_signage_studio_v1_playlist_ListPlaylistsResponse,
  },
  updatePlaylist: {
    path: '/signage.studio.v1.playlist.PlaylistService/UpdatePlaylist',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_playlist_playlist_common_pb.UpdatePlaylistRequest,
    responseType: studio_v1_playlist_playlist_common_pb.Playlist,
    requestSerialize: serialize_signage_studio_v1_playlist_UpdatePlaylistRequest,
    requestDeserialize: deserialize_signage_studio_v1_playlist_UpdatePlaylistRequest,
    responseSerialize: serialize_signage_studio_v1_playlist_Playlist,
    responseDeserialize: deserialize_signage_studio_v1_playlist_Playlist,
  },
  deletePlaylist: {
    path: '/signage.studio.v1.playlist.PlaylistService/DeletePlaylist',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_playlist_playlist_common_pb.DeletePlaylistRequest,
    responseType: studio_v1_playlist_playlist_common_pb.DeletePlaylistResponse,
    requestSerialize: serialize_signage_studio_v1_playlist_DeletePlaylistRequest,
    requestDeserialize: deserialize_signage_studio_v1_playlist_DeletePlaylistRequest,
    responseSerialize: serialize_signage_studio_v1_playlist_DeletePlaylistResponse,
    responseDeserialize: deserialize_signage_studio_v1_playlist_DeletePlaylistResponse,
  },
  // Playlist Items CRUD & Sequencing
addPlaylistItem: {
    path: '/signage.studio.v1.playlist.PlaylistService/AddPlaylistItem',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_playlist_playlist_common_pb.AddPlaylistItemRequest,
    responseType: studio_v1_playlist_playlist_common_pb.PlaylistItem,
    requestSerialize: serialize_signage_studio_v1_playlist_AddPlaylistItemRequest,
    requestDeserialize: deserialize_signage_studio_v1_playlist_AddPlaylistItemRequest,
    responseSerialize: serialize_signage_studio_v1_playlist_PlaylistItem,
    responseDeserialize: deserialize_signage_studio_v1_playlist_PlaylistItem,
  },
  updatePlaylistItem: {
    path: '/signage.studio.v1.playlist.PlaylistService/UpdatePlaylistItem',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_playlist_playlist_common_pb.UpdatePlaylistItemRequest,
    responseType: studio_v1_playlist_playlist_common_pb.PlaylistItem,
    requestSerialize: serialize_signage_studio_v1_playlist_UpdatePlaylistItemRequest,
    requestDeserialize: deserialize_signage_studio_v1_playlist_UpdatePlaylistItemRequest,
    responseSerialize: serialize_signage_studio_v1_playlist_PlaylistItem,
    responseDeserialize: deserialize_signage_studio_v1_playlist_PlaylistItem,
  },
  removePlaylistItem: {
    path: '/signage.studio.v1.playlist.PlaylistService/RemovePlaylistItem',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_playlist_playlist_common_pb.RemovePlaylistItemRequest,
    responseType: studio_v1_playlist_playlist_common_pb.RemovePlaylistItemResponse,
    requestSerialize: serialize_signage_studio_v1_playlist_RemovePlaylistItemRequest,
    requestDeserialize: deserialize_signage_studio_v1_playlist_RemovePlaylistItemRequest,
    responseSerialize: serialize_signage_studio_v1_playlist_RemovePlaylistItemResponse,
    responseDeserialize: deserialize_signage_studio_v1_playlist_RemovePlaylistItemResponse,
  },
  reorderPlaylistItems: {
    path: '/signage.studio.v1.playlist.PlaylistService/ReorderPlaylistItems',
    requestStream: false,
    responseStream: false,
    requestType: studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsRequest,
    responseType: studio_v1_playlist_playlist_common_pb.ReorderPlaylistItemsResponse,
    requestSerialize: serialize_signage_studio_v1_playlist_ReorderPlaylistItemsRequest,
    requestDeserialize: deserialize_signage_studio_v1_playlist_ReorderPlaylistItemsRequest,
    responseSerialize: serialize_signage_studio_v1_playlist_ReorderPlaylistItemsResponse,
    responseDeserialize: deserialize_signage_studio_v1_playlist_ReorderPlaylistItemsResponse,
  },
};

exports.PlaylistServiceClient = grpc.makeGenericClientConstructor(PlaylistServiceService, 'PlaylistService');
