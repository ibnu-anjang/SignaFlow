# 01. Product Requirements Document (PRD)

| Metadata Dokumen | Detail |
| :--- | :--- |
| **Nama Produk** | SignaFlow Digital Signage Platform |
| **Versi Dokumen** | 1.0.0 (Fase 0 - Baseline) |
| **Target Layar Utama** | Kiosk Berdiri Vertikal (Portrait `9:16`, Resolusi `1080x1920`) |
| **Target Akses Admin** | Browser Desktop (`16:9`) & Browser Mobile/HP (Responsive PWA) |
| **Status** | Disetujui untuk Fase 1 |

---

## 1. Latar Belakang & Pernyataan Masalah

Area komersial publik seperti *driving range* golf, klinik kesehatan, dan koridor mal mengoperasikan layar informasi dan promosi vertikal (`9:16`, `1080x1920`) selama 24 jam sehari, 7 hari seminggu. Pengelolaan layar menggunakan cara konvensional (colok *flashdisk* USB manual atau membuka halaman web biasa di *browser*) menimbulkan empat masalah operasional serius:

1. **Kegagalan Saat Wi-Fi Putus:** Koneksi Wi-Fi di area publik sering mengalami gangguan. Halaman web biasa akan menampilkan pesan *error browser* ("No Internet"), ikon *buffering*, atau layar putih kosong di hadapan pengunjung.
2. **Ketidakmampuan Ganti Konten Otomatis Berdasarkan Waktu (*Day-Parting*):** Materi promosi dan tabel harga sering berbeda antara pagi hari, siang/malam hari, dan akhir pekan. Mengganti *playlist* secara manual setiap pergantian jam sangat rawan lupa dan memakan tenaga staf.
3. **Kebocoran Antarmuka Sistem (*UI Leaks*):** *Browser* standar yang tidak dikunci berisiko menampilkan *address bar*, kursor *mouse*, *pop-up* notifikasi, *scrollbar*, atau berubah tampilan ketika layar tersentuh pengunjung.
4. **Buta Status Operasional di Lapangan:** Staf operasional tidak mengetahui apakah layar kiosk di ujung koridor sedang menyala normal, memutar jadwal yang benar, atau macet pada satu *frame* video.

---

## 2. Profil Pengguna & Aktor Sistem

### 2.1 Aktor Manusia: Admin / Operator Lokasi
* **Perangkat yang Digunakan:** Laptop/PC di ruang kantor (`16:9`) **dan Smartphone/HP** saat berkeliling lokasi.
* **Tanggung Jawab:**
  - Mengunggah materi gambar dan video vertikal (`1080x1920`).
  - Menyusun urutan *playlist* beserta durasi tampil per item.
  - Membuat jadwal waktu tayang (*day-parting*) harian maupun akhir pekan.
  - Melakukan *pairing* layar kiosk baru langsung di depan unit kiosk menggunakan HP.
  - Memantau status kesehatan seluruh layar dan mengirim perintah *Force Sync* / *Reload* jarak jauh.

### 2.2 Aktor Sistem: Perangkat Layar Kiosk (`/player`)
* **Perangkat yang Digunakan:** Mini-PC Linux / Raspberry Pi / Industrial Box yang terhubung ke panel layar vertikal `1080x1920` (atau HP/Tablet vertikal saat mode simulasi/demo).
* **Perilaku Otonom:**
  - Menyala otomatis (*auto-boot*) langsung ke layar penuh tanpa kursor dan tanpa *address bar*.
  - Menampilkan kode *pairing* 6 digit saat belum terdaftar.
  - Mengunduh dan memverifikasi keutuhan seluruh file video/gambar (`SHA-256`) ke penyimpanan lokal sebelum memutarnya.
  - Mengevaluasi jadwal *day-parting* setiap detik secara lokal tanpa bergantung pada koneksi internet.
  - Mengirim laporan kesehatan (*heartbeat*) setiap 30 detik dan mendengarkan perintah instan melalui SSE.

---

## 3. User Stories & Kriteria Penerimaan (*Acceptance Criteria*)

