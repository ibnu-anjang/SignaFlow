# 04. ERD & Desain Database

Dokumen ini menjelaskan **struktur tabel database PostgreSQL** yang kita gunakan di proyek SignaFlow. Kita memakai **Prisma ORM**, jadi kita tidak perlu menulis query SQL manual yang rumit saat ngoding di Next.js.

---

## 1. Gambar Relasi Tabel (Entity Relationship Diagram)

Di bawah ini adalah peta hubungan antar tabel di database kita:

```mermaid
erDiagram
    USERS ||--o{ MEDIA_ASSETS : "mengunggah"
    USERS ||--o{ PLAYLISTS : "membuat"
    USERS ||--o{ SCHEDULES : "mengatur"
    PLAYLISTS ||--o{ PLAYLIST_ITEMS : "memiliki_item"
    MEDIA_ASSETS ||--o{ PLAYLIST_ITEMS : "dipakai_di"
    PLAYLISTS ||--o{ DEVICES : "jadi_playlist_cadangan"
    PLAYLISTS ||--o{ SCHEDULES : "ditayangkan_oleh"
    DEVICES ||--o{ SCHEDULES : "ditargetkan_oleh"
    DEVICES ||--o{ DEVICE_LOGS : "mencatat_log"

    USERS {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        user_role role "ADMIN / OPERATOR"
    }

    MEDIA_ASSETS {
        uuid id PK
        varchar title "Judul Video/Gambar"
        varchar public_url "Link File (/media/...)"
        media_type type "IMAGE / VIDEO"
        bigint size_bytes "Ukuran File (Byte)"
        char_64 checksum_sha256 "Sidik Jari File"
        int width "1080"
        int height "1920"
        int duration_seconds "Durasi Video"
    }

    PLAYLISTS {
        uuid id PK
        varchar name "Nama Playlist"
        int version "Versi (Naik tiap diubah)"
        boolean is_active
    }

    PLAYLIST_ITEMS {
        uuid id PK
        uuid playlist_id FK
        uuid media_asset_id FK
        int sort_order "Urutan (0, 1, 2...)"
        int duration_seconds "Berapa detik tampil"
        transition_type transition "CUT / CROSSFADE"
    }

    DEVICES {
        uuid id PK
        varchar device_key UK "UUID Kiosk"
        varchar name "Nama TV (misal: TV Lobi)"
        varchar location "Lokasi Fisik"
        char_6 pairing_code "Kode 6 Digit Sementara"
        char_64 token_hash "Token Rahasia Kiosk"
        device_status status "ONLINE / STALE / OFFLINE"
        uuid fallback_playlist_id FK "Playlist Cadangan"
        char_64 current_manifest_hash
        int sync_progress "Persentase Download (0-100)"
    }

    SCHEDULES {
        uuid id PK
        varchar name "Nama Jadwal"
        uuid playlist_id FK
        uuid device_id FK "Target Kiosk (Bisa NULL = Semua TV)"
        date start_date
        date end_date
        int_array days_of_week "Hari (0=Minggu .. 6=Sabtu)"
        char_5 start_time "Jam Mulai (misal: 06:00)"
        char_5 end_time "Jam Selesai (misal: 12:00)"
        int priority "Prioritas (1-100)"
        boolean is_active
    }

    DEVICE_LOGS {
        uuid id PK
        uuid device_id FK
        log_level level "INFO / WARN / ERROR"
        varchar event_type "BOOT / SYNC_COMPLETE / PLAYBACK_ERROR"
        text message
    }
```

---

## 2. Penjelasan 7 Tabel Utama (Bahasa Sederhana)

1. **`users`:** Menyimpan akun staf/admin yang boleh login ke halaman `/admin` (email, password yang di-hash, dan nama lengkap).
2. **`media_assets`:** Menyimpan catatan setiap file video atau gambar yang di-upload admin (nama file, ukuran byte, durasi video, dan sidik jari unik `checksum_sha256`).
3. **`playlists`:** Menyimpan nama kelompok daftar putar (contoh: "Promo Pagi Driving Range", "Iklan Malam"). Setiap kali susunan playlist diubah, angka `version` otomatis bertambah 1.
4. **`playlist_items`:** Tabel penghubung antara Playlist dan Media. Isinya mengatur: *"Di playlist A, Video B muncul di urutan ke-0 selama 10 detik dengan efek Crossfade"*.
5. **`devices`:** Menyimpan daftar layar TV Kiosk yang terdaftar di sistem kita (nama TV, lokasi fisik, status online/offline, dan kode pairing 6 digit sementara).
6. **`schedules`:** Menyimpan aturan jam tayang (kapan playlist A harus diputar, dari jam berapa sampai jam berapa, di hari apa saja, dan untuk TV mana saja).
7. **`device_logs`:** Buku harian TV Kiosk. Setiap kali TV menyala, selesai download video, atau mendeteksi video macet, TV mengirim laporan ke tabel ini agar Admin tahu riwayatnya.

