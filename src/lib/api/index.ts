/**
 * OmniSign Enterprise API Client Barrel
 * Modular Architecture matching project standard domain hierarchy:
 *  - Core: low-level wire protocol dispatcher (Protobuf & gRPC-Web)
 *  - IAM: User, Role, Permission services
 *  - Hardware: Device & fleet management services
 *  - Studio: Layout, Playlist, Media services
 */

// Core Protocol Exports
export * from './core/client';

// Domain Submodule Exports
export * from './iam';
export * from './hardware';
export * from './studio';

// Re-export domain namespaces for direct modular consumption:
// import { iam, hardware, studio, api } from '@/lib/api';
import * as iamModule from './iam';
import * as hardwareModule from './hardware';
import * as studioModule from './studio';

export const iam = iamModule;
export const hardware = hardwareModule;
export const studio = studioModule;

// Unified namespace backward-compatible export
export const api = {
  // IAM
  login: iamModule.login,
  getRoles: iamModule.getRoles,
  getRole: iamModule.getRole,
  createRole: iamModule.createRole,
  updateRole: iamModule.updateRole,
  deleteRole: iamModule.deleteRole,
  getPermissions: iamModule.getPermissions,

  // Hardware
  getDevices: hardwareModule.getDevices,
  getDevice: hardwareModule.getDevice,
  pairDevice: hardwareModule.pairDevice,
  updateDevice: hardwareModule.updateDevice,
  deleteDevice: hardwareModule.deleteDevice,

  // Studio — Layouts
  getLayouts: studioModule.getLayouts,
  getLayout: studioModule.getLayout,
  createLayout: studioModule.createLayout,
  updateLayout: studioModule.updateLayout,
  deleteLayout: studioModule.deleteLayout,

  // Studio — Zones
  createZone: studioModule.createZone,
  updateZone: studioModule.updateZone,
  deleteZone: studioModule.deleteZone,
  assignPlaylistToZone: studioModule.assignPlaylistToZone,

  // Studio — Playlists
  getPlaylists: studioModule.getPlaylists,
  getPlaylist: studioModule.getPlaylist,
  createPlaylist: studioModule.createPlaylist,
  updatePlaylist: studioModule.updatePlaylist,
  deletePlaylist: studioModule.deletePlaylist,
  addPlaylistItem: studioModule.addPlaylistItem,
  removePlaylistItem: studioModule.removePlaylistItem,
  updatePlaylistItem: studioModule.updatePlaylistItem,
  reorderPlaylistItems: studioModule.reorderPlaylistItems,

  // Studio — Media
  getMedia: studioModule.getMedia,
  getMediaItem: studioModule.getMediaItem,
  createMedia: studioModule.createMedia,
  updateMedia: studioModule.updateMedia,
  deleteMedia: studioModule.deleteMedia,
};

// Storage & Session Helpers
export function getStoredSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('omnisign_session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() > (session.expiresAt || 0)) {
      localStorage.removeItem('omnisign_session');
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: any): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('omnisign_session', JSON.stringify(session));
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('omnisign_session');
  }
}
