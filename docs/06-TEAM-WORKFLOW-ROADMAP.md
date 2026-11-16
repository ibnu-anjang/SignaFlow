# 06. Pembagian Tugas Tim 2 Orang & Peta Jalan Eksekusi

Dokumen ini mengatur tata kelola kolaborasi antara **Developer A** dan **Developer B** agar pengerjaan proyek PKL berjalan paralel, terukur, dan bebas dari konflik *merge* Git.

---

## 1. Pembagian Peran & Kepemilikan Direktori (*Directory Ownership*)

Prinsip utama: **Satu file hanya boleh dimiliki oleh satu developer pada satu waktu**, kecuali file kontrak bersama (`src/types/contracts.ts`).

```text
SignaFlow/
├── docker/
│   └── Caddyfile                  [Milik Dev A]
├── Dockerfile                     [Milik Dev A]
├── docker-compose.yml             [Milik Dev A]
├── prisma/
│   ├── schema.prisma              [Milik Dev A]
│   └── seed.ts                    [Milik Dev A]
├── public/
│   ├── manifest.json              [Milik Dev B - PWA Manifest]
│   └── sw.js                      [Milik Dev B - Service Worker Offline]
└── src/
    ├── types/
    │   └── contracts.ts           [DIKUNCI BERSAMA - Wajib PR Berdua]
    ├── server/                    [Milik Dev A - Seluruh Logika Backend]
    │   ├── db.ts
    │   ├── auth.ts
    │   ├── storage.ts
    │   ├── manifest-compiler.ts
    │   └── sse-broker.ts
    ├── app/
    │   ├── api/v1/                [Milik Dev A - Seluruh Endpoint API & SSE]
    │   ├── (auth)/login/          [Milik Dev B - Halaman Login Admin]
    │   ├── (admin)/admin/         [Milik Dev B - Dashboard CMS Desktop & HP]
    │   └── (kiosk)/player/        [Milik Dev B - Kanvas Kiosk 9:16 Fullscreen]
    ├── components/
    │   ├── admin/                 [Milik Dev B - Komponen UI CMS]
    │   └── kiosk/                 [Milik Dev B - Komponen Pemutar Double-Buffer]
    └── lib/
        ├── api-client.ts          [Milik Dev B - HTTP Client Wrapper]
        └── kiosk/                 [Milik Dev B - IndexedDB, Cache API, Scheduler, Watchdog]
```

---

## 2. Standar Alur Kerja Git (*Git Workflow*)

### 2.1 Strategi Branch
* `main`: Branch rilis stabil (hanya menerima *merge* dari `develop` setelah lolos verifikasi Docker).
* `develop`: Branch integrasi tempat Dev A dan Dev B menyatukan pekerjaan di setiap akhir fase.
* `feat/dev-a-<nama-fitur>`: Branch kerja harian Developer A (contoh: `feat/dev-a-media-storage`).
* `feat/dev-b-<nama-fitur>`: Branch kerja harian Developer B (contoh: `feat/dev-b-mobile-playlist-builder`).

### 2.2 Konvensi Pesan Commit (*Conventional Commits*)
Gunakan awalan yang jelas agar riwayat Git rapi saat dinilai oleh pembimbing PKL:
* `feat(api): add 6-digit device pairing endpoints`
* `feat(kiosk): implement double-buffered video renderer`
* `fix(cache): verify sha256 digest before storing media blob`
* `docs(adr): add architecture decision records`
* `chore(docker): configure caddy reverse proxy with internal tls`

### 2.3 Aturan Pull Request (PR)
Sebelum melakukan *merge* ke `develop`, wajib menjalankan pemeriksaan lokal:
```bash
npm run typecheck
npm run lint
npm run build
```

---

## 3. Peta Jalan Eksekusi 4 Fase (*Execution Roadmap*)

### Fase 1: Pondasi, Database, Autentikasi & Infrastruktur Docker
* **Target:** *Stack* Docker menyala melalui HTTPS, database termigrasi dengan data awal (*seed*), dan kerangka UI Admin (Desktop/HP) serta Kiosk `9:16` siap digunakan.
* **Tugas Developer A:**
  - [ ] Setup Next.js (`output: 'standalone'`), Prisma ORM, dan migrasi tabel (`users`, `media_assets`, `playlists`, `playlist_items`, `devices`, `schedules`, `device_logs`).
  - [ ] Membuat skrip `prisma/seed.ts` (membuat akun Admin default `admin@signaflow.local` dan contoh data awal).
  - [ ] Membuat `Dockerfile` (*multi-stage* `linux/amd64`), `docker-compose.yml`, dan `docker/Caddyfile` (HTTPS + `/media/*` byte-range streaming).
  - [ ] Mengimplementasikan API Autentikasi (`/api/v1/auth/login`, `/logout`, `/me`) dan middleware verifikasi token.
* **Tugas Developer B:**
  - [ ] Mengunci `src/types/contracts.ts` dan membuat `src/lib/api-client.ts`.
  - [ ] Membangun halaman `/login` dan *App Shell* `/admin` yang **Mobile-Responsive** (*sidebar* pada layar laptop, *bottom/drawer navigation* pada layar HP).
  - [ ] Membangun panggung `/player` dengan kunci rasio `9:16` (`1080x1920`), *auto-scale preview* untuk layar laptop/HP, dan penguncian CSS (`cursor: none`, anti-zoom).
