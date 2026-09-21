/**
 * DKASigma Enterprise API Client Barrel
 */

// Core Protocol Exports
export * from '../core/invokeApi';

// Domain Submodule Exports
export * from './iam';
export * from './hardware';
export * from './studio';

// Re-export domain namespaces for direct modular consumption:
import * as iamModule from './iam';
import * as hardwareModule from './hardware';
import * as studioModule from './studio';

export const iam = iamModule;
export const hardware = hardwareModule;
export const studio = studioModule;

// Unified namespace backward-compatible export
export const api = {
  // IAM
  getRoles: iamModule.getRoles,
  getRole: iamModule.getRole,
  createRole: iamModule.createRole,
  updateRole: iamModule.updateRole,
  deleteRole: iamModule.deleteRole,
  getPermissions: iamModule.getPermissions,
  getUsers: iamModule.getUsers,
  getUser: iamModule.getUser,
  createUser: iamModule.createUser,
  updateUser: iamModule.updateUser,
  deleteUser: iamModule.deleteUser,

  // Hardware
  getDevices: hardwareModule.getDevices,
  getDevice: hardwareModule.getDevice,
  pairDevice: hardwareModule.pairDevice,
  updateDevice: hardwareModule.updateDevice,
  deleteDevice: hardwareModule.deleteDevice,

  // Hardware - Display Groups
  getDisplayGroups: hardwareModule.getDisplayGroups,
  createDisplayGroup: hardwareModule.createDisplayGroup,
  updateDisplayGroup: hardwareModule.updateDisplayGroup,
  deleteDisplayGroup: hardwareModule.deleteDisplayGroup,

  // Studio — Layouts
  getLayouts: studioModule.getLayouts,
  getLayout: studioModule.getLayout,
  createLayout: studioModule.createLayout,
  updateLayout: studioModule.updateLayout,
  deleteLayout: studioModule.deleteLayout,

  // Studio — Zones
  addZone: studioModule.addZone,
  updateZone: studioModule.updateZone,
  removeZone: studioModule.removeZone,

  // Studio — Schedules
  getSchedules: studioModule.getSchedules,
  getSchedule: studioModule.getSchedule,
  createSchedule: studioModule.createSchedule,
  updateSchedule: studioModule.updateSchedule,
  deleteSchedule: studioModule.deleteSchedule,

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
  uploadMediaChunk: studioModule.uploadMediaChunk,
  uploadFileViaGrpc: studioModule.uploadFileViaGrpc,
  getMediaFile: studioModule.getMediaFile,
};

// Storage & Session Helpers
export function getStoredSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('dkasigma_session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() > (session.expiresAt || 0)) {
      localStorage.removeItem('dkasigma_session');
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: any): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dkasigma_session', JSON.stringify(session));
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dkasigma_session');
  }
}
