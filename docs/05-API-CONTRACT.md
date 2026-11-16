# 05. Kontrak API & Protokol Realtime (SSE)

Dokumen ini adalah kontrak baku (*Locked Interface Contract*) antara **Developer A (Backend)** dan **Developer B (Frontend & Kiosk Player)**. Seluruh tipe data disimpan di `src/types/contracts.ts`.

---

## 1. Standar Protokol & Keamanan

1. **Format Envelope Respons:**
   - Sukses (`2xx`):
     ```json
     {
       "ok": true,
       "data": { ... },
       "serverTimestampMs": 1794803500123
     }
     ```
   - Gagal (`4xx` / `5xx`):
     ```json
     {
       "ok": false,
       "error": {
         "code": "MEDIA_IN_USE",
         "message": "Video ini masih digunakan pada 2 playlist aktif.",
         "details": { "playlists": ["Promo Pagi", "Default Loop"] }
       }
     }
     ```
2. **Skema Autentikasi Ganda:**
   - **Admin CMS (`/api/v1/auth/*`, `/api/v1/media/*`, `/api/v1/playlists/*`, `/api/v1/schedules/*`, `/api/v1/devices/*`):** Menggunakan *cookie* `signaflow_session` (`HttpOnly; Secure; SameSite=Lax`) berisi token JWT yang ditandatangani dengan `JWT_SECRET` (algoritma `HS256`).
   - **Perangkat Kiosk (`/api/v1/device/*`):** Menggunakan header `Authorization: Bearer <deviceToken>` (atau query param `?token=<deviceToken>` khusus untuk `EventSource` SSE). Server melakukan *hashing* `SHA-256` terhadap token tersebut dan mencocokkannya dengan kolom `devices.token_hash`.

---

## 2. Daftar Lengkap Endpoint REST API

### 2.1 Autentikasi Admin
| Metode | Endpoint | Deskripsi | Kode Status |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Login menggunakan `email` & `password`. | `200`, `401` |
| `POST` | `/api/v1/auth/logout` | Menghapus *cookie* sesi admin. | `200` |
| `GET` | `/api/v1/auth/me` | Mengambil profil pengguna yang sedang aktif. | `200`, `401` |

### 2.2 Manajemen Aset Media
| Metode | Endpoint | Deskripsi | Kode Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/media` | Mengambil daftar media (query opsional: `?type=IMAGE\|VIDEO&q=keyword`). | `200` |
| `POST` | `/api/v1/media` | Mengunggah file via `multipart/form-data` (`file`, `title`, `durationSeconds`). | `201`, `400`, `413` |
| `DELETE` | `/api/v1/media/:id` | Menghapus file dari database & disk (ditolak jika masih dipakai di `playlist_items`). | `200`, `404`, `409` |

### 2.3 Manajemen Playlist
| Metode | Endpoint | Deskripsi | Kode Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/playlists` | Daftar seluruh *playlist* beserta ringkasan jumlah item & total durasi. | `200` |
| `POST` | `/api/v1/playlists` | Membuat *playlist* baru beserta urutan `items`. | `201`, `400` |
| `GET` | `/api/v1/playlists/:id` | Detail satu *playlist* beserta daftar item dan objek `mediaAsset`. | `200`, `404` |
| `PUT` | `/api/v1/playlists/:id` | Mengganti metadata & urutan item *playlist* (otomatis menaikkan `version` + kirim SSE). | `200`, `400`, `404` |
| `DELETE` | `/api/v1/playlists/:id` | Menghapus *playlist*. | `200`, `404` |