---

## 3. Aturan Pengaman Penghapusan (Foreign Key Safety)

Ada satu aturan keamanan database yang sangat penting di proyek ini:
* **Pada tabel `playlist_items`:** Hubungan ke `media_assets` diatur ke **`ON DELETE RESTRICT`**.
* **Apa artinya?** Kalau ada admin yang mencoba menghapus file video di menu Media Library, tapi video itu ternyata **masih terdaftar di dalam salah satu playlist aktif**, database akan menolak penghapusan tersebut dan memberi peringatan.
* **Tujuannya:** Menjaga agar TV Kiosk di lapangan tidak bingung mencari file yang tiba-tiba hilang.

---

## 4. File Skema Prisma Siap Pakai (`prisma/schema.prisma`)

Developer A bisa langsung memakai skema Prisma di bawah ini:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  OPERATOR
}

enum DeviceStatus {
  UNPAIRED
  ONLINE
  STALE
  OFFLINE
}

enum MediaType {
  IMAGE
  VIDEO
}

enum TransitionType {
  CUT
  CROSSFADE
}

enum LogLevel {
  INFO
  WARN
  ERROR
}

model User {
  id           String       @id @default(uuid()) @db.Uuid
  email        String       @unique @db.VarChar(255)
  passwordHash String       @map("password_hash") @db.VarChar(255)
  fullName     String       @map("full_name") @db.VarChar(120)
  role         UserRole     @default(ADMIN)
  isActive     Boolean      @default(true) @map("is_active")
  createdAt    DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)

  mediaAssets  MediaAsset[]
  playlists    Playlist[]
  schedules    Schedule[]

  @@map("users")
}

model MediaAsset {
  id              String         @id @default(uuid()) @db.Uuid
  title           String         @db.VarChar(160)
  fileName        String         @map("file_name") @db.VarChar(255)
  storagePath     String         @unique @map("storage_path") @db.VarChar(512)
  publicUrl       String         @map("public_url") @db.VarChar(512)
  mimeType        String         @map("mime_type") @db.VarChar(80)
  type            MediaType
  sizeBytes       BigInt         @map("size_bytes")
  checksumSha256  String         @map("checksum_sha256") @db.Char(64)
  width           Int            @default(1080)
  height          Int            @default(1920)
  durationSeconds Int?           @map("duration_seconds")
  uploadedById    String?        @map("uploaded_by_id") @db.Uuid
  createdAt       DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)

  uploadedBy      User?          @relation(fields: [uploadedById], references: [id], onDelete: SetNull)
  playlistItems   PlaylistItem[]
  playingDevices  Device[]       @relation("CurrentPlayingMedia")

  @@index([type], map: "idx_media_assets_type")
  @@index([checksumSha256], map: "idx_media_assets_checksum")
  @@index([createdAt(sort: Desc)], map: "idx_media_assets_created_at")
  @@map("media_assets")
}

model Playlist {
  id                String         @id @default(uuid()) @db.Uuid
  name              String         @db.VarChar(140)
  description       String?        @db.Text
  isActive          Boolean        @default(true) @map("is_active")
  version           Int            @default(1)
  createdById       String?        @map("created_by_id") @db.Uuid
  createdAt         DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)

  createdBy         User?          @relation(fields: [createdById], references: [id], onDelete: SetNull)
  items             PlaylistItem[]
  schedules         Schedule[]
  fallbackForDevice Device[]       @relation("DeviceFallbackPlaylist")
  playingOnDevices  Device[]       @relation("CurrentPlayingPlaylist")

  @@map("playlists")
}

