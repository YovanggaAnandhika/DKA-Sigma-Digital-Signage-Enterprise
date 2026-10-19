/**
 * DKASigma Enterprise API Client Barrel
 */

// Core Protocol Exports
export * from '../core/invokeApi';

// Domain Submodule Exports
export * from './iam';
export * from './hardware';
export * from './studio';
export * from './common';

// Re-export domain namespaces for direct modular consumption:
import * as iamModule from './iam';
import * as hardwareModule from './hardware';
import * as studioModule from './studio';
import * as commonModule from './common';

export const iam = iamModule;
export const hardware = hardwareModule;
export const studio = studioModule;
export const common = commonModule;

// Unified namespace backward-compatible export
export const api = {
  // Common - Resolution
  getResolutions: commonModule.getResolutions,
  getResolution: commonModule.getResolution,
  createResolution: commonModule.createResolution,
  updateResolution: commonModule.updateResolution,
  deleteResolution: commonModule.deleteResolution,

  // Common - Orientation
  getOrientations: commonModule.getOrientations,
  getOrientation: commonModule.getOrientation,
  createOrientation: commonModule.createOrientation,
  updateOrientation: commonModule.updateOrientation,
  deleteOrientation: commonModule.deleteOrientation,

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
  login: iamModule.login,

  // Hardware
  getDevices: hardwareModule.getDevices,
  getDevice: hardwareModule.getDevice,
  pairDevice: hardwareModule.pairDevice,
  updateDevice: hardwareModule.updateDevice,
  deleteDevice: hardwareModule.deleteDevice,
  pushDeviceCommand: hardwareModule.pushDeviceCommand,
  listPlaybackLogs: hardwareModule.listPlaybackLogs,
  reportPlaybackBatch: hardwareModule.reportPlaybackBatch,
  listDeviceScreenshots: hardwareModule.listDeviceScreenshots,
  getLatestDeviceTelemetry: hardwareModule.getLatestDeviceTelemetry,

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
  getLayoutHistory: studioModule.getLayoutHistory,
  rollbackLayout: studioModule.rollbackLayout,
  deleteLayoutHistory: studioModule.deleteLayoutHistory,

  // Studio — Layers
  createLayer: studioModule.createLayer,
  updateLayer: studioModule.updateLayer,
  deleteLayer: studioModule.deleteLayer,
  addPlaylistBlock: studioModule.addPlaylistBlock,
  updatePlaylistBlock: studioModule.updatePlaylistBlock,
  removePlaylistBlock: studioModule.removePlaylistBlock,
  addMediaBlock: studioModule.addMediaBlock,
  addWidgetBlock: studioModule.addWidgetBlock,
  setPlaylistItemOverride: studioModule.setPlaylistItemOverride,

  // Studio — Schedules
  getSchedules: studioModule.getSchedules,
  getSchedule: studioModule.getSchedule,
  createSchedule: studioModule.createSchedule,
  updateSchedule: studioModule.updateSchedule,
  deleteSchedule: studioModule.deleteSchedule,
  addScheduleEvent: studioModule.addScheduleEvent,
  removeScheduleEvent: studioModule.removeScheduleEvent,
  pushLayoutToSchedule: studioModule.pushLayoutToSchedule,

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
  finalizeUpload: studioModule.finalizeUpload,
  cancelUpload: studioModule.cancelUpload,
  getMediaFile: studioModule.getMediaFile,

  // Studio — Transitions
  getTransitions: studioModule.getTransitions,
  getTransition: studioModule.getTransition,
  createTransition: studioModule.createTransition,
  updateTransition: studioModule.updateTransition,
  deleteTransition: studioModule.deleteTransition,

  // Studio — Visual Filters
  getVisualFilters: studioModule.getVisualFilters,
  getVisualFilter: studioModule.getVisualFilter,
  createVisualFilter: studioModule.createVisualFilter,
  updateVisualFilter: studioModule.updateVisualFilter,
  deleteVisualFilter: studioModule.deleteVisualFilter,
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