* **Definition of Done (DoD Fase 1):** `docker compose up --build` berjalan mulus, Admin bisa login dari laptop maupun HP, dan `/player` menampilkan kanvas `9:16` yang terkunci.

---

### Fase 2: Manajemen Media, Playlist Builder & Pairing 6 Digit
* **Target:** Admin dapat mengunggah media, menyusun *playlist*, dan memasangkan layar kiosk baru menggunakan kode 6 digit.
* **Tugas Developer A:**
  - [ ] Membangun `StorageService` untuk menyimpan file ke `/data/uploads`, memvalidasi *magic bytes* MIME, dan menghitung `checksumSha256`.
  - [ ] Mengimplementasikan endpoint `/api/v1/media` dan `/api/v1/playlists` (termasuk proteksi `409 Conflict` saat menghapus media yang sedang dipakai).
  - [ ] Mengimplementasikan endpoint *pairing* 6 digit (`/api/v1/device/pair/request`, `/api/v1/device/pair/status`, `/api/v1/devices/pair`).
* **Tugas Developer B:**
  - [ ] Membangun halaman **Media Library** (`/admin/media`) dengan fitur unggah file, indikator rasio `9:16`, pratinjau video/gambar, dan hapus media.
  - [ ] Membangun halaman **Playlist Builder** (`/admin/playlists`) dengan pengaturan durasi, pilihan transisi (`CUT`/`CROSSFADE`), dan pengurutan item yang nyaman di layar sentuh HP maupun mouse desktop.
  - [ ] Membangun **Layar Pairing 6 Digit** pada `/player` dan **Modal Klaim Pairing** pada `/admin/devices`.
* **Definition of Done (DoD Fase 2):** Operator dapat berdiri di depan layar `/player`, memasukkan 6 digit kode lewat HP di halaman `/admin/devices`, dan layar `/player` langsung terautentikasi serta menerima token.

---

### Fase 3: Mesin *Offline-First*, Penjadwal *Day-Parting* & Realtime SSE
* **Target:** Pemutaran *offline* 100%, pergantian jadwal *day-parting* lokal, transisi *zero-flicker*, dan komando instan SSE.
* **Tugas Developer A:**
  - [ ] Membangun `ManifestCompiler` (`GET /api/v1/device/manifest`) yang menghitung `manifestHash` deterministik.
  - [ ] Mengimplementasikan CRUD Jadwal (`/api/v1/schedules`) beserta validasi jam dan hari.
  - [ ] Membangun `SSEBroker` (`/api/v1/device/stream`), endpoint Heartbeat (`POST /api/v1/device/heartbeat`), dan endpoint Remote Command (`POST /api/v1/devices/:id/command`).
* **Tugas Developer B:**
  - [ ] Membangun *Service Worker* (`public/sw.js`) untuk menyimpan *App Shell* `/player` agar tahan *cold-reboot* saat *offline*.
  - [ ] Membangun modul `SyncManager` (`IndexedDB` + `Cache Storage API` dengan verifikasi `SHA-256` sebelum *cutover* dan pembersihan *cache* yatim).
  - [ ] Membangun `LocalScheduler` (evaluasi jadwal tiap 1 detik dengan koreksi `clockOffsetMs`) dan `DoubleBufferedPlayer` (Slot A & Slot B tanpa kedip).
  - [ ] Membangun halaman **Schedule Manager** (`/admin/schedules`) untuk mengatur aturan jam tayang pagi/siang/akhir pekan dan prioritas.
* **Definition of Done (DoD Fase 3):** Saat koneksi jaringan diputus (atau HP masuk *Airplane Mode*), `/player` tetap memutar video tanpa jeda, tetap berganti jadwal pada jam yang ditentukan, dan tetap bisa di-*refresh* tanpa internet.

---

### Fase 4: Pemantauan Armada, *3-Tier Watchdog* & Persiapan Sidang/Demo
* **Target:** Sistem siap jalan 24/7 tanpa pengawasan, dilengkapi pemulihan mandiri (*self-healing*) dan *dashboard* pemantauan *live*.
* **Tugas Developer A:**
  - [ ] Mengimplementasikan endpoint log telemetri (`/api/v1/device/logs` & `/api/v1/devices/:id/logs`) serta pemangkasan log otomatis.
  - [ ] Menyelesaikan kalkulasi status `ONLINE` / `STALE` / `OFFLINE` dan statistik ringkasan *dashboard*.
  - [ ] Menyiapkan skrip `scripts/launch-kiosk.sh` untuk peluncuran otomatis Chromium Kiosk di Linux.
* **Tugas Developer B:**
  - [ ] Mengimplementasikan **3-Tier Watchdog** (deteksi video macet 5 detik, *React Error Boundary*, pembersihan *buffer* memori `<video>`, dan *soft-reload* pukul 03:30 pagi).
  - [ ] Menambahkan **Overlay Diagnostik Tersembunyi** pada `/player` (dibuka dengan mengetuk pojok kiri atas 5 kali).
  - [ ] Menyelesaikan **Dashboard Armada Live** (`/admin/devices` & `/admin`) lengkap dengan tombol **Force Sync**, **Reload Player**, **Clear Cache**, dan tampilan log perangkat.
* **Definition of Done (DoD Fase 4):** Seluruh skenario pada dokumen [`08-QA-TEST-PLAN.md`](./08-QA-TEST-PLAN.md) lulus 100%.