model PlaylistItem {
  id              String         @id @default(uuid()) @db.Uuid
  playlistId      String         @map("playlist_id") @db.Uuid
  mediaAssetId    String         @map("media_asset_id") @db.Uuid
  sortOrder       Int            @map("sort_order")
  durationSeconds Int            @default(10) @map("duration_seconds")
  transition      TransitionType @default(CROSSFADE)
  createdAt       DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)

  playlist        Playlist       @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  mediaAsset      MediaAsset     @relation(fields: [mediaAssetId], references: [id], onDelete: Restrict)

  @@unique([playlistId, sortOrder], map: "uq_playlist_item_order")
  @@index([playlistId, sortOrder(sort: Asc)], map: "idx_playlist_items_playlist_sort")
  @@index([mediaAssetId], map: "idx_playlist_items_media_asset")
  @@map("playlist_items")
}

model Device {
  id                  String       @id @default(uuid()) @db.Uuid
  deviceKey           String       @unique @map("device_key") @db.VarChar(128)
  name                String       @default("Unpaired Kiosk") @db.VarChar(120)
  location            String?      @db.VarChar(160)
  pairingCode         String?      @unique @map("pairing_code") @db.Char(6)
  pairingExpiresAt    DateTime?    @map("pairing_expires_at") @db.Timestamptz(6)
  tokenHash           String?      @unique @map("token_hash") @db.Char(64)
  status              DeviceStatus @default(UNPAIRED)
  fallbackPlaylistId  String?      @map("fallback_playlist_id") @db.Uuid
  currentManifestHash String?      @map("current_manifest_hash") @db.Char(64)
  currentPlaylistId   String?      @map("current_playlist_id") @db.Uuid
  currentMediaId      String?      @map("current_media_id") @db.Uuid
  syncProgress        Int          @default(0) @map("sync_progress")
  freeStorageMb       Int?         @map("free_storage_mb")
  pendingCommand      String?      @map("pending_command") @db.VarChar(64)
  lastHeartbeatAt     DateTime?    @map("last_heartbeat_at") @db.Timestamptz(6)
  pairedAt            DateTime?    @map("paired_at") @db.Timestamptz(6)
  createdAt           DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)

  fallbackPlaylist    Playlist?    @relation("DeviceFallbackPlaylist", fields: [fallbackPlaylistId], references: [id], onDelete: SetNull)
  currentPlaylist     Playlist?    @relation("CurrentPlayingPlaylist", fields: [currentPlaylistId], references: [id], onDelete: SetNull)
  currentMedia        MediaAsset?  @relation("CurrentPlayingMedia", fields: [currentMediaId], references: [id], onDelete: SetNull)
  schedules           Schedule[]
  logs                DeviceLog[]

  @@index([status, lastHeartbeatAt], map: "idx_devices_status_heartbeat")
  @@map("devices")
}

model Schedule {
  id          String    @id @default(uuid()) @db.Uuid
  name        String    @db.VarChar(160)
  playlistId  String    @map("playlist_id") @db.Uuid
  deviceId    String?   @map("device_id") @db.Uuid
  startDate   DateTime  @map("start_date") @db.Date
  endDate     DateTime? @map("end_date") @db.Date
  daysOfWeek  Int[]     @default([0, 1, 2, 3, 4, 5, 6]) @map("days_of_week")
  startTime   String    @map("start_time") @db.Char(5)
  endTime     String    @map("end_time") @db.Char(5)
  priority    Int       @default(10)
  isActive    Boolean   @default(true) @map("is_active")
  createdById String?   @map("created_by_id") @db.Uuid
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  playlist    Playlist  @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  device      Device?   @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  createdBy   User?     @relation(fields: [createdById], references: [id], onDelete: SetNull)

  @@index([isActive, deviceId, startDate, endDate, priority(sort: Desc)], map: "idx_schedules_lookup")
  @@index([playlistId], map: "idx_schedules_playlist")
  @@map("schedules")
}

model DeviceLog {
  id        String   @id @default(uuid()) @db.Uuid
  deviceId  String   @map("device_id") @db.Uuid
  level     LogLevel @default(INFO)
  eventType String   @map("event_type") @db.VarChar(64)
  message   String   @db.Text
  metadata  Json     @default("{}") @db.JsonB
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  device    Device   @relation(fields: [deviceId], references: [id], onDelete: Cascade)

  @@index([deviceId, createdAt(sort: Desc)], map: "idx_device_logs_device_time")
  @@index([level, createdAt(sort: Desc)], map: "idx_device_logs_level_time")
  @@map("device_logs")
}
```