### 2.4 Manajemen Jadwal (*Day-Parting Schedules*)
| Metode | Endpoint | Deskripsi | Kode Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/schedules` | Daftar seluruh jadwal (query opsional: `?deviceId=...`). | `200` |
| `POST` | `/api/v1/schedules` | Membuat jadwal baru dan memicu `MANIFEST_UPDATED` via SSE ke perangkat target. | `201`, `400` |
| `PUT` | `/api/v1/schedules/:id` | Memperbarui jadwal dan memicu `MANIFEST_UPDATED` via SSE. | `200`, `400`, `404` |
| `DELETE` | `/api/v1/schedules/:id` | Menghapus jadwal dan memicu `MANIFEST_UPDATED` via SSE. | `200`, `404` |

### 2.5 Manajemen Armada Kiosk (Sisi Admin)
| Metode | Endpoint | Deskripsi | Kode Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/devices` | Daftar seluruh perangkat kiosk beserta status terkini (`ONLINE`, `STALE`, `OFFLINE`). | `200` |
| `POST` | `/api/v1/devices/pair` | Mengklaim kode 6 digit (`pairingCode`), memberi nama perangkat, dan mengikat `fallbackPlaylistId`. | `200`, `400`, `404` |
| `PATCH` | `/api/v1/devices/:id` | Memperbarui `name`, `location`, atau `fallbackPlaylistId` perangkat. | `200`, `404` |
| `POST` | `/api/v1/devices/:id/command` | Mengirim komando jarak jauh (`SYNC_MANIFEST`, `RELOAD_PLAYER`, `CLEAR_CACHE`, `UNPAIR_DEVICE`). | `200`, `404` |
| `GET` | `/api/v1/devices/:id/logs` | Mengambil 100 baris log terbaru untuk perangkat tertentu. | `200`, `404` |

### 2.6 Endpoint Runtime Kiosk (Sisi Layar `/player`)
| Metode | Endpoint | Deskripsi | Kode Status |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/device/pair/request` | Mengirim `deviceKey` dan meminta kode *pairing* 6 digit baru (berlaku 10 menit). | `200`, `429` |
| `GET` | `/api/v1/device/pair/status` | *Polling* status *pairing* (`?deviceKey=...`). Mengembalikan `deviceToken` satu kali saat klaim berhasil. | `200`, `404` |
| `GET` | `/api/v1/device/manifest` | Mengambil dokumen `DeviceManifestDTO` lengkap beserta `manifestHash` dan `serverTimestampMs`. | `200`, `401` |
| `POST` | `/api/v1/device/heartbeat` | Melaporkan telemetri tiap 30 detik & mengambil `latestManifestHash` serta `pendingCommand`. | `200`, `401` |
| `POST` | `/api/v1/device/logs` | Mengirim kumpulan log *offline* / *playback error* ke server. | `201`, `401` |
| `GET` | `/api/v1/device/stream` | Koneksi *Server-Sent Events* (SSE) untuk komando instan. | `200`, `401` |

---

## 3. Kamus Kode Error Standar

| Kode Error | HTTP Status | Arti & Penanganan di Sisi Klien |
| :--- | :--- | :--- |
| `UNAUTHORIZED` | `401` | Sesi admin habis atau `deviceToken` kiosk tidak valid/telah di-*unpair*. Kiosk wajib kembali ke layar *pairing*. |
| `VALIDATION_ERROR` | `400` | Input form tidak valid (misal `endTime <= startTime`). Tampilkan pesan pada field terkait. |
| `INVALID_MEDIA_TYPE` | `400` | Format file atau *magic bytes* bukan gambar/video yang diizinkan. |
| `MEDIA_IN_USE` | `409` | Aset media gagal dihapus karena masih dipakai di salah satu *playlist*. |
| `PAIRING_CODE_EXPIRED` | `400` | Kode 6 digit tidak ditemukan atau sudah lewat 10 menit. |

---

## 4. Kontrak TypeScript Lengkap (`src/types/contracts.ts`)

```typescript
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

export interface AuthUserDTO {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

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

export interface ScheduleDTO {
  id: string;
  name: string;
  playlistId: string;
  playlistName: string;
  deviceId: string | null;
  deviceName: string | null;
  startDate: string; // "YYYY-MM-DD"
  endDate: string | null; // "YYYY-MM-DD" | null
  daysOfWeek: number[]; // [0..6]
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
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
```