| ID | Sebagai... | Saya ingin... | Agar... | Kriteria Penerimaan (Acceptance Criteria) |
| :- | :--- | :--- | :--- | :--- |
| **US-01** | Operator Lapangan | Memasangkan kiosk baru dengan mengetik 6 digit kode lewat HP | Saya tidak perlu bolak-balik ke ruang komputer saat memasang kiosk di koridor | 1. Layar kiosk menampilkan kode 6 digit yang berlaku 10 menit.<br>2. Saat kode diklaim di CMS (via HP/Desktop), layar kiosk otomatis beralih ke mode pemutar dalam `< 3` detik. |
| **US-02** | Admin Pemasaran | Mengunggah video `.mp4` dan gambar `.png`/`.webp` dengan validasi otomatis | File yang rusak atau salah format tidak membuat kiosk *crash* | 1. Validasi *magic bytes* dan ukuran file (maks 25MB gambar, 250MB video).<br>2. Sistem menghitung *checksum* `SHA-256` otomatis.<br>3. Peringatan muncul jika dimensi media bukan rasio `9:16`. |
| **US-03** | Admin Pemasaran | Menyusun urutan item di dalam *playlist* baik lewat laptop maupun HP | Urutan promosi dan durasi tampil sesuai kebutuhan kampanye | 1. Setiap item memiliki durasi (min. 3 detik) dan tipe transisi (`CUT`/`CROSSFADE`).<br>2. Urutan item dapat diubah menggunakan tombol panah naik/turun (ramah layar sentuh HP) maupun *drag-and-drop*. |
| **US-04** | Admin Operasional | Menjadwalkan *Playlist Pagi* (`06:00-11:59`) dan *Playlist Siang* (`12:00-22:00`) serta jadwal khusus *Weekend* | Harga dan promo di layar berganti otomatis sesuai jam operasional | 1. Mendukung filter rentang tanggal, hari (`0..6`), jam mulai/selesai (`HH:mm`), dan prioritas (`1..100`).<br>2. Jika tidak ada jadwal aktif pada jam tertentu, kiosk otomatis memutar *Fallback Playlist*. |
| **US-05** | Kiosk Player | Tetap memutar video dan mengganti jadwal tepat waktu saat Wi-Fi lokasi mati total | Layar tidak pernah menampilkan pesan *error* internet kepada pengunjung | 1. Seluruh media disimpan di `Cache Storage` dan jadwal di `IndexedDB`.<br>2. Pergantian jadwal pukul `12:00:00` tetap berjalan akurat meski kabel LAN/Wi-Fi dicabut.<br>3. *Refresh* atau *reboot* saat *offline* tetap memuat aplikasi dari *Service Worker*. |
| **US-06** | Operator Teknis | Melihat status `ONLINE`/`OFFLINE` setiap layar dan menekan tombol *Force Refresh* | Saya bisa memastikan pembaruan promo langsung tayang atau menyegarkan layar dari jarak jauh | 1. Status diperbarui otomatis berdasarkan *heartbeat* 30 detik.<br>2. Perintah `SYNC_MANIFEST` atau `RELOAD_PLAYER` dieksekusi dalam `< 1` detik saat kiosk terhubung ke SSE. |

---

## 4. Kebutuhan Fungsional (*Functional Requirements*)

* **FR-01 (Manajemen & Validasi Media):**
  - Mendukung gambar (`.jpg`, `.jpeg`, `.png`, `.webp`) hingga 25 MB dan video (`.mp4` H.264, `.webm` VP9) hingga 250 MB.
  - Menghitung *hash* `SHA-256` untuk setiap file guna memastikan integritas unduhan di sisi kiosk.
  - Mencegah penghapusan aset media yang masih digunakan di dalam *playlist* aktif (`HTTP 409 Conflict`).
* **FR-02 (Penyusun Playlist & Versioning):**
  - Mendukung penambahan, penghapusan, pengurutan item, pengaturan durasi tampil (detik), dan pemilihan efek transisi (`CUT` atau `CROSSFADE`).
  - Setiap perubahan pada *playlist* otomatis menaikkan nomor `version` dan memperbarui nilai `manifestHash` untuk seluruh perangkat yang menggunakan *playlist* tersebut.
* **FR-03 (Mesin Penjadwal *Day-Parting*):**
  - Setiap jadwal memiliki atribut: `startDate`, `endDate` (opsional), `daysOfWeek` (`0=Minggu` s/d `6=Sabtu`), `startTime` (`HH:mm`), `endTime` (`HH:mm`), `priority` (`1-100`), dan target perangkat (`deviceId` spesifik atau `null` untuk global seluruh perangkat).
  - **Aturan Resolusi Konflik:**
    1. Jadwal spesifik perangkat maupun global yang aktif pada tanggal, hari, dan jam saat ini dikumpulkan sebagai kandidat.
    2. Kandidat dengan nilai `priority` tertinggi dipilih.
    3. Jika nilai `priority` sama, jadwal spesifik perangkat mengalahkan jadwal global; jika masih sama, jadwal dengan `updatedAt` paling baru dipilih.
    4. Jika tidak ada kandidat yang cocok, perangkat memutar `fallbackPlaylist`.
