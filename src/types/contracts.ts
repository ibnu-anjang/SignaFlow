// ============================================================================
// SIGNAFLOW SHARED API & REALTIME CONTRACT (src/types/contracts.ts)
// Konstitusi bersama antara Developer A (Backend) & Developer B (Frontend).
// Perubahan pada file ini wajib disepakati bersama melalui Pull Request.
// ============================================================================

export type UserRole = 'ADMIN' | 'OPERATOR';
export type DeviceStatus = 'UNPAIRED' | 'ONLINE' | 'STALE' | 'OFFLINE';
export type MediaType = 'IMAGE' | 'VIDEO';
export type TransitionType = 'CUT' | 'CROSSFADE';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
export type RemoteCommandType =
  | 'SYNC_MANIFEST'
  | 'RELOAD_PLAYER'
  | 'CLEAR_CACHE'
  | 'UNPAIR_DEVICE';

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  serverTimestampMs: number;
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ----------------------------------------------------------------------------
// 1. AUTHENTICATION CONTRACTS
// ----------------------------------------------------------------------------
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUserDTO {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

// ----------------------------------------------------------------------------
// 2. MEDIA & PLAYLIST CONTRACTS
// ----------------------------------------------------------------------------
export interface MediaAssetDTO {
  id: string;
  title: string;
  fileName: string;
  publicUrl: string;
  mimeType: string;
  type: MediaType;
  sizeBytes: number;
  checksumSha256: string;
  width: number;
  height: number;
  durationSeconds: number | null;
  createdAt: string;
}

export interface PlaylistItemDTO {
  id: string;
  sortOrder: number;
  durationSeconds: number;
  transition: TransitionType;
  mediaAsset: MediaAssetDTO;
}

export interface PlaylistDTO {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  version: number;
  totalDurationSeconds: number;
  itemCount: number;
  items: PlaylistItemDTO[];
  updatedAt: string;
}

export interface UpsertPlaylistRequest {
  name: string;
  description?: string | null;
  isActive?: boolean;
  items: Array<{
    mediaAssetId: string;
    sortOrder: number;
    durationSeconds: number;
    transition: TransitionType;
  }>;
}

// ----------------------------------------------------------------------------
// 3. DAY-PARTING SCHEDULE CONTRACTS
// ----------------------------------------------------------------------------
export interface ScheduleDTO {
  id: string;
  name: string;
  playlistId: string;
  playlistName: string;
  deviceId: string | null; // null = Berlaku untuk semua perangkat
  deviceName: string | null;
  startDate: string; // "YYYY-MM-DD"
  endDate: string | null; // "YYYY-MM-DD" | null
  daysOfWeek: number[]; // [0..6], 0 = Minggu .. 6 = Sabtu
  startTime: string; // "HH:mm" (00:00 - 23:59)
  endTime: string; // "HH:mm" (00:01 - 24:00)
  priority: number; // 1..100
  isActive: boolean;
  updatedAt: string;
}

export interface UpsertScheduleRequest {
  name: string;
  playlistId: string;
  deviceId: string | null;
  startDate: string;
  endDate: string | null;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  priority: number;
  isActive: boolean;
}

// ----------------------------------------------------------------------------
// 4. DEVICE MANAGEMENT & 6-DIGIT PAIRING CONTRACTS
// ----------------------------------------------------------------------------
export interface DeviceSummaryDTO {
  id: string;
  deviceKey: string;
  name: string;
  location: string | null;
  status: DeviceStatus;
  fallbackPlaylistId: string | null;
  fallbackPlaylistName: string | null;
  currentManifestHash: string | null;
  currentPlaylistId: string | null;
  currentPlaylistName: string | null;
  currentMediaId: string | null;
  currentMediaTitle: string | null;
  syncProgress: number;
  freeStorageMb: number | null;
  lastHeartbeatAt: string | null;
  pairedAt: string | null;
}

export interface PairingRequestPayload {
  deviceKey: string;
}

export interface PairingRequestResponse {
  deviceId: string;
  pairingCode: string;
  expiresAtIso: string;
  pollIntervalMs: number;
}

export interface PairingStatusResponse {
  paired: boolean;
  pairingCode: string | null;
  deviceToken?: string;
  device?: {
    id: string;
    name: string;
    location: string | null;
  };
}

export interface ClaimPairingCodeRequest {
  pairingCode: string;
  name: string;
  location?: string;
  fallbackPlaylistId?: string | null;
}

export interface DispatchDeviceCommandRequest {
  command: RemoteCommandType;
}

// ----------------------------------------------------------------------------
// 5. KIOSK RUNTIME MANIFEST, HEARTBEAT & TELEMETRY LOGS
// ----------------------------------------------------------------------------
export interface DeviceManifestDTO {
  deviceId: string;
  deviceName: string;
  manifestHash: string;
  generatedAtIso: string;
  serverTimestampMs: number;
  timezone: string;
  fallbackPlaylist: PlaylistDTO | null;
  schedules: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string | null;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    priority: number;
    playlist: PlaylistDTO;
  }>;
  requiredAssets: MediaAssetDTO[];
}

export interface HeartbeatRequest {
  currentManifestHash: string | null;
  currentPlaylistId: string | null;
  currentMediaId: string | null;
  syncProgress: number;
  freeStorageMb: number | null;
  uptimeSeconds: number;
}

export interface HeartbeatResponse {
  serverTimestampMs: number;
  latestManifestHash: string;
  syncRequired: boolean;
  pendingCommand: RemoteCommandType | null;
}

export interface DeviceLogCreateItem {
  level: LogLevel;
  eventType: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface DeviceLogDTO {
  id: string;
  deviceId: string;
  level: LogLevel;
  eventType: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ----------------------------------------------------------------------------
// 6. SERVER-SENT EVENTS (SSE) STREAM SCHEMA (/api/v1/device/stream)
// ----------------------------------------------------------------------------
export type KioskSSEEvent =
  | {
      type: 'CONNECTED';
      deviceId: string;
      serverTimestampMs: number;
    }
  | {
      type: 'PING';
      serverTimestampMs: number;
    }
  | {
      type: 'MANIFEST_UPDATED';
      latestManifestHash: string;
      serverTimestampMs: number;
    }
  | {
      type: 'REMOTE_COMMAND';
      command: RemoteCommandType;
      issuedAtMs: number;
    };