* **FR-04 (Pairing Perangkat 6 Digit):**
  - Kiosk menghasilkan `deviceKey` (UUID v4 persisten) dan meminta kode 6 digit dari server.
  - Kode berlaku selama 10 menit. Saat diklaim oleh Admin di CMS, server menerbitkan `deviceToken` acak 256-bit yang dikirim satu kali ke kiosk dan disimpan dalam bentuk *hash* `SHA-256` di tabel `devices`.
* **FR-05 (Telemetri Heartbeat & Log Perangkat):**
  - Kiosk mengirim *heartbeat* setiap 30 detik berisi `currentManifestHash`, `currentPlaylistId`, `currentMediaId`, `syncProgress` (`0-100`), `freeStorageMb`, dan `uptimeSeconds`.
  - Kiosk juga mengirim log kejadian penting (`BOOT`, `SYNC_COMPLETE`, `PLAYBACK_ERROR`, `COMMAND_ACK`).
* **FR-06 (Komando Jarak Jauh via SSE & Fallback Antrean):**
  - Mendukung 4 komando: `SYNC_MANIFEST`, `RELOAD_PLAYER`, `CLEAR_CACHE`, dan `UNPAIR_DEVICE`.
  - Jika kiosk sedang terhubung ke jalur SSE, komando diterima seketika. Jika koneksi SSE sedang terputus, komando disimpan pada kolom `devices.pending_command` dan dikirimkan pada respons *heartbeat* berikutnya.

---

## 5. Kebutuhan Non-Fungsional (*Non-Functional Requirements*)

* **NFR-01 (Ketahanan Offline Penuh):** Kiosk harus mampu beroperasi minimal 72 jam tanpa koneksi jaringan dan tahan terhadap siklus mati-nyala listrik (*cold boot*) dalam kondisi *offline*.
* **NFR-02 (Transisi *Zero-Flicker*):** Perpindahan antar media wajib menggunakan teknik *double-buffering* sehingga waktu jeda visual berada di bawah `16ms` (tanpa kedipan hitam atau *loading spinner*).
* **NFR-03 (Stabilitas Memori 24/7 & Watchdog):** Pemutar wajib membersihkan *decoder buffer* `<video>` setiap kali berganti item agar penggunaan RAM tidak bocor (*memory leak*). Jika video macet lebih dari 5 detik, *watchdog* wajib melompat ke item berikutnya secara otomatis.
* **NFR-04 (Responsivitas Mobile pada Admin CMS):** Antarmuka `/admin/*` wajib nyaman dioperasikan melalui layar ponsel (`360px` s/d `430px` lebar layar) dengan ukuran area sentuh tombol minimal `44x44px` serta mendukung tampilan desktop penuh.
* **NFR-05 (Penguncian Kanvas Kiosk 9:16):** Antarmuka `/player` wajib mengunci rasio `9:16` (`1080x1920`), menyembunyikan kursor *mouse*, serta menonaktifkan klik kanan, seleksi teks, dan *pinch-to-zoom*.

---

## 6. Batasan Ruang Lingkup (MVP vs. Di Luar Ruang Lingkup)

| Masuk Ruang Lingkup (MVP Fase 1 - 4) | Di Luar Ruang Lingkup (Pengembangan Masa Depan) |
| :--- | :--- |
| Autentikasi Admin & Operator (*single-organization*) | Sistem multi-perusahaan (*multi-tenant SaaS*) & integrasi pembayaran |
| Penyimpanan lokal berbasis Docker Volume + abstraksi siap S3 | Transkoding resolusi/codec video otomatis di sisi server (FFmpeg worker) |
| Kanvas pemutar `9:16` layar penuh (Video & Gambar) | Editor kanvas *multi-zone* (membagi layar menjadi *running text*, jam, cuaca) |
| Penjadwalan *day-parting* dengan prioritas & *fallback playlist* | Perhitungan impresi iklan terprogram (*Programmatic Proof-of-Play*) |
| Akses Admin via Desktop & HP + Pemutar PWA Chromium Kiosk | Pembuatan aplikasi native Android `.apk` atau Tizen/webOS Smart TV |
